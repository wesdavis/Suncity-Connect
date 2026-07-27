import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';



// Initialize Supabase using the Service Role Key for backend overrides
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Bypass the Next.js 1MB body limit for larger PDF files
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Increase limit to 10MB
        },
    },
};



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileBase64, clientId } = req.body;

        if (!fileBase64 || !clientId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Initialize Gemini 3.5 Flash-Lite with Strict JSON Schema
        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash-lite",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    description: "List of menu items with prices",
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            item_name: {
                                type: SchemaType.STRING,
                                description: "The name of the menu item"
                            },
                            price: {
                                type: SchemaType.NUMBER,
                                description: "The price of the item as a number (e.g. 12.50). Do not include dollar signs."
                            }
                        },
                        required: ["item_name", "price"]
                    }
                }
            }
        });

        // 2. Prepare the PDF data for Gemini Native Processing
        const pdfPart = {
            inlineData: {
                data: fileBase64,
                mimeType: "application/pdf"
            }
        };

        const prompt = "You are a professional data extraction assistant. Analyze this PDF menu and extract all food/drink items and their corresponding prices. Only include clear, individual items. Ignore categories or vague descriptions without prices.";

        // 3. Hit the Gemini API
        const result = await model.generateContent([prompt, pdfPart]);
        const responseText = result.response.text();
        
        let menuItems;
        try {
            menuItems = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse Gemini output:", responseText);
            return res.status(500).json({ error: "AI failed to return valid structured data." });
        }

        if (!menuItems || menuItems.length === 0) {
            return res.status(400).json({ error: "No menu items were found in the document." });
        }

        // 4. Map the AI Output to match your Supabase schema
        const insertData = menuItems.map(item => ({
            client_id: clientId,
            item_name: item.item_name,
            price: item.price
        }));

        // 5. Bulk Insert into the Database
        const { data: insertedItems, error: dbError } = await supabase
            .from('client_inventory')
            .insert(insertData)
            .select();

        if (dbError) throw dbError;

        return res.status(200).json({ 
            success: true, 
            itemsAdded: insertedItems.length,
            items: insertedItems
        });
        
    } catch (error) {
        console.error("Menu Extraction Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}