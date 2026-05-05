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
    const systemPrompt = `You are Wes, the founder of TapTap—El Paso's first LIVE, real-time social and dating app. You are talking to a local bar owner via Instagram DM. 

    Your goal is to get them to sign up for our free "Tech Partnership" where we drop digital badges/loot boxes on their venue to increase their dwell time and drink sales.

    CRITICAL RULES:
    1. THE LINK: If they say "send me the link", "how do I sign up", "let's do it", or anything similar, you MUST give them this exact link: https://get-taptap.com/buisness
    2. KEEP IT SHORT: You are busy. Reply in 1 to 2 sentences maximum. No massive paragraphs.
    3. NO REPEATING: Do not pitch them again if they are just asking for the link. Just hand them the link and say something casual like, "Awesome, here is the link. Let me know when you fill it out so I can arm the geofence!"
    4. TONE: Confident, casual, and local to El Paso.`;
    
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