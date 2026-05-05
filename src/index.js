const cron = require('node-cron');
const { generateAdCopy } = require('./modules/thinker');
const { createAdImage } = require('./modules/artist');
const { saveToVault } = require('./modules/vault'); // NEW

async function runMarketingEngine() {
  console.log("🚀 STARTING THE TAPTAP MARKETING ENGINE...\n");

  const taglinesText = await generateAdCopy();
  if (!taglinesText) return;

  const taglinesArray = taglinesText
    .split('\n')
    .filter(line => line.match(/^\d+\./))
    .map(line => line.replace(/^\d+\.\s*/, '').replace(/["*]/g, '').trim());

  if (taglinesArray.length > 0) {
    const selectedTagline = taglinesArray[0]; 
    console.log(`\n🎨 Passing tagline to the Artist...`);
    
    const imagePath = await createAdImage(selectedTagline);
    
    if (imagePath) {
       // Hand the image path and tagline to the Vault to upload to Supabase
       await saveToVault(imagePath, selectedTagline);
    }

  } else {
    console.log("No valid taglines found.");
  }

  console.log("\n✅ PIPELINE COMPLETE!");
}

runMarketingEngine();