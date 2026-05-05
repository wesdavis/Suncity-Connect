const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createAdImage(tagline) {
  console.log(`\n🎨 Starting Module C: The AI Artist (Generation & Branding)...`);
  
  const brandFolder = path.join(__dirname, '../../assets/brand');
  const outFolder = path.join(__dirname, '../../assets/output');

  const logoPath = path.join(brandFolder, 'logo.png');
  if (!fs.existsSync(logoPath)) {
    console.error("❌ ERROR: TapTap logo not found! Please save 'logo.png' in assets/brand/");
    return;
  }

  try {
    // --- 1. AI DREAMS UP THE BACKGROUND ---
    console.log("💭 Dreaming up a unique El Paso background...");
    
    // Updated to the modern Gemini Image endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const imagePrompt = `A cinematic, vibrant purple-neon-lit photo of a massive stadium concert crowd having the time of their lives. A glowing, blurred background with young adults in the foreground socializing at a tailgate. The visual vibe matches this tagline: [tagline]. No text or words in the image.. The visual vibe matches this tagline: "${tagline}". No text or words in the image.`;

    // The new payload structure
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: imagePrompt }]
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Image generation failed");

    // Unpack the raw image data from the new response structure
    let base64Image = null;
    const parts = data.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) throw new Error("API responded, but no image data was found.");

    const aiImageBuffer = Buffer.from(base64Image, 'base64');

    // --- 2. CANVAS APPLIES TAPTAP BRANDING ---
    console.log("🖌️ Applying TapTap branding and text overlay...");
    
    // We load the AI-generated image instead of a local file
    const image = await loadImage(aiImageBuffer); 
    const logo = await loadImage(logoPath); 
    
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw the fresh AI background
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Add a cinematic dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the logo 
    const logoWidth = Math.floor(canvas.width / 5);   
    const logoHeight = (logoWidth / logo.width) * logo.height; 
    const logoPadding = Math.floor(canvas.height / 20); 

    const logoX = (canvas.width - logoWidth) / 2;
    const logoY = canvas.height - logoHeight - logoPadding;
    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Configure typography
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const fontSize = Math.floor(canvas.width / 15);
    ctx.font = `bold ${fontSize}px sans-serif`;

    // Draw the tagline
    const textCenterY = canvas.height * 0.45;
    wrapText(ctx, tagline, canvas.width / 2, textCenterY, canvas.width * 0.8, fontSize * 1.3);

    // --- 3. SAVE TO LOCAL FOLDER AND SEND TO VAULT ---
    const fileName = `taptap_ai_ad_${Date.now()}.png`;
    const outPath = path.join(outFolder, fileName);
    const finalBuffer = canvas.toBuffer('image/png');
    
    // Ensure the output directory exists
    if (!fs.existsSync(outFolder)){
        fs.mkdirSync(outFolder, { recursive: true });
    }
    
    fs.writeFileSync(outPath, finalBuffer);

    console.log(`✅ Fully branded AI ad saved successfully to: assets/output/${fileName}`);
    return outPath;

  } catch (error) {
    console.error("❌ Failed to create AI branded image:", error);
  }
}

// Helper function to handle text wrapping (Untouched)
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];

  for(let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let startY = y - ((lines.length - 1) * lineHeight) / 2;
  for(let k = 0; k < lines.length; k++) {
    context.fillText(lines[k].trim(), x, startY + (k * lineHeight));
  }
}

module.exports = { createAdImage };