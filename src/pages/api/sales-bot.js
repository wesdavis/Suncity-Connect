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
    
    // Fixed prompt with the correct variable: msg.incoming_message
    const prompt = `You are the lead AI sales assistant managing the Instagram DMs for Sun City Connect, an AI automation agency in El Paso, Texas.

CRITICAL RULES:
1. You are replying to an Instagram DM, NOT an email. NEVER use "Subject:", formal signatures, or placeholders like "[Your Name]".
2. Keep responses incredibly short, punchy, and human (1-2 sentences max). 
3. If the user asks what we do, tell them we build custom 24/7 AI sales assistants for local businesses to stop them from losing leads in the DMs.
4. If the user sends the word "DEMO" (or any variation like "Demo" or "demo"), DO NOT ask them to reply demo again. Instead, tell them: "Awesome! Let's get your custom bot built. Grab a quick time on Wes's calendar to see it live: [YOUR_CALENDLY_LINK_HERE]"

User's incoming message: "${msg.incoming_message}"`; 
    
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

    await supabase
      .from('b2b_inbox')
      .update({ ai_reply: aiReply, status: 'replied' })
      .eq('id', msg.id);

    return res.status(200).json({ success: true, message: "DM Sent!" });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
};