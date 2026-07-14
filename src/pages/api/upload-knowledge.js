const { createClient } = require('@supabase/supabase-js');
const pdf = require('pdf-parse');

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

    // 1. Authenticate the incoming request using the user's JWT token
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized session.' });
    }

    console.log(`Processing document upload [${fileName}] for user: ${user.id}`);

    // 2. Convert base64 stream back into a physical binary buffer
    const pdfBuffer = Buffer.from(fileBase64, 'base64');

    // 3. Extract the clean text using pdf-parse
    const parsedPdf = await pdf(pdfBuffer);
    
    // Clean up excessive whitespace or system linebreaks
    const cleanExtractedText = parsedPdf.text
      .replace(/\n\s*\n/g, '\n') 
      .trim();

    if (!cleanExtractedText) {
      return res.status(422).json({ error: 'Could not extract any structural text from this PDF.' });
    }

    // 4. Upsert the data into the client's record
    const { error: dbError } = await supabase
      .from('clients')
      .update({ pdf_knowledge: cleanExtractedText })
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    console.log(` Successfully parsed ${parsedPdf.numpages} pages and synced to Brain Matrix.`);

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