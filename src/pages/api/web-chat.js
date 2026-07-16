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

    // 1. Resolve client profile and fetch settings
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('custom_prompt, ig_account_id, business_name, is_bot_active, user_id, pdf_knowledge, timezone, booking_link, appointment_duration')
      .eq('custom_domain', domain)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Storefront account not found' });
    }

    if (!client.is_bot_active) {
      return res.status(200).json({ reply: "Our chat agent is currently offline. Please use our booking link." });
    }

    // Pass the EXACT timezone offset to the AI to prevent the 6-hour UTC bug
    const clientTimezone = client.timezone || 'America/Denver';
    const currentDateContext = new Date().toLocaleString("en-US", { 
      timeZone: clientTimezone,
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'shortOffset' // This outputs e.g., "GMT-6"
    });

    let memoryString = "No previous history.";
    if (history && history.length > 0) {
      // Expanded to 12 to prevent amnesia during back-and-forth booking negotiations
      memoryString = history.slice(-12).map(h => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n');
    }

    const escalationTriggers = ['human', 'manager', 'real person', 'complaint', 'pissed', 'wrong order', 'speak to someone', 'customer service', 'agent'];
    const needsHandoff = escalationTriggers.some(keyword => message.toLowerCase().includes(keyword));

    let aiReply = "";
    let extractedData = { intent: "Website Visitor", phone: "Pending", email: "Pending", timeline: "Pending", status: "Cold" };
    let dbStatus = 'replied';

    if (needsHandoff) {
      aiReply = "I understand. I am pausing my automated responses and pinging the team right now. A real human will jump into this chat shortly to help you out.";
      dbStatus = 'escalated';
      extractedData.intent = "Needs Human Assistance";
      extractedData.status = "Hot"; 
    } else {
      
      const storefrontTools = [{
        functionDeclarations: [
          {
            name: "send_email",
            description: "Sends an email to the customer containing menus, business information, or follow-ups.",
            parameters: {
              type: "OBJECT",
              properties: {
                customer_email: { type: "STRING", description: "The customer's valid email address." },
                subject: { type: "STRING", description: "The email subject line." },
                email_body: { type: "STRING", description: "The full text content of the email." }
              },
              required: ["customer_email", "subject", "email_body"]
            }
          },
          {
            name: "check_and_book_appointment",
            description: "Checks availability and books an appointment directly onto the business's native calendar.",
            parameters: {
              type: "OBJECT",
              properties: {
                customer_name: { type: "STRING", description: "The customer's full name or first name." },
                customer_email: { type: "STRING", description: "The customer's email address." },
                appointment_time: { 
                  type: "STRING", 
                  description: "The requested date/time in ISO format WITH the local UTC offset (e.g., 2026-07-20T19:00:00-06:00). NEVER use 'Z'." 
                },
                service_type: { type: "STRING", description: "The specific service they are booking, if mentioned." }
              },
              required: ["customer_name", "customer_email", "appointment_time"]
            }
          }
        ]
      }];

      const chatModel = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash",
        tools: storefrontTools
      });

      const chatPrompt = `
        You are the elite digital receptionist and client qualification agent for ${client.business_name}.
        
        --- CRITICAL TIME CONTEXT ---
        Today's date and current time for this business is: ${currentDateContext}. 
        Appointments take ${client.appointment_duration || 60} minutes. 
        When using the booking tool, you MUST format the ISO string using the exact GMT offset provided above.
        
        --- CORE SERVICE RULES & TIMELINES ---
        ${client.custom_prompt}
        
        --- ATTACHED REFERENCE DOCUMENTS & MENUS ---
        ${client.pdf_knowledge || "No additional business documents uploaded."}
        
        --- CONVERSATIONAL MANDATES ---
        1. Be highly professional, casual, and brief. Use 1-3 short sentences maximum.
        2. EMAIL ACTION: IF the customer explicitly asks for an email OR provides an email address to receive files/information, YOU MUST USE the send_email tool immediately. 
        3. CALENDAR ACTION: If the customer wants to book a time/appointment and provides their name, email, and desired time, USE the check_and_book_appointment tool.
        4. MISSING BOOKING INFO: If they want to book, check the CONVERSATIONAL MEMORY first. If they already provided their name or email earlier in the chat, DO NOT ask for it again. Only ask for the specific details that are still missing.
        5. THIRD PARTY CALENDAR: If this business has a custom booking link (${client.booking_link || "None provided"}), provide them the link instead of using the native tool.
        
        --- CONVERSATIONAL MEMORY ---
        ${memoryString}
        
        --- CURRENT CUSTOMER MESSAGE ---
        "${message}"
        Draft your immediate reply response text or execute a tool below:
      `;

      const chatResult = await chatModel.generateContent(chatPrompt);
      
      const functionCalls = typeof chatResult.response.functionCalls === 'function' 
        ? chatResult.response.functionCalls() 
        : chatResult.response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const cleanBusinessName = client.business_name.replace(/['"]/g, '');
        
        // --- STANDARD EMAIL EXECUTION ---
        if (call.name === "send_email") {
          const { customer_email, subject, email_body } = call.args;
          console.log(`✉️ AI firing Email to: ${customer_email}`);
          try {
            await resend.emails.send({
              from: `${cleanBusinessName} Assistant <assistant@suncityconnect.com>`, 
              to: customer_email,
              subject: subject,
              text: email_body
            });
            aiReply = `I've successfully sent an email over to ${customer_email}! It should be in your inbox shortly. 🚀`;
            extractedData = { ...extractedData, email: customer_email, status: "Hot", intent: "Email requested and sent" };
          } catch (err) {
            console.error("Resend Error:", err);
            aiReply = "I tried to send that email, but hit a technical glitch. Could you double-check the spelling of your email address?";
          }
        }
        
        // --- CALENDAR & AUTO-EMAIL EXECUTION ---
        else if (call.name === "check_and_book_appointment") {
          const { customer_name, customer_email, appointment_time, service_type } = call.args;
          console.log(`📅 AI booking attempt: ${appointment_time} for ${customer_name}`);

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

            const hasConflict = existingAppts.some(appt => {
              const existStart = new Date(appt.appointment_time);
              const existEnd = appt.end_time ? new Date(appt.end_time) : new Date(existStart.getTime() + durationMinutes * 60000);
              return (proposedStart < existEnd && proposedEnd > existStart);
            });

            if (hasConflict) {
              const readableTime = proposedStart.toLocaleString("en-US", { timeZone: clientTimezone, weekday: 'short', hour: 'numeric', minute: '2-digit' });
              aiReply = `I'm so sorry, but it looks like that block around ${readableTime} is already taken! Do you have another time in mind that might work?`;
            } else {
              
              // 1. Slot is clear, write to database
              const { error: insertError } = await supabase
                .from('appointments')
                .insert([{
                  user_id: client.user_id,
                  customer_name: customer_name,
                  customer_email: customer_email,
                  appointment_time: proposedStart.toISOString(),
                  end_time: proposedEnd.toISOString(),
                  service_type: service_type || 'General Booking',
                  status: 'confirmed'
                }]);

              if (insertError) throw insertError;

              const successDate = proposedStart.toLocaleString("en-US", { timeZone: clientTimezone, weekday: 'long', month: 'long', day: 'numeric' });
              const successTime = proposedStart.toLocaleString("en-US", { timeZone: clientTimezone, hour: 'numeric', minute: '2-digit' });
              
              // 2. Draft AI Reply
              aiReply = `Perfect, ${customer_name}! You are all locked in for ${successDate} at ${successTime}. I just sent a confirmation email to ${customer_email}!`;
              extractedData = { ...extractedData, email: customer_email, status: "Hot", intent: "Appointment Confirmed", timeline: `${successDate} at ${successTime}` };

              // 3. SILENT AUTO-EMAIL TRIGGER
              if (customer_email && customer_email.includes('@')) {
                try {
                  await resend.emails.send({
                    from: `${cleanBusinessName} <assistant@suncityconnect.com>`, 
                    to: customer_email,
                    subject: `Appointment Confirmed: ${cleanBusinessName}`,
                    text: `Hi ${customer_name},\n\nYou are all set! Your appointment is confirmed for ${successDate} at ${successTime}.\n\nIf you need to reschedule or have any questions, just reply directly to this email.\n\nThanks,\n${cleanBusinessName}`
                  });
                  console.log(`✉️ Auto-confirmation sent to: ${customer_email}`);
                } catch (emailErr) {
                  console.error("Auto-email Resend Error:", emailErr);
                }
              }
            }
          } catch (err) {
            console.error("Calendar DB Error:", err);
            aiReply = "I tried to lock in that time, but our calendar system is updating. Could you give me that time one more time?";
          }
        }

      } else {
        // Fallback: Gemini just wanted to chat normally
        aiReply = chatResult.response.text().trim();
        
        console.log("🔍 Extracting lead intelligence...");
        const analystModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const extractionPrompt = `
          Analyze this entire conversation history between a customer and an AI assistant:
          ${memoryString}
          Customer: "${message}"

          Extract parameters and return a valid JSON object matching these exact keys. Output ONLY raw JSON:
          {
            "intent": "2-4 word summary of customer need based on the entire conversation",
            "phone": "Extracted phone sequence or 'Pending'",
            "email": "Extracted email address string or 'Pending'",
            "timeline": "Time context or 'Pending'",
            "status": "'Hot' if contact info or immediate buying urgency is found, otherwise 'Warm' or 'Cold'"
          }
        `;

        try {
          const analystResult = await analystModel.generateContent(extractionPrompt);
          const rawText = analystResult.response.text();
          const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
          extractedData = JSON.parse(cleanJsonText);
        } catch (e) {
          console.error("AI Parser exception:", e);
        }
      }
    }

    await supabase.from('b2b_inbox').insert([{
      ig_username: `Web_${visitorId.substring(0, 6)}`,
      incoming_message: message,
      ai_reply: aiReply,
      status: dbStatus,
      business_ig_id: client.ig_account_id || 'website_only_client',
      user_id: client.user_id,
      platform: 'Website',
      lead_source: 'Storefront Live Chat',
      extracted_data: extractedData
    }]);

    return res.status(200).json({ success: true, reply: aiReply });

  } catch (error) {
    console.error("Critical server error inside web-chat engine:", error);
    return res.status(500).json({ error: error.message });
  }
};