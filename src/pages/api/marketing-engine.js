const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log("🚀 Starting the Inbox Insights Marketing Engine...");

    // 1. Fetch the last 50 customer DMs
    const { data: recentDMs, error: dbError } = await supabase
      .from('b2b_inbox')
      .select('incoming_message')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbError) throw dbError;

    const messageHistory = recentDMs.map(dm => dm.incoming_message).join('\n- ');

    // 2. Generate the Ad Copy
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an elite growth marketer for a local business in El Paso, TX. 
      Read this list of recent customer direct messages:
      
      - ${messageHistory}

      TASK:
      1. Identify the most common question or frustration these customers have.
      2. Write a short, punchy Instagram ad caption (under 40 words) that directly answers this specific pain point.
      3. The Call to Action MUST tell the user to comment the word "DEMO" to trigger our automated AI bot.
      
      Output ONLY the final ad caption. No quotes, no intro text.
    `;

    const result = await model.generateContent(prompt);
    const generatedCaption = result.response.text().trim();
    console.log("✅ Copy generated!");

    // 3. Generate the Image using Google's Imagen 3 API
    console.log("🎨 Dreaming up the campaign image...");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`;
    
    const imagePrompt = `A cinematic, dark-mode, high-contrast professional photograph of a modern business owner's desk. Glowing purple and neon blue accents. A sleek smartphone screen illuminating the dark. The visual vibe matches this B2B automation tagline: "${generatedCaption}". Absolutely NO text or letters in the image.`;

    const imageResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [
          { prompt: imagePrompt }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1"
        }
      })
    });

    const imageData = await imageResponse.json();
    let base64Image = null;
    
    // Imagen 3 returns the base64 string inside the "predictions" array
    if (imageData.predictions && imageData.predictions[0].bytesBase64Encoded) {
      base64Image = imageData.predictions[0].bytesBase64Encoded;
      console.log("✅ Image generated successfully!");
    } else {
      console.error("❌ Image API Error:", imageData);
    }

    return res.status(200).json({ 
      success: true, 
      campaign: generatedCaption,
      image: base64Image
    });
  } catch (error) {
    console.error('❌ Marketing engine error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};