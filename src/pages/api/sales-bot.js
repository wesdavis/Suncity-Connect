const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
const { Resend } = require('resend');

// Initialize our communication tools using your Vercel Environment Variables
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const msg = req.body.record;

    if (!msg || msg.status !== 'pending') {
      return res.status(200).json({ message: "Ignored - Not a pending message" });
    }

    console.log(`Processing new message: "${msg.incoming_message}"`);

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .or(`ig_account_id.eq.${msg.business_ig_id},fb_page_id.eq.${msg.business_ig_id}`)
      .single();

    if (clientError || !client) {
      console.error(`Client not found for Business IG ID: ${msg.business_ig_id}`);
      return res.status(200).json({ error: 'Client not found in Rolodex' });
    }

    if (client.is_bot_active === false) {
      console.log(`⏸️ Bot is currently PAUSED for ${client.business_name}. Ignoring DM.`);
      await supabase.from('b2b_inbox').update({ status: 'paused_by_user' }).eq('id', msg.id);
      return res.status(200).json({ message: "Ignored - Bot is paused by client" });
    }

    console.log(`🧠 Loaded brain for: ${client.business_name}`);
    const META_ACCESS_TOKEN = client.meta_access_token; 

    // --- FETCH THE VERIFIED MENU ---
    const { data: inventory } = await supabase
      .from('client_inventory')
      .select('item_name, price, stock_count')
      .eq('client_id', client.id);

    let menuString = "No active menu items available.";
    if (inventory && inventory.length > 0) {
      menuString = inventory.map(i => {
        const stockInfo = (i.stock_count !== null && i.stock_count < 9999) ? ` (Stock: ${i.stock_count})` : "";
        return `${i.item_name} - $${i.price.toFixed(2)}${stockInfo}`;
      }).join('\n');
    }

    const matchColumn = msg.meta_sender_id ? 'meta_sender_id' : 'ig_username';
    const matchValue = msg.meta_sender_id || msg.ig_username;

    const { data: chatHistory } = await supabase
      .from('b2b_inbox')
      .select('incoming_message, ai_reply')
      .eq(matchColumn, matchValue)
      .neq('id', msg.id)
      .order('created_at', { ascending: false })
      .limit(3);

    let historyString = "No previous history.";
    if (chatHistory && chatHistory.length > 0) {
      historyString = chatHistory.reverse().map(h => `Customer: ${h.incoming_message}\nYou: ${h.ai_reply}`).join('\n');
    }

    const escalationTriggers = ['human', 'manager', 'real person', 'complaint', 'pissed', 'wrong order', 'speak to someone', 'customer service', 'agent'];
    const needsHandoff = escalationTriggers.some(keyword => msg.incoming_message.toLowerCase().includes(keyword));

    let aiReply = "";
    let extractedData = { intent: "Unknown", phone: "Pending", email: "Pending", timeline: "Pending", status: "Cold" };
    let dbStatus = 'replied';

    if (needsHandoff) {
      console.log("🚨 Escalation triggered! Halting AI.");
      aiReply = "I understand. I am pausing my automated responses and pinging the team right now. A real human will jump into this chat shortly to help you out.";
      dbStatus = 'escalated';
      extractedData.intent = "Needs Human Assistance";
      extractedData.status = "Hot";
    } else {

      // --- 1. DEFINE THE CORE TOOLS ---
      const functionDeclarations = [
        {
          name: "send_sms",
          description: "Sends a text message directly to the customer's phone.",
          parameters: {
            type: "OBJECT",
            properties: {
              phone_number: { type: "STRING", description: "The customer's 10-digit phone number with country code (e.g., +15551234567)." },
              message: { type: "STRING", description: "The text message content to send." }
            },
            required: ["phone_number", "message"]
          }
        },
        {
          name: "send_email",
          description: "Sends an email to the customer.",
          parameters: {
            type: "OBJECT",
            properties: {
              customer_email: { type: "STRING", description: "The customer's email address." },
              subject: { type: "STRING", description: "The email subject line." },
              email_body: { type: "STRING", description: "The full text content of the email." }
            },
            required: ["customer_email", "subject", "email_body"]
          }
        }
      ];

      // --- 2. DYNAMIC CASHIER INJECTION ---
      let dynamicMenuSection = "";
      let dynamicCashierRule = "";
      const isRetailClient = inventory && inventory.length > 0;

      if (isRetailClient) {
        functionDeclarations.push({
          name: "generate_checkout_link",
          description: "Generates a secure payment link. ONLY call this when the customer specifies exact items from the menu and is ready to buy.",
          parameters: {
            type: "OBJECT",
            properties: {
              items: {
                type: "ARRAY",
                description: "List of items the customer wants to purchase.",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING", description: "The exact name of the item from the verified menu." },
                    quantity: { type: "INTEGER", description: "How many of this item the customer wants." }
                  },
                  required: ["name", "quantity"]
                }
              }
            },
            required: ["items"]
          }
        });

        dynamicMenuSection = `\n--- VERIFIED MENU & PRICING ---\n${menuString}\n`;
        dynamicCashierRule = `\n6. THE CASHIER RULE: Only sell items from the VERIFIED MENU above. Do not invent items or prices. If the customer asks for a generic item and there are multiple options, you MUST ask them to clarify which one they want before generating a checkout link. When the customer confirms their exact order, use the generate_checkout_link tool to get their payment URL.\n7. SCARCITY TRIGGER: When listing items or answering questions about the menu, if an item's Stock count is 3 or less, you must organically append a sense of urgency to close the sale (e.g., "These are going quick, it would be wise to purchase now!").`;
      }

      const salesTools = [{ functionDeclarations }];

      // --- ⏰ TIMEZONE & HOURS AWARENESS ---
      // This grabs the exact current time formatted like "Monday, 10:15 PM"
      const currentLocalTime = new Date().toLocaleString('en-US', {
        timeZone: client.timezone || 'America/Denver',
        weekday: 'long',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });

      const timeContext = `\n--- TIME & AVAILABILITY ---
      Current Local Time: ${currentLocalTime}
      Business Hours: ${client.hours || '24/7'}
      CRITICAL RULE: You must check the Current Local Time against the Business Hours. If the business is currently CLOSED, you CANNOT generate a checkout link or take orders. Politely inform the customer that the store/kitchen is closed, state the normal hours, and tell them when they can order next.`;

      // 3. INJECT TOOLS INTO GEMINI
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.6-flash",
        tools: salesTools
      });

      const prompt = `You are the elite digital sales closer and lead capture assistant for a local business. 

      --- BUSINESS KNOWLEDGE ---
      ${client.custom_prompt}
      ${dynamicMenuSection}
      ${timeContext}
      
      --- CRITICAL CLOSING RULES ---
      1. KEEP IT PUNCHY: You are in an Instagram DM. Use 2-3 short, conversational sentences max.
      2. SMS ACTION: If the customer asks for a text or provides a phone number for info, USE the send_sms tool. 
      3. EMAIL ACTION: If the customer asks for an email or provides an email address, USE the send_email tool.
      4. THE DEMO TRIGGER: If the customer's message contains the word "DEMO", immediately reply with: "Awesome! Let's get your custom bot built. Grab a quick time on Wes's calendar here: https://calendar.app.google/rbTHX427Am9dFxhN9" and stop asking questions.
      5. MEMORY CHECK: Read the "Recent Conversation" below. If the customer already provided their phone number or email, DO NOT ask for it again. ${dynamicCashierRule}

      --- RECENT CONVERSATION (Memory) ---
      ${historyString}

      --- NEW MESSAGE TO REPLY TO ---
      CUSTOMER MESSAGE: "${msg.incoming_message}"
      
      Draft the DM reply or execute a tool:`;
      
      const result = await model.generateContent(prompt);
      
      // --- 3. THE INTERCEPTION LOOP (FORTIFIED) ---
      const functionCalls = typeof result.response.functionCalls === 'function' 
        ? result.response.functionCalls() 
        : result.response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        console.log(`🤖 AI attempting to use tool: ${call.name}`);
        
        if (call.name === "send_sms") {
          const phone_number = call.args?.phone_number;
          const message = call.args?.message;
          
          if (!phone_number || !message) {
            console.error("AI failed to provide phone or message arguments.");
            aiReply = "I missed that phone number! Could you type it out for me one more time?";
          } else {
            console.log(`📱 Firing SMS to: ${phone_number}`);
            try {
              await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone_number
              });
              aiReply = `I just shot that text over to ${phone_number}! Let me know if you need anything else. 🚀`;
              extractedData.phone = phone_number;
              extractedData.status = "Hot";
            } catch (err) {
              console.error("Twilio Error:", err);
              aiReply = "I tried to shoot you a text, but the number didn't quite go through. Could you verify it for me?";
            }
          }
        } 
        
        else if (call.name === "send_email") {
          const customer_email = call.args?.customer_email;
          const subject = call.args?.subject || "Information from Sun City Connect";
          const email_body = call.args?.email_body;

          if (!customer_email || !email_body) {
            console.error("AI failed to provide email or body arguments.");
            aiReply = "I missed that email address! Could you type it out for me again?";
          } else {
            console.log(`✉️ Firing Email to: ${customer_email}`);
            const cleanBusinessName = client.business_name.replace(/['"]/g, '');

            try {
              await resend.emails.send({
                from: `${cleanBusinessName} Ai Assistant <AiAssistant@suncityconnect.com>`,
                to: customer_email,
                subject: subject,
                text: email_body
              });
              aiReply = `I've successfully sent an email over to ${customer_email}! It should be in your inbox shortly. 🚀`;
              extractedData.email = customer_email;
              extractedData.status = "Hot";
            } catch (err) {
              console.error("Resend Error:", err);
              aiReply = "I tried to send that email, but hit a glitch. Could you double-check the spelling of your email address?";
            }
          }
        }

        else if (call.name === "generate_checkout_link") {
          const items = Array.isArray(call.args?.items) ? call.args.items : []; 
          
          if (items.length === 0) {
            console.error("AI triggered checkout but passed an empty or invalid items array.");
            aiReply = "I want to make sure I get your order exactly right. Could you tell me one more time which items you wanted from the menu?";
          } else {
            console.log(`🛒 Generating checkout link for ${items.length} items...`);
            
            try {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
              const checkoutRes = await fetch(`${baseUrl}/api/checkout-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientId: client.id, 
                  items: items
                })
              });
              
              const textRes = await checkoutRes.text();
              let checkoutData;
              
              try {
                  checkoutData = JSON.parse(textRes);
              } catch (parseError) {
                  console.error("API returned non-JSON/HTML 500 error:", textRes);
                  throw new Error("Backend API crashed heavily.");
              }
              
              if (checkoutData.success) {
                aiReply = `Awesome! Your total comes to $${(checkoutData.total).toFixed(2)}. You can securely pay and send your order straight to the kitchen right here: ${checkoutData.url} 🚀`;
                extractedData.status = "Hot";
                extractedData.intent = "Ready to Purchase";
              } else {
                aiReply = `I hit a slight snag calculating that: ${checkoutData.error || "Item mismatch"}. Let's try that again, what exact items did you want?`;
              }
            } catch (err) {
              console.error("Checkout Engine Error:", err);
              aiReply = "I'm having a little trouble connecting to our payment processor right now. Let me get a human to jump in and help finalize this!";
              dbStatus = 'escalated';
            }
          }
        }
        
        else {
          console.error(`⚠️ AI Hallucination Caught: Attempted to call unknown tool '${call.name}'`);
          aiReply = "Give me just a second to figure that out! If I can't, I'll have a human team member jump in.";
        }

      } else {
        aiReply = result.response?.text() || "";
      }

      if (!aiReply || typeof aiReply !== 'string' || aiReply.trim() === "") {
        console.error("🚨 CRITICAL: aiReply was completely empty before hitting Meta.");
        aiReply = "I'm experiencing a quick technical hiccup! A human will be right with you.";
        dbStatus = 'escalated';
      }

      if (!functionCalls) {
        console.log("  Extracting lead intelligence...");
        const analystModel = genAI.getGenerativeModel({ 
          model: "gemini-3.5-flash-lite"
        });
        const extractionPrompt = `Analyze this Instagram or Facebook DM sent to a local business: "${msg.incoming_message}"
        
        Extract the following information and output ONLY a valid, raw JSON object with these exact keys (no markdown formatting):
        {
          "intent": "Brief 2-4 word summary of what they want",
          "phone": "Any phone number found, or 'Pending'",
          "email": "Any email address found, or 'Pending'",
          "timeline": "Any mentioned timeframe, or 'Pending'",
          "status": "Rate as 'Hot', 'Warm', or 'Cold'"
        }`;

        try {
          const analystResult = await analystModel.generateContent(extractionPrompt);
          const jsonText = analystResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          extractedData = JSON.parse(jsonText);
          console.log("📊 Extraction complete:", extractedData);
        } catch (e) {
          console.error("❌ Failed to parse extracted JSON:", e);
        }
      }
    }

    const metaPayload = {
      recipient: { id: msg.meta_sender_id || msg.ig_username },
      message: { text: aiReply }
    };

    const metaResponse = await fetch('https://graph.facebook.com/v25.0/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`
      },
      body: JSON.stringify(metaPayload)
    });

    if (!metaResponse.ok) {
      const err = await metaResponse.json();
      console.error("Meta API Error:", err);
      return res.status(500).json({ error: "Failed to send DM", details: err });
    }

    await supabase
      .from('b2b_inbox')
      .update({ 
        ai_reply: aiReply, 
        status: dbStatus, 
        extracted_data: extractedData,
        user_id: client.user_id 
      })
      .eq('id', msg.id);

    return res.status(200).json({ success: true, message: "DM Sent & Lead Extracted!" });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
};