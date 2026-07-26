import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Supabase using the Service Role Key for backend overrides
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pageId, pageToken, clientId } = req.body;

        if (!pageId || !pageToken || !clientId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Fetch raw Page Node and Fields from Meta
        const metaRes = await fetch(`https://graph.facebook.com/v25.0/${pageId}?fields=name,about,description,emails,phone,location,hours&access_token=${pageToken}`);
        const metaData = await metaRes.json();

        if (metaData.error) {
            console.error("Meta Fetch Error:", metaData.error);
            return res.status(400).json({ error: "Failed to fetch Facebook data" });
        }

        // 2. Synthesize the raw JSON into conversational context with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const prompt = `
            You are an expert AI data extractor. 
            Analyze the following raw JSON data from a Facebook Business Page.
            Extract the business name, bio, contact info, and operating hours.
            Format the output as a clean, professional two-paragraph summary that can be injected into an AI bot's knowledge base.
            Do not include any pleasantries or conversational text. Just return the summary.
            
            Raw Data:
            ${JSON.stringify(metaData)}
        `;

        const result = await model.generateContent(prompt);
        const cleanSummary = result.response.text();

        // 3. Inject the summary directly into the database
        const { error: dbError } = await supabase
            .from('clients')
            .update({ 
                // Adjust this column name to match wherever you store the AI prompt/bio!
                company_bio: cleanSummary 
            })
            .eq('id', clientId);

        if (dbError) throw dbError;

        return res.status(200).json({ success: true, summary: cleanSummary });
        
    } catch (error) {
        console.error("Brain Generation Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}