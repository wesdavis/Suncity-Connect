const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function saveToVault(localImagePath, tagline) {
  console.log(`\n🏦 Starting Module D: The Vault...`);
  
  try {
    console.log("1. Uploading image to Supabase Storage...");
    const fileName = `suncity_ad_${Date.now()}.png`;
    const fileBuffer = fs.readFileSync(localImagePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('marketing_assets')
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('marketing_assets')
      .getPublicUrl(fileName);
      
    const publicImageUrl = publicUrlData.publicUrl;
    console.log(`✅ Image uploaded! Public URL: ${publicImageUrl}`);

    console.log("2. Logging post to the database...");
    
    // THE NEW CTA: Tells them to comment DEMO so your new webhook catches it!
    const fullCaption = `${tagline}\n\nStop missing late-night DMs and losing leads to competitors. Comment 'DEMO' to see how Sun City Connect can automate your inbox 24/7.`;

    const { error: dbError } = await supabase
      .from('marketing_posts')
      .insert([
        { 
          generated_tagline: fullCaption, 
          background_image_path: publicImageUrl 
        }
      ]);

    if (dbError) throw dbError;

    console.log(`🎉 SUCCESS! Ad securely locked in the Vault and ready for Zapier.`);
    return true;

  } catch (error) {
    console.error("❌ Vault transfer failed:", error);
  }
}

module.exports = { saveToVault };