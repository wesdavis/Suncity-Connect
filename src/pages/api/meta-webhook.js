const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  // 1. THE HANDSHAKE
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('✅ Webhook securely connected to Meta!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Verification failed');
    }
  }

  // 2. RECEIVING DATA FROM META
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        const businessIgId = entry.id; 

        // --- A. CATCH DIRECT MESSAGES ---
        if (entry.messaging && entry.messaging[0]) {
          const webhookEvent = entry.messaging[0];
          const senderId = webhookEvent.sender.id;
          
          // PREVENT DM ECHO: Ignore messages sent by the bot itself!
          if (senderId.toString() !== businessIgId.toString() && webhookEvent.message && webhookEvent.message.text) {
            console.log("📨 Received DM:", webhookEvent.message.text);
            
            await supabase.from('b2b_inbox').insert([{
              ig_username: senderId,
              incoming_message: webhookEvent.message.text,
              status: 'pending',
              business_ig_id: businessIgId
            }]);
          }
        }

        // --- B. CATCH PUBLIC COMMENTS ---
        if (entry.changes && entry.changes[0]) {
          const change = entry.changes[0];
          
          // PREVENT COMMENT ECHO: Ignore comments posted by the bot itself!
          if (change.field === 'comments' && change.value.from.id.toString() !== businessIgId.toString()) {
            const commentId = change.value.id;
            const commentText = change.value.text;
            const commenterUsername = change.value.from.username;
            // THE BULLETPROOF KILL SWITCH
            if (commenterUsername.toLowerCase() === 'taptap_social') {
              console.log("Skipping our own comment.");
              return; 
            }

            console.log(`💬 Received Comment from @${commenterUsername}: ${commentText}`);
            
            try {
              let replyText = "";
              const cleanText = commentText.toLowerCase().trim();

              if (cleanText.includes('demo')) {
                replyText = `Hey @${commenterUsername}! Awesome, we just sent you a DM with the link to grab a time on Wes's calendar! 🚀`;
              } else {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `You are replying to a public Instagram comment for Sun City Connect. Keep it under 10 words, highly energetic, and use emojis. The user commented: "${commentText}"`;
                const result = await model.generateContent(prompt);
                replyText = result.response.text().trim();
              }

              const { data: client } = await supabase
                .from('clients')
                .select('meta_access_token')
                .eq('ig_account_id', businessIgId)
                .single();

              if (client && client.meta_access_token) {
                const url = `https://graph.facebook.com/v18.0/${commentId}/replies`;
                const response = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                    message: replyText,
                    access_token: client.meta_access_token
                  })
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error("❌ Failed to post comment reply:", JSON.stringify(errorData));
                } else {
                  console.log(`✅ Successfully replied to comment with: ${replyText}`);
                }
              }
            } catch (error) {
              console.error("❌ Error processing comment:", error);
            }
          }
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send();
    }
  }
};