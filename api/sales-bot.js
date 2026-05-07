// NEW UPDATED PATHS
const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../src/config/db'); 

// ... keep the rest of your sales bot code exactly the same ...

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

    // 4. NEW: Lookup the specific client based on who the DM was sent to
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('ig_account_id', msg.business_ig_id)
      .single();

    if (clientError || !client) {
      console.error(`Client not found for Business IG ID: ${msg.business_ig_id}`);
      // Return 200 so Supabase doesn't get stuck retrying a failed delivery
      return res.status(200).json({ error: 'Client not found in Rolodex' });
    }

    console.log(`🧠 Loaded brain for: ${client.business_name}`);
    const META_ACCESS_TOKEN = client.meta_access_token; // Use their specific token!

    // 5. The Brain: Draft the pitch using THEIR custom instructions
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    
    const prompt = `
    ${client.custom_prompt}
    
    A customer just DMed us: "${msg.incoming_message}". 
    Write a short, professional, zero-BS response. Do not sound like a robot.`;
    
    const result = await model.generateContent(prompt);
    const aiReply = result.response.text();
    console.log(`AI drafted reply: ${aiReply}`);

    // 6. The Mouth: Send to Instagram
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

    // 7. Update Database
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