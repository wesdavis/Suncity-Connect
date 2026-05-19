const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// NEW: This tells Vercel to allow up to 10MB payloads so the high-res images can pass through!
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) { // NOTE: changed from module.exports to export default for Next.js
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  

  try {
    const { headline, caption, imageBase64 } = req.body;

    if (!headline || !caption || !imageBase64) {
      return res.status(400).json({ error: 'Missing required campaign data' });
    }

    console.log("💾 Starting save process for campaign:", headline);

    // 1. Convert the Base64 string into a physical Buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // Create a unique, URL-friendly filename
    const fileName = `campaign_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

    // 2. Upload the image directly to the Supabase Storage Bucket
    console.log("⬆️ Uploading image to Supabase Storage...");
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('campaign-assets')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) throw storageError;

    // 3. Get the permanent Public URL for the new image
    const { data: { publicUrl } } = supabase
      .storage
      .from('campaign-assets')
      .getPublicUrl(fileName);

    console.log("✅ Image uploaded! URL:", publicUrl);

    // 4. Save the text and the new image URL into the Database
    console.log("📝 Inserting campaign record into database...");
    const { data: dbData, error: dbError } = await supabase
      .from('saved_campaigns')
      .insert([
        { 
          headline: headline, 
          caption: caption, 
          image_url: publicUrl 
        }
      ])
      .select();

    if (dbError) throw dbError;

    console.log("🎉 Campaign saved successfully to the Library!");

    return res.status(200).json({ 
      success: true, 
      message: 'Campaign saved to library!',
      record: dbData[0]
    });

  } catch (error) {
    console.error("❌ Save Campaign Error:", error);
    return res.status(500).json({ error: error.message });
  }
};