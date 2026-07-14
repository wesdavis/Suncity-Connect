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

    // 2. Fire up the Gemini Engine (Forcing JSON Output)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Force strict JSON!
    }); 

    // 3. Ask Gemini to extract and sort the data
    const prompt = `
      You are an elite data extraction assistant. Read the attached business document (PDF) and extract the information into a structured format. 
      
      Return a valid JSON object with the following exact keys:
      {
        "pricing": "Extract all menu items, services, and prices here.",
        "hours": "Extract all operating hours and days closed here.",
        "extra_rules": "Extract any catering rules, delivery fees, or strict business policies here."
      }
      If a specific category of information is not found in the document, return an empty string for that key.
    `;
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: fileBase64, mimeType: "application/pdf" } }
    ]);

    // Parse the JSON returned by Gemini
    const extractedData = JSON.parse(result.response.text());

    // 4. We will NOT save to the DB here. We will send it back to the frontend 
    // so the user can review it in the text boxes before clicking "Update AI Brain"
    console.log(` Successfully parsed PDF into structured JSON.`);

    return res.status(200).json({ 
      success: true, 
      message: 'Document successfully sorted!',
      extractedData: extractedData
    });

  } catch (error) {
    console.error("Critical Failure in PDF Extraction Engine:", error);
    return res.status(500).json({ error: error.message });
  }
}