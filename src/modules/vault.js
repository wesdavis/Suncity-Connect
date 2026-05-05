const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function saveToVault(localImagePath, tagline) {
  console.log(`\n🏦 Starting Module D: The Vault...`);
  
  try {
    // 1. Upload the image to the Supabase Storage Bucket
    console.log("1. Uploading image to Supabase Storage...");
    const fileName = `ad_${Date.now()}.png`;
    const fileBuffer = fs.readFileSync(localImagePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('marketing_assets')
      .upload(fileName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 2. Ask Supabase for the public, shareable URL
    const { data: publicUrlData } = supabase.storage
      .from('marketing_assets')
      .getPublicUrl(fileName);
      
    const publicImageUrl = publicUrlData.publicUrl;
    console.log(`✅ Image uploaded! Public URL: ${publicImageUrl}`);

    // 3. Save the Tagline and the URL into your Database Table
    console.log("2. Logging post to the database...");
    
    // We add the Call To Action here so Zapier pulls the complete caption
    const fullCaption = `${tagline}\n\nStop swiping. Start talking. Download TapTap via the link in our bio. 📍 #ElPaso #TapTapApp`;

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