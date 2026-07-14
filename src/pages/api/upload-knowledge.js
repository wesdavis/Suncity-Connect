const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure Vercel to allow larger menus/documents (up to 4MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileBase64, fileName } = req.body;
    const authHeader = req.headers.authorization;

    if (!fileBase64 || !authHeader) {
      return res.status(400).json({ error: 'Missing file payload or authentication token.' });
    }

    // 1. Authenticate the incoming request
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized session.' });
    }

    console.log(`Processing document upload [${fileName}] for user: ${user.id}`);

    // 2. Fire up the Gemini Vision/Document Engine
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    // 3. Ask Gemini to accurately transcribe the document
    const prompt = `You are a precise data extraction tool. Extract and transcribe all the text from this PDF document exactly as it appears. Preserve the structural formatting (headings, lists, pricing). Do not add any conversational filler or markdown, just return the raw extracted text.`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileBase64,
          mimeType: "application/pdf"
        }
      }
    ]);

    const cleanExtractedText = result.response.text().trim();

    if (!cleanExtractedText) {
      return res.status(422).json({ error: 'Could not extract any structural text from this PDF.' });
    }

    // 4. Upsert the exact text into the client's record
    const { error: dbError } = await supabase
      .from('clients')
      .update({ pdf_knowledge: cleanExtractedText })
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    console.log(` Successfully parsed PDF and synced to Brain Matrix.`);

    return res.status(200).json({ 
      success: true, 
      message: 'Document successfully digested by AI brain!',
      textPreview: cleanExtractedText.substring(0, 200) + '...'
    });

  } catch (error) {
    console.error("Critical Failure in PDF Extraction Engine:", error);
    return res.status(500).json({ error: error.message });
  }
}