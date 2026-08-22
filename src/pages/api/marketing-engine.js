const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAuth } = require('google-auth-library');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log("🚀 Starting the Enterprise Marketing Engine...");

    // 1. Pull recent customer DMs — this is the real signal
    const { data: recentDMs, error: dbError } = await supabase
      .from('b2b_inbox')
      .select('incoming_message')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbError) throw dbError;

    const messages = (recentDMs || [])
      .map(dm => (dm.incoming_message || '').trim())
      .filter(Boolean);

    const messageHistory = messages.length
      ? messages.map(m => `- ${m}`).join('\n')
      : '- (No recent customer messages available — lean on proven local business pain points: missed late-night DMs, repeating the same pricing answers, losing impatient leads, owners acting like 24/7 robots)';

    // 2. Scrub the messages → extract pain → write copy + design a matching visual
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are the lead growth marketer and creative director for Sun City Connect — an AI sales automation platform built for local El Paso businesses (restaurants, contractors, salons, realtors, clinics, home services, etc.).

REAL CUSTOMER MESSAGES / QUESTIONS FROM THE INBOX:
${messageHistory}

YOUR JOB — do this in order:
1. Scrub the messages above. Identify the single strongest recurring pain point, question, or frustration.
2. Write a short, punchy Instagram/Meta CAPTION (under 45 words) that agitates that exact pain and positions the 24/7 AI assistant as the fix. Speak like a sharp local operator, not corporate AI.
3. The Call-to-Action MUST tell them to comment the exact word "DEMO".
4. Write a HEADLINE of 3–6 words max. This will be overlaid in large bold type on the image — make it scannable and urgent.
5. Design a custom IMAGE CONCEPT that visually represents the pain point you found. Be specific about the scene, subject, lighting, and mood. The image must feel premium, cinematic, and modern B2B — never generic stock.

STRICT RULES FOR THE IMAGE CONCEPT:
- Describe a complete photographic scene (not abstract graphics).
- Match the business context if the messages point to one (restaurant, contractor truck, salon, clinic desk, etc.). If unclear, default to a local small-business owner context.
- Mood: urgent, late-night or high-pressure, premium, high-contrast.
- Lighting: cinematic (neon accents, practical lights, dusk, night windows, phone glow, etc.).
- Absolutely NO text, letters, numbers, logos, watermarks, or readable UI in the image description.
- Keep it 1–2 sentences, highly visual, ready to send to an image model.

OUTPUT ONLY valid raw JSON with exactly these keys (no markdown, no extra text):

{
  "pain_point": "one-sentence summary of the core frustration you found",
  "headline": "3 to 6 word headline",
  "caption": "The full Instagram caption ending with the DEMO CTA",
  "image_prompt": "A detailed cinematic photographic description of the scene that visualizes the pain point"
}`;

    const result = await model.generateContent(prompt);
    let jsonText = result.response.text()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Extract JSON object safely even if the model wraps it
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    const generatedData = JSON.parse(jsonText);

    const generatedHeadline = (generatedData.headline || 'Stop Missing Leads').trim().replace(/^["']|["']$/g, '');
    const generatedCaption = (generatedData.caption || '').trim();
    const painPoint = (generatedData.pain_point || '').trim();
    let imagePrompt = (generatedData.image_prompt || '').trim();

    // Hard safety: never allow text in the final image
    if (!imagePrompt) {
      imagePrompt = `Cinematic late-night scene of a local business owner looking at a glowing smartphone full of unread messages, high contrast purple and blue lighting, urgent and premium advertising photography style`;
    }
    imagePrompt += `. Absolutely NO text, letters, numbers, logos, or watermarks of any kind in the image. High-end commercial photography, cinematic color grade.`;

    console.log("✅ Scrubbed pain point →", painPoint);
    console.log("✅ Headline →", generatedHeadline);
    console.log("✅ Image concept →", imagePrompt.slice(0, 120) + '...');

    // 3. Generate the image from the AI-designed concept
    console.log("🎨 Generating image from customer feedback...");

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;
    const projectId = await auth.getProjectId();

    const location = 'us-central1';
    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

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

    if (imageData.predictions && imageData.predictions[0]?.bytesBase64Encoded) {
      base64Image = imageData.predictions[0].bytesBase64Encoded;
      console.log("✅ Image generated from real feedback");
    } else {
      console.error("❌ Vertex AI Error:", JSON.stringify(imageData, null, 2));
    }

    // 4. Smart hashtags based on the actual content
    const generateHashtags = (captionText = '', headlineText = '', pain = '') => {
      const lower = `${captionText} ${headlineText} ${pain}`.toLowerCase();
      const tags = new Set(['#ElPasoBusiness', '#SmallBusiness']);

      if (lower.includes('el paso') || lower.includes('west texas') || lower.includes('915')) {
        tags.add('#ElPaso');
        tags.add('#915');
      }
      if (lower.includes('lead') || lower.includes('dm') || lower.includes('inbox') || lower.includes('message') || lower.includes('sales')) {
        tags.add('#LeadGeneration');
        tags.add('#NeverMissALead');
      }
      if (lower.includes('automat') || lower.includes('bot') || lower.includes('ai') || lower.includes('24/7') || lower.includes('sleep')) {
        tags.add('#AIAutomation');
        tags.add('#AIAssistant');
      }
      if (lower.includes('restaurant') || lower.includes('food') || lower.includes('dining') || lower.includes('kitchen')) {
        tags.add('#RestaurantMarketing');
      }
      if (lower.includes('contractor') || lower.includes('truck') || lower.includes('service') || lower.includes('home') || lower.includes('roof') || lower.includes('plumb')) {
        tags.add('#HomeServices');
      }
      if (lower.includes('salon') || lower.includes('hair') || lower.includes('beauty') || lower.includes('barber')) {
        tags.add('#SalonMarketing');
      }
      if (lower.includes('realtor') || lower.includes('real estate') || lower.includes('listing') || lower.includes('house')) {
        tags.add('#RealEstateMarketing');
      }

      return Array.from(tags).slice(0, 6).join(' ');
    };

    const finalHashtags = generateHashtags(generatedCaption, generatedHeadline, painPoint);
    const captionWithHashtags = `${generatedCaption}\n\n${finalHashtags}`.trim();

    console.log("✅ Campaign ready — driven by real inbox feedback");

    return res.status(200).json({
      success: true,
      headline: generatedHeadline,
      campaign: captionWithHashtags,
      image: base64Image,
      // Optional debug so you can see what the AI actually extracted
      pain_point: painPoint
    });

  } catch (error) {
    console.error("❌ Marketing Engine Error:", error);
    return res.status(500).json({ error: error.message || 'Generation failed' });
  }
};
