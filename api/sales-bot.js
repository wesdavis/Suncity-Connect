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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `You are wes, founder of TapTap, an El Paso tech company. Someone just DMed us: "${msg.incoming_message}". 

INSTRUCTIONS:
1. If their message is a basic greeting or asking what TapTap is, write a short, punchy 2-sentence pitch offering to get their venue set up.
2. If they say yes, ask for a link, or want to move forward, tell them to claim their venue here: https://get-taptap.com/business (Make sure you include the link!).
3. Keep it casual, professional, and zero-BS. Do not sound like a robot.`;
    
    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();
    console.log(`AI drafted reply: ${aiReply}`);

    // 5. The Mouth: Send to Instagram
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