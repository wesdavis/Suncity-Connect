const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAuth } = require('google-auth-library');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Keeps text generation free/fast

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log("🚀 Starting the Enterprise Marketing Engine...");

    // 1. Fetch the last 50 customer DMs
    const { data: recentDMs, error: dbError } = await supabase
      .from('b2b_inbox')
      .select('incoming_message')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbError) throw dbError;

    const messageHistory = recentDMs.map(dm => dm.incoming_message).join('\n- ');

    // 2. Generate the Ad Copy & Headline (Structured JSON)
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const prompt = `
      You are an elite growth marketer for a local business in El Paso, TX. 
      Read this list of recent customer direct messages:
      
      - ${messageHistory}

      TASK:
      1. Identify the most common question or frustration these customers have.
      2. Write a short, punchy Instagram ad caption (under 40 words) that directly answers this specific pain point.
      3. The Call to Action MUST tell the user to comment the word "DEMO" to trigger our automated AI bot.
      4. Write a separate, ultra-short "Headline" (max 5 words) to be overlaid directly onto the image.
      
      Output ONLY a valid, raw JSON object with these exact keys (no markdown formatting):
      {
        "headline": "Ultra-short 5-word image text",
        "caption": "The full Instagram caption"
      }
    `;

    const result = await model.generateContent(prompt);
    
    // Clean the AI response and parse the JSON
    const jsonText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const generatedData = JSON.parse(jsonText);
    
    const generatedHeadline = generatedData.headline;
    const generatedCaption = generatedData.caption;
    console.log("✅ Copy generated! Headline:", generatedHeadline);

    // 3. ENTERPRISE IMAGE GENERATION: Vertex AI (Imagen 3)
    console.log("🎨 Dreaming up the enterprise campaign image...");
    
    // Authenticate using the JSON we pasted into Vercel
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    
    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;
    const projectId = await auth.getProjectId();
    
    // Hit the secure Vertex AI endpoint
    const location = 'us-central1'; // Standard Vertex region
    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const imagePrompt = `A cinematic, dark-mode, high-contrast professional photograph of a modern business owner's desk. Glowing purple and neon blue accents. A sleek smartphone screen illuminating the dark. The visual vibe matches this B2B automation tagline: "${generatedCaption}". Absolutely NO text or letters in the image.`;

    const imageResponse = await fetch(vertexUrl, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        instances: [{ prompt: imagePrompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1"
        }
      })
    });

    const imageData = await imageResponse.json();
    let base64Image = null;
    
    // Extract the raw image bytes from Vertex AI
    if (imageData.predictions && imageData.predictions[0].bytesBase64Encoded) {
      base64Image = imageData.predictions[0].bytesBase64Encoded;
      console.log("✅ Enterprise Image generated successfully!");
    } else {
      console.error("❌ Vertex AI Error:", JSON.stringify(imageData, null, 2));
    }

   // 3. (utility) Hashtag Generator
    const generateHashtags = (captionText) => {
      const lower = captionText.toLowerCase();
      const tags = ['#b2b', '#marketingautomation']; // Base default tags.

      if (lower.includes('el paso')) tags.push('#elpaso', '#elpasobusiness');
      if (lower.includes('leads') || lower.includes('sales')) tags.push('#smallbiztips', '#leadgeneration');
      if (lower.includes('automated') || lower.includes('bot')) tags.push('#ai', '#chatbot');

      // Return as a space-separated string.
      return [...new Set(tags)].join(' ');
    };

    const finalHashtags = generateHashtags(generatedCaption);
    const captionWithHashtags = `${generatedCaption} ${finalHashtags}`;

    console.log("✅ Branded assets ready!");
    
    return res.status(200).json({ 
      success: true, 
      headline: generatedHeadline,
      campaign: captionWithHashtags, // The client now receives the final caption string
      image: base64Image
    });

  } catch (error) {
    // ...error handling...
    console.error("❌ Marketing Engine Error:", error);
    return res.status(500).json({ error: error.message });
  }
};