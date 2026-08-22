const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log("🚀 Starting Marketing Engine...");

    // ── 1. Identify the logged-in client and load their brain ──────────────
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized — please log in again' });
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, user_id, business_name, custom_prompt, pdf_knowledge, tone, pricing, hours, extra_rules, ig_account_id, fb_page_id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client profile not found. Finish onboarding first.' });
    }

    const businessName = client.business_name || 'Your Business';
    const brain = [
      client.custom_prompt,
      client.pdf_knowledge ? `\n\nKNOWLEDGE BASE / MENU / SERVICES:\n${client.pdf_knowledge}` : '',
      client.pricing ? `\nPRICING NOTES:\n${client.pricing}` : '',
      client.hours ? `\nHOURS:\n${client.hours}` : '',
      client.tone ? `\nTONE:\n${client.tone}` : ''
    ].filter(Boolean).join('\n').trim() || 'No custom brain set yet — use a friendly local small-business voice.';

    console.log(`🧠 Loaded brain for: ${businessName}`);

    // ── 2. Pull THIS client's recent customer messages ─────────────────────
    let dmQuery = supabase
      .from('b2b_inbox')
      .select('incoming_message')
      .order('created_at', { ascending: false })
      .limit(40);

    if (client.user_id) {
      dmQuery = dmQuery.eq('user_id', client.user_id);
    } else if (client.ig_account_id) {
      dmQuery = dmQuery.eq('business_ig_id', client.ig_account_id);
    }

    const { data: recentDMs, error: dbError } = await dmQuery;
    if (dbError) throw dbError;

    const messages = (recentDMs || [])
      .map(dm => (dm.incoming_message || '').trim())
      .filter(Boolean);

    const messageHistory = messages.length
      ? messages.map(m => `- ${m}`).join('\n')
      : '- (No recent customer messages yet — lean on the business brain and common local customer questions)';

    // ── 3. Scrub messages + brain → write copy AS THIS BUSINESS + design image
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `You are the social media manager and creative director for "${businessName}" — a real local business.

BUSINESS BRAIN (who they are, what they sell, tone, rules, knowledge):
${brain}

RECENT CUSTOMER MESSAGES / QUESTIONS FROM THEIR INBOX:
${messageHistory}

YOUR JOB:
1. Scrub the customer messages. Identify the strongest recurring question, request, or frustration.
2. Write content FROM THE PERSPECTIVE OF "${businessName}" — never mention Sun City Connect, AI bots, automation platforms, or "DEMO". You are writing posts the business will publish on their own Instagram/Facebook.
3. Write a short, punchy CAPTION under 45 words in the business's natural voice. Agitate a real customer pain or desire, then point to what this business offers. End with a clear call-to-action that fits the business (e.g. "DM us to order", "Book now", "Tap the link in bio", "Reply with your name to reserve", etc.).
4. Write a HEADLINE of 3–6 words max. This text will be overlaid in large bold type on the image — make it scannable and on-brand.
5. Design a custom IMAGE CONCEPT that visually represents the pain point or offer you found. Be specific about scene, subject, lighting, and mood. Premium, cinematic, modern commercial photography.

STRICT RULES FOR THE IMAGE CONCEPT:
- Complete photographic scene (not abstract graphics or illustrations).
- Match the actual business type if the brain or messages make it clear (restaurant food, contractor job site, salon chair, clinic, retail storefront, etc.).
- Mood: inviting, premium, or urgent depending on the message — always high quality.
- Absolutely NO text, letters, numbers, logos, watermarks, or readable UI in the image description.
- 1–2 highly visual sentences, ready to send to an image model.

OUTPUT ONLY valid raw JSON with exactly these keys (no markdown, no extra text):

{
  "pain_point": "one-sentence summary of the core customer need or frustration",
  "headline": "3 to 6 word headline",
  "caption": "The full Instagram caption with a natural CTA for this business",
  "image_prompt": "A detailed cinematic photographic description of the scene"
}`;

    const result = await model.generateContent(prompt);
    let jsonText = result.response.text()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    const generatedData = JSON.parse(jsonText);

    const generatedHeadline = (generatedData.headline || 'Order Today').trim().replace(/^["']|["']$/g, '');
    const generatedCaption = (generatedData.caption || '').trim();
    const painPoint = (generatedData.pain_point || '').trim();
    let imagePrompt = (generatedData.image_prompt || '').trim();

    if (!imagePrompt) {
      imagePrompt = `Cinematic, high-end commercial photograph representing a thriving local ${businessName} business, warm inviting lighting, premium advertising style`;
    }
    imagePrompt += `. Absolutely NO text, letters, numbers, logos, or watermarks of any kind in the image. High-end commercial photography, cinematic color grade.`;

    console.log("✅ Pain point →", painPoint);
    console.log("✅ Headline →", generatedHeadline);
    console.log("✅ Image concept →", imagePrompt.slice(0, 140) + '...');

    // ── 4. Generate image via Gemini native image model (no Vertex required)
    console.log("🎨 Generating image from client feedback...");

    let base64Image = null;
    try {
      const imageModelsToTry = [
        'gemini-2.5-flash-image',
        'gemini-3.1-flash-image',
        'gemini-3-pro-image'
      ];

      for (const imageModel of imageModelsToTry) {
        try {
          const imageUrl = `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${process.env.GEMINI_API_KEY}`;

          const imageResponse = await fetch(imageUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: imagePrompt }] }],
              generationConfig: {
                responseModalities: ['TEXT', 'IMAGE']
              }
            })
          });

          const imageData = await imageResponse.json();

          if (!imageResponse.ok) {
            console.warn(`⚠️ ${imageModel} failed:`, imageData?.error?.message || imageResponse.status);
            continue;
          }

          const parts = imageData?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              base64Image = part.inlineData.data;
              console.log(`✅ Image generated with ${imageModel}`);
              break;
            }
          }

          if (base64Image) break;
        } catch (modelErr) {
          console.warn(`⚠️ ${imageModel} error:`, modelErr.message);
        }
      }

      if (!base64Image) {
        console.error("❌ All Gemini image models failed to return image data");
      }
    } catch (imgErr) {
      console.error("❌ Image generation exception:", imgErr.message);
    }

    // ── 5. Hashtags rooted in the business + content
    const generateHashtags = (captionText = '', headlineText = '', pain = '', name = '') => {
      const lower = `${captionText} ${headlineText} ${pain} ${name}`.toLowerCase();
      const tags = new Set(['#ElPaso', '#ElPasoBusiness', '#SmallBusiness']);

      if (lower.includes('food') || lower.includes('order') || lower.includes('menu') || lower.includes('restaurant') || lower.includes('hungry') || lower.includes('taco') || lower.includes('pizza')) {
        tags.add('#ElPasoEats');
        tags.add('#Foodie');
      }
      if (lower.includes('book') || lower.includes('appoint') || lower.includes('schedule') || lower.includes('salon') || lower.includes('hair') || lower.includes('barber')) {
        tags.add('#BookNow');
      }
      if (lower.includes('contractor') || lower.includes('repair') || lower.includes('roof') || lower.includes('plumb') || lower.includes('home service')) {
        tags.add('#HomeServices');
        tags.add('#ElPasoHomes');
      }
      if (lower.includes('realtor') || lower.includes('real estate') || lower.includes('listing') || lower.includes('home for sale')) {
        tags.add('#ElPasoRealEstate');
      }
      if (lower.includes('915')) tags.add('#915');

      return Array.from(tags).slice(0, 6).join(' ');
    };

    const finalHashtags = generateHashtags(generatedCaption, generatedHeadline, painPoint, businessName);
    const captionWithHashtags = `${generatedCaption}\n\n${finalHashtags}`.trim();

    console.log("✅ Campaign ready for", businessName);

    return res.status(200).json({
      success: true,
      headline: generatedHeadline,
      campaign: captionWithHashtags,
      image: base64Image,
      pain_point: painPoint,
      business_name: businessName
    });

  } catch (error) {
    console.error("❌ Marketing Engine Error:", error);
    return res.status(500).json({ error: error.message || 'Generation failed' });
  }
};
