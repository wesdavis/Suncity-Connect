const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Resend } = require('resend');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, message, history, visitorId } = req.body;
    if (!domain || !message || !visitorId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Include id so we can load inventory + generate checkout links
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, custom_prompt, ig_account_id, business_name, is_bot_active, user_id, pdf_knowledge, timezone, booking_link, appointment_duration, hours')
      .eq('custom_domain', domain)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Storefront account not found' });
    }
    if (!client.is_bot_active) {
      return res.status(200).json({ reply: 'Our chat agent is currently offline. Please use our booking link.' });
    }

    const clientTimezone = client.timezone || 'America/Denver';
    const currentDateContext = new Date().toLocaleString('en-US', {
      timeZone: clientTimezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'shortOffset',
    });

    const memoryString =
      history && history.length > 0
        ? history.slice(-12).map((h) => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n')
        : 'No previous history.';

    const escalationTriggers = [
      'human', 'manager', 'real person', 'complaint', 'pissed',
      'wrong order', 'speak to someone', 'customer service', 'agent',
    ];
    const needsHandoff = escalationTriggers.some((k) => message.toLowerCase().includes(k));

    let aiReply = '';
    let checkoutUrl = null;
    let checkoutTotal = null;
    let extractedData = {
      intent: 'Website Visitor',
      phone: 'Pending',
      email: 'Pending',
      timeline: 'Pending',
      status: 'Cold',
    };
    let dbStatus = 'replied';

    if (needsHandoff) {
      aiReply =
        'I understand. I am pausing my automated responses and pinging the team right now. A real human will jump into this chat shortly to help you out.';
      dbStatus = 'escalated';
      extractedData.intent = 'Needs Human Assistance';
      extractedData.status = 'Hot';
    } else {
      // --- LOAD VERIFIED INVENTORY ---
      const { data: inventory } = await supabase
        .from('client_inventory')
        .select('item_name, price, stock_count')
        .eq('client_id', client.id);

      let menuString = 'No active menu items available.';
      if (inventory && inventory.length > 0) {
        menuString = inventory
          .map((i) => {
            const stockInfo =
              i.stock_count !== null && i.stock_count < 9999 ? ` (Stock: ${i.stock_count})` : '';
            return `${i.item_name} - $${Number(i.price).toFixed(2)}${stockInfo}`;
          })
          .join('\n');
      }

      const isRetailClient = inventory && inventory.length > 0;

      // --- BASE TOOLS ---
      const functionDeclarations = [
        {
          name: 'send_email',
          description:
            'Sends an email to the customer containing menus, business information, or follow-ups.',
          parameters: {
            type: 'OBJECT',
            properties: {
              customer_email: { type: 'STRING', description: "The customer's valid email address." },
              subject: { type: 'STRING', description: 'The email subject line.' },
              email_body: { type: 'STRING', description: 'The full text content of the email.' },
            },
            required: ['customer_email', 'subject', 'email_body'],
          },
        },
        {
          name: 'check_and_book_appointment',
          description:
            "Checks availability and books an appointment directly onto the business's native calendar.",
          parameters: {
            type: 'OBJECT',
            properties: {
              customer_name: {
                type: 'STRING',
                description: "The customer's full name or first name.",
              },
              customer_email: {
                type: 'STRING',
                description: "The customer's email address.",
              },
              customer_phone: {
                type: 'STRING',
                description: "The customer's phone number if provided.",
              },
              appointment_time: {
                type: 'STRING',
                description:
                  'The requested date/time in ISO format WITH the local UTC offset (e.g., 2026-07-20T19:00:00-06:00). NEVER use Z.',
              },
              service_type: {
                type: 'STRING',
                description: 'The specific service they are booking, if mentioned.',
              },
            },
            required: ['customer_name', 'customer_email', 'appointment_time'],
          },
        },
      ];

      let dynamicMenuSection = '';
      let dynamicCashierRule = '';

      if (isRetailClient) {
        functionDeclarations.push({
          name: 'generate_checkout_link',
          description:
            'Generates a secure payment link. ONLY call this when the customer specifies exact items from the verified menu and is ready to buy / place an order (including to-go, pickup, and product orders).',
          parameters: {
            type: 'OBJECT',
            properties: {
              items: {
                type: 'ARRAY',
                description: 'List of items the customer wants to purchase.',
                items: {
                  type: 'OBJECT',
                  properties: {
                    name: {
                      type: 'STRING',
                      description: 'The exact name of the item from the verified menu.',
                    },
                    quantity: {
                      type: 'INTEGER',
                      description: 'How many of this item the customer wants.',
                    },
                  },
                  required: ['name', 'quantity'],
                },
              },
            },
            required: ['items'],
          },
        });

        dynamicMenuSection = `\n--- VERIFIED MENU & PRICING (SOURCE OF TRUTH) ---\n${menuString}\n`;
        dynamicCashierRule = `
6. ORDERING / CASHIER RULE: You CAN take to-go, pickup, and product orders. Only sell items from the VERIFIED MENU above. Do not invent items or prices. If the customer asks for something generic and there are multiple options, ask them to clarify the exact item before generating a checkout link. When they confirm exact items and quantities, USE the generate_checkout_link tool to create their payment URL.
7. SCARCITY: If an item's Stock count is 3 or less, organically mention urgency (e.g. "Only a few left — good idea to grab it now.").
8. If they ask "do you do to-go / takeout / online orders?" the answer is YES when menu items exist — help them pick items and check out.`;
      }

      const storefrontTools = [{ functionDeclarations }];

      const chatModel = genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        tools: storefrontTools,
      });

      const chatPrompt = `You are the elite digital receptionist, order taker, and client qualification agent for ${client.business_name}.

--- CRITICAL TIME CONTEXT ---
Today's date and current time for this business is: ${currentDateContext}.
Appointments take ${client.appointment_duration || 60} minutes.
Business Hours: ${client.hours || 'Assume open unless custom rules say otherwise'}.
When using the booking tool, you MUST format the ISO string using the exact GMT offset provided above.

--- CORE SERVICE RULES & TIMELINES ---
${client.custom_prompt || 'No custom rules provided.'}

--- ATTACHED REFERENCE DOCUMENTS ---
${client.pdf_knowledge || 'No additional business documents uploaded.'}
${dynamicMenuSection}

--- CONVERSATIONAL MANDATES ---
1. Be highly professional, casual, and brief. Use 1-3 short sentences maximum.
2. EMAIL ACTION: IF the customer explicitly asks for an email OR provides an email address to receive files/information, YOU MUST USE the send_email tool immediately.
3. CALENDAR ACTION: If the customer wants to book a time/appointment and provides their name, email, and desired time, USE the check_and_book_appointment tool.
4. MISSING BOOKING INFO: If they want to book, check the CONVERSATIONAL MEMORY first. If they already provided their name or email earlier, DO NOT ask for it again.
5. THIRD PARTY CALENDAR: If this business has a custom booking link (${client.booking_link || 'None provided'}), provide them the link instead of using the native tool when appropriate.
${dynamicCashierRule}

--- CONVERSATIONAL MEMORY ---
${memoryString}

--- CURRENT CUSTOMER MESSAGE ---
"${message}"

Draft your immediate reply response text or execute a tool below:`;

      const chatResult = await chatModel.generateContent(chatPrompt);
      const functionCalls =
        typeof chatResult.response.functionCalls === 'function'
          ? chatResult.response.functionCalls()
          : chatResult.response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const cleanBusinessName = client.business_name.replace(/['"]/g, '');

        if (call.name === 'send_email') {
          const { customer_email, subject, email_body } = call.args;
          try {
            await resend.emails.send({
              from: `${cleanBusinessName} Assistant <assistant@suncityconnect.com>`,
              to: customer_email,
              subject,
              text: email_body,
            });
            aiReply = `I've successfully sent an email over to ${customer_email}! It should be in your inbox shortly. 🚀`;
            extractedData = {
              ...extractedData,
              email: customer_email,
              status: 'Hot',
              intent: 'Email requested and sent',
            };
          } catch (err) {
            aiReply =
              'I tried to send that email, but hit a technical glitch. Could you double-check the spelling of your email address?';
          }
        } else if (call.name === 'check_and_book_appointment') {
          const {
            customer_name,
            customer_email,
            customer_phone,
            appointment_time,
            service_type,
          } = call.args;
          try {
            const durationMinutes = client.appointment_duration || 60;
            const proposedStart = new Date(appointment_time);
            const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60000);
            const dayStart = new Date(proposedStart);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(proposedStart);
            dayEnd.setHours(23, 59, 59, 999);

            const { data: existingAppts, error: fetchError } = await supabase
              .from('appointments')
              .select('appointment_time, end_time')
              .eq('user_id', client.user_id)
              .neq('status', 'cancelled')
              .gte('appointment_time', dayStart.toISOString())
              .lte('appointment_time', dayEnd.toISOString());

            if (fetchError) throw fetchError;

            const hasConflict = existingAppts.some((appt) => {
              const existStart = new Date(appt.appointment_time);
              const existEnd = appt.end_time
                ? new Date(appt.end_time)
                : new Date(existStart.getTime() + durationMinutes * 60000);
              return proposedStart < existEnd && proposedEnd > existStart;
            });

            if (hasConflict) {
              const readableTime = proposedStart.toLocaleString('en-US', {
                timeZone: clientTimezone,
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit',
              });
              aiReply = `I'm so sorry, but it looks like that block around ${readableTime} is already taken! Do you have another time in mind that might work?`;
            } else {
              const { error: insertError } = await supabase.from('appointments').insert([
                {
                  user_id: client.user_id,
                  customer_name,
                  customer_email,
                  customer_phone: customer_phone || null,
                  appointment_time: proposedStart.toISOString(),
                  end_time: proposedEnd.toISOString(),
                  service_type: service_type || 'General Booking',
                  status: 'confirmed',
                },
              ]);
              if (insertError) throw insertError;

              const successDate = proposedStart.toLocaleString('en-US', {
                timeZone: clientTimezone,
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              });
              const successTime = proposedStart.toLocaleString('en-US', {
                timeZone: clientTimezone,
                hour: 'numeric',
                minute: '2-digit',
              });
              aiReply = `Perfect, ${customer_name}! You are all locked in for ${successDate} at ${successTime}. I just sent a confirmation email to ${customer_email}!`;
              extractedData = {
                ...extractedData,
                email: customer_email,
                phone: customer_phone || extractedData.phone,
                status: 'Hot',
                intent: 'Appointment Confirmed',
                timeline: `${successDate} at ${successTime}`,
              };

              if (customer_email && customer_email.includes('@')) {
                try {
                  await resend.emails.send({
                    from: `${cleanBusinessName} <assistant@suncityconnect.com>`,
                    to: customer_email,
                    subject: `Appointment Confirmed: ${cleanBusinessName}`,
                    text: `Hi ${customer_name},\n\nYou are all set! Your appointment is confirmed for ${successDate} at ${successTime}.\n\nIf you need to reschedule or have any questions, just reply directly to this email.\n\nThanks,\n${cleanBusinessName}`,
                  });
                } catch (emailErr) {
                  console.error('Auto-email Resend Error:', emailErr);
                }
              }
            }
          } catch (err) {
            console.error('Calendar DB Error:', err);
            aiReply =
              'I tried to lock in that time, but our calendar system is updating. Could you give me that time one more time?';
          }
        } else if (call.name === 'generate_checkout_link') {
          const items = Array.isArray(call.args?.items) ? call.args.items : [];

          if (items.length === 0) {
            aiReply =
              'I want to make sure I get your order exactly right. Could you tell me one more time which items you wanted from the menu?';
          } else {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://suncityconnect.com';
              const checkoutRes = await fetch(`${baseUrl}/api/checkout-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientId: client.id,
                  items,
                }),
              });

              const textRes = await checkoutRes.text();
              let checkoutData;
              try {
                checkoutData = JSON.parse(textRes);
              } catch (parseError) {
                console.error('Checkout API returned non-JSON:', textRes);
                throw new Error('Checkout API returned invalid response');
              }

              if (checkoutData.success) {
                checkoutUrl = checkoutData.url;
                checkoutTotal = Number(checkoutData.total);
                // URL kept in reply as a fallback; storefront UI strips it and shows a Pay button
                aiReply = `Awesome! Your total comes to $${checkoutTotal.toFixed(2)}. Tap the button below to pay securely and we'll get your order started. 🚀\n\n${checkoutData.url}`;
                extractedData.status = 'Hot';
                extractedData.intent = 'Ready to Purchase';
              } else {
                aiReply = `I hit a slight snag with that order: ${checkoutData.error || 'Item mismatch'}. What exact items did you want from the menu?`;
              }
            } catch (err) {
              console.error('Storefront Checkout Error:', err);
              aiReply =
                "I'm having a little trouble connecting to our payment system right now. Let me get a human to help finalize this for you!";
              dbStatus = 'escalated';
            }
          }
        }
      } else {
        aiReply = chatResult.response.text().trim();
        const analystModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
        const extractionPrompt = `Analyze this conversation history between customer and assistant:
${memoryString}
Customer: "${message}"

Extract parameters and return a valid JSON object with exact keys: {"intent": "2-4 word summary", "phone": "number or 'Pending'", "email": "email or 'Pending'", "timeline": "time context or 'Pending'", "status": "'Hot' if info/urgency found, else 'Warm'/'Cold'"}. Return raw JSON only.`;
        try {
          const analystResult = await analystModel.generateContent(extractionPrompt);
          const cleanJsonText = analystResult.response
            .text()
            .replace(/```json/gi, '')
            .replace(/```/gi, '')
            .trim();
          extractedData = JSON.parse(cleanJsonText);
        } catch (e) {
          console.error('AI Parser exception:', e);
        }
      }
    }

    await supabase.from('b2b_inbox').insert([
      {
        ig_username: `Web_${visitorId.substring(0, 6)}`,
        incoming_message: message,
        ai_reply: aiReply,
        status: dbStatus,
        business_ig_id: client.ig_account_id || 'website_only_client',
        user_id: client.user_id,
        platform: 'Website',
        lead_source: 'Storefront Live Chat',
        extracted_data: extractedData,
      },
    ]);

    return res.status(200).json({
      success: true,
      reply: aiReply,
      checkoutUrl: checkoutUrl || null,
      checkoutTotal: checkoutTotal != null ? checkoutTotal : null,
    });
  } catch (error) {
    console.error('Critical server error inside web-chat engine:', error);
    return res.status(500).json({ error: error.message });
  }
};
