const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

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
      .eq('ig_account_id', msg.business_ig_id)
      .single();

    if (clientError || !client) {
      console.error(`Client not found for Business IG ID: ${msg.business_ig_id}`);
      return res.status(200).json({ error: 'Client not found in Rolodex' });
    }

    console.log(`🧠 Loaded brain for: ${client.business_name}`);
    const META_ACCESS_TOKEN = client.meta_access_token; 

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const prompt = `
    You are the elite digital sales closer and lead capture assistant for a local business. 
    Your ultimate goal is to answer the customer's question quickly and smoothly pivot to capturing their phone number or email to get them on the calendar or send a quote.

    --- BUSINESS KNOWLEDGE ---
    ${client.custom_prompt}
    
    --- CRITICAL CLOSING RULES ---
    1. KEEP IT PUNCHY: You are in an Instagram DM. Use 2-3 short, conversational sentences max. No corporate jargon. No robotic greetings like "Hello valued customer."
    2. GIVE AND TAKE: Answer their immediate question using the Business Knowledge, but never give away everything without asking for a micro-commitment in return.
    3. THE ASK: If they haven't given us contact info yet, ALWAYS end your message by casually asking for it. (e.g., "What's the best number to text you some options?" or "Where is the best place to email that quote?")
    4. THE CONFIRMATION: If they just provided their phone/email, do not ask for it again. Confirm you received it, tell them the team will reach out ASAP, and end the conversation.

    CUSTOMER MESSAGE: "${msg.incoming_message}"
    
    Draft the DM reply:`;
    
    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();
    console.log(`AI drafted reply: ${aiReply}`);

    const metaPayload = {
      recipient: { id: msg.ig_username },
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

    // --- NEW: THE ANALYST BRAIN (Data Extraction) ---
    console.log("🔍 Extracting lead intelligence...");
    const analystModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const extractionPrompt = `Analyze this Instagram DM sent to a local business: "${msg.incoming_message}"
    
    Extract the following information and output ONLY a valid, raw JSON object with these exact keys (no markdown formatting):
    {
      "intent": "Brief 2-4 word summary of what they want (e.g. 'Pricing Question', 'Ready to Book', 'Support')",
      "phone": "Any phone number found, or 'Pending' if none",
      "email": "Any email address found, or 'Pending' if none",
      "timeline": "Any mentioned timeframe, date, or urgency (e.g. 'tomorrow', 'this afternoon', 'ASAP'), or 'Pending' if none",
      "status": "Rate as 'Hot', 'Warm', or 'Cold' based on urgency/readiness to buy"
    }`;

    let extractedData = {};
    try {
      const analystResult = await analystModel.generateContent(extractionPrompt);
      // Strip any accidental markdown formatting the AI might add
      const jsonText = analystResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      extractedData = JSON.parse(jsonText);
      console.log("📊 Extraction complete:", extractedData);
    } catch (e) {
      console.error("❌ Failed to parse extracted JSON:", e);
      // Fallback empty object so the DB update still works
      extractedData = { intent: "Unknown", phone: "Pending", email: "Pending", timeline: "Pending", status: "Cold" };
    }

    // --- FINAL UPDATE: Save the reply AND the extracted CRM data ---
    await supabase
      .from('b2b_inbox')
      .update({ 
        ai_reply: aiReply, 
        status: 'replied',
        extracted_data: extractedData 
      })
      .eq('id', msg.id);

    return res.status(200).json({ success: true, message: "DM Sent & Lead Extracted!" });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
};