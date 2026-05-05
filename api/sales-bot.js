const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // 1. Only allow POST requests (from the Supabase Webhook)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. Catch the ping from Supabase
    const msg = req.body.record;

    // If it's not a pending message, ignore it successfully
    if (!msg || msg.status !== 'pending') {
      return res.status(200).json({ message: "Ignored - Not a pending message" });
    }

    console.log(`Processing new message: "${msg.incoming_message}"`);

    // 3. Initialize Keys from Vercel Environment Variables
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    // 4. The Brain: Draft the pitch
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are the lead sales agent for TapTap, an El Paso tech company. A bar owner just DMed us: "${msg.incoming_message}". Write a short, punchy 2-sentence Instagram DM reply offering to get their venue set up on the app. Keep it casual but professional.`;
    
    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();
    console.log(`AI drafted reply: ${aiReply}`);

    // 5. The Mouth: Send to Instagram
    const metaPayload = {
      recipient: { id: msg.ig_username },
      message: { text: aiReply }
    };

    const metaResponse = await fetch('https://graph.instagram.com/v19.0/me/messages', {
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

    // 6. Update Database
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