export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { shortToken } = req.body;

        if (!shortToken) {
            return res.status(400).json({ error: 'Missing token' });
        }

        // Pulling your App ID and Secret from your environment variables
        const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET; 

        // Ask Meta to upgrade the short-lived token to a 60-day token
        const response = await fetch(`https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`);
        
        const data = await response.json();

        if (data.error) {
            console.error("Meta Token Exchange Error:", data.error);
            return res.status(400).json({ error: data.error.message });
        }

        // Send the new long-lived token back to the frontend
        return res.status(200).json({ longToken: data.access_token });
        
    } catch (error) {
        console.error("Exchange route crashed:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}