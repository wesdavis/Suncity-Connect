const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const twilio = require('twilio');
const { Resend } = require('resend');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, message, history, visitorId } = req.body;

    if (!domain || !message || !visitorId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 1. Resolve client profile from domain
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('custom_prompt, ig_account_id, business_name, is_bot_active, user_id')
      .eq('custom_domain', domain)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Storefront account not found' });
    }

    if (!client.is_bot_active) {
      return res.status(200).json({ reply: "Our chat agent is currently offline. Please use our booking link." });
    }

    // 2. Compile memory history
    let memoryString = "No previous history.";
    if (history && history.length > 0) {
      memoryString = history.slice(-4).map(h => `${h.role === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n');
    }

    // --- THE HUMAN HANDOFF PROTOCOL ---
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
      
      // --- 1. DEFINE THE TOOLS ---
      const storefrontTools = [{
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
      const chatModel = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash",
        tools: storefrontTools
      });

      const chatPrompt = `
        You are the elite digital receptionist and client qualification agent for ${client.business_name}.
        
        --- CORE SERVICE RULES & TIMELINES ---
        ${client.custom_prompt}
        
        --- ATTACHED REFERENCE DOCUMENTS & MENUS ---
        ${client.pdf_knowledge || "No additional business documents uploaded."}
        
        --- CONVERSATIONAL MANDATES ---
        1. Be highly professional, casual, and brief. Use 1-3 short sentences maximum.
        2. SMS ACTION: If the customer asks for a text or provides a phone number, USE the send_sms tool.
        3. EMAIL ACTION: If the customer asks for an email or provides an email address, USE the send_email tool.
        4. If you do not have their contact details yet (phone/email), find a natural way to ask for it.
        
        --- CONVERSATIONAL MEMORY ---
        ${memoryString}
        
        --- CURRENT CUSTOMER MESSAGE ---
        "${message}"
        Draft your immediate reply response text or execute a tool below:
      `;

      const chatResult = await chatModel.generateContent(chatPrompt);
      const functionCalls = chatResult.response.functionCalls;

      // --- 3. THE INTERCEPTION LOOP ---
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
          
          const cleanBusinessName = client.business_name.replace(/['"]/g, '');

          try {
            await resend.emails.send({
              from: `${cleanBusinessName} Assistant <assistant@suncityconnect.com>`, 
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
        aiReply = chatResult.response.text().trim();
        
        // 4. Silent parsing to extract CRM lead records (Only runs if no tool was used)
        console.log("🔍 Extracting lead intelligence...");
        const analystModel = genAI.getGenerativeModel({ 
          model: "gemini-3.5-flash",
          generationConfig: { responseMimeType: "application/json" } 
        });

        const extractionPrompt = `
          Analyze this entire conversation history between a customer and an AI assistant:
          ${memoryString}
          Customer: "${message}"

          Extract parameters and return a valid JSON object matching these exact keys:
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
          extractedData = JSON.parse(analystResult.response.text());
        } catch (e) {
          console.error("AI Parser exception:", e);
        }
      }
    }

    // 5. Commit directly into omnichannel channel
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