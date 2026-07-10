const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // 3. Conversational reply from Gemini
    const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chatPrompt = `
      You are the elite digital receptionist and client qualification agent for ${client.business_name}.
      --- CLIENT PROFILE & INSTRUCTIONS ---
      ${client.custom_prompt}
      --- CONVERSATIONAL MANDATES ---
      1. Be highly professional, casual, and brief. Use 1-3 short sentences maximum.
      2. If you do not have their contact details yet (phone/email), find a natural way to ask for it.
      --- CONVERSATIONAL MEMORY ---
      ${memoryString}
      --- CURRENT CUSTOMER MESSAGE ---
      "${message}"
      Draft your immediate reply response text below:
    `;

    const chatResult = await chatModel.generateContent(chatPrompt);
    const aiReply = chatResult.response.text().trim();

    // 4. Silent parsing to extract CRM lead records
    // Enforce strict JSON output so the parser never crashes
    const analystModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
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

    let extractedData = { intent: "Website Visitor", phone: "Pending", email: "Pending", timeline: "Pending", status: "Cold" };
    try {
      const analystResult = await analystModel.generateContent(extractionPrompt);
      // Because we forced application/json, we can parse it directly without string manipulation
      extractedData = JSON.parse(analystResult.response.text());
    } catch (e) {
      console.error("AI Parser exception:", e);
    }

    // 5. Commit directly into omnichannel channel
    await supabase.from('b2b_inbox').insert([{
      ig_username: `Web_${visitorId.substring(0, 6)}`,
      incoming_message: message,
      ai_reply: aiReply,
      status: 'replied',
      business_ig_id: client.ig_account_id,
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