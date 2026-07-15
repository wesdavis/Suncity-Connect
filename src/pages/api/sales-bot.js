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

      // --- 1. DEFINE THE TOOLS ---
      const salesTools = [{
        functionDeclarations: [
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
        ]
      }];

      // 2. INJECT TOOLS INTO GEMINI
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash",
        tools: salesTools
      });

      const prompt = `You are the elite digital sales closer and lead capture assistant for a local business. 

      --- BUSINESS KNOWLEDGE ---
      ${client.custom_prompt}
      
      --- CRITICAL CLOSING RULES ---
      1. KEEP IT PUNCHY: You are in an Instagram DM. Use 2-3 short, conversational sentences max.
      2. SMS ACTION: If the customer asks for a text or provides a phone number for info, USE the send_sms tool. 
      3. EMAIL ACTION: If the customer asks for an email or provides an email address, USE the send_email tool.
      4. THE DEMO TRIGGER: If the customer's message contains the word "DEMO", immediately reply with: "Awesome! Let's get your custom bot built. Grab a quick time on Wes's calendar here: https://calendar.app.google/rbTHX427Am9dFxhN9" and stop asking questions.
      5. MEMORY CHECK: Read the "Recent Conversation" below. If the customer already provided their phone number or email, DO NOT ask for it again. 
      6. THE ASK: If (and only if) we do not have their contact info yet, casually ask for a phone number or email.

      --- RECENT CONVERSATION (Memory) ---
      ${historyString}

      --- NEW MESSAGE TO REPLY TO ---
      CUSTOMER MESSAGE: "${msg.incoming_message}"
      
      Draft the DM reply or execute a tool:`;
      
      const result = await model.generateContent(prompt);
      
      // --- 3. THE INTERCEPTION LOOP ---
      const functionCalls = result.response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        
        // TWILIO EXECUTION
        if (call.name === "send_sms") {
          const { phone_number, message } = call.args;
          console.log(`📱 AI firing SMS to: ${phone_number}`);
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
        
        // RESEND EXECUTION
        else if (call.name === "send_email") {
          const { customer_email, subject, email_body } = call.args;
          console.log(`✉️ AI firing Email to: ${customer_email}`);

          // Strip out any accidental quotes from the business name to protect email headers
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
      } else {
        // Fallback: Gemini just wanted to chat normally
        aiReply = result.response.text();
        console.log(`AI drafted standard reply: ${aiReply}`);
      }

      // --- THE ANALYST BRAIN (Data Extraction Bypass) ---
      // We only run this if a tool WAS NOT used (to save tokens), because the tools already auto-fill the extractedData object.
      if (!functionCalls) {
        console.log("🔍 Extracting lead intelligence...");
        const analystModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
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

    // Use the numeric ID to reply. (Fallback to ig_username just in case it's an old message)
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

    // --- FINAL UPDATE: Save the reply AND the extracted CRM data ---
    await supabase
      .from('b2b_inbox')
      .update({ 
        ai_reply: aiReply, 
        status: dbStatus, 
        extracted_data: extractedData 
      })
      .eq('id', msg.id);

    return res.status(200).json({ success: true, message: "DM Sent & Lead Extracted!" });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
};