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

    // THE OMNI-CHANNEL SWITCH: Accept both IG and FB Page data!
    if (body.object === 'instagram' || body.object === 'page') {
      for (const entry of body.entry) {
        const businessId = entry.id; 

        // --- A. CATCH DIRECT MESSAGES ---
        if (entry.messaging && entry.messaging[0]) {
          const webhookEvent = entry.messaging[0];
          const senderId = webhookEvent.sender.id;
          
          // 1. THE META KILL SWITCH: Check Meta's built-in echo flag
          if (webhookEvent.message && webhookEvent.message.is_echo) {
            console.log("🔇 Dropping Meta echo message.");
            continue; 
          }

          // 2. THE DYNAMIC KILL SWITCH: Look up both IG and FB IDs in Supabase
          const { data: clientCheck } = await supabase
            .from('clients')
            .select('ig_account_id, fb_page_id')
            .or(`ig_account_id.eq.${businessId},fb_page_id.eq.${businessId}`)
            .single();

          const isSenderTheClient = clientCheck && (
            senderId.toString() === clientCheck.ig_account_id ||
            senderId.toString() === clientCheck.fb_page_id
          );

          if (isSenderTheClient) {
            console.log("🔇 Dropping DM from our own account ID.");
            continue;
          }

          // 3. PROCESS THE DM: If it passes both kill switches, save it!
          if (webhookEvent.message && webhookEvent.message.text) {
            
            // --- THE DEDUPLICATION FILTER ---
            // Fetch the last message this user sent us to see if Meta is double-firing
            const { data: lastMsg } = await supabase
              .from('b2b_inbox')
              .select('incoming_message')
              .eq('ig_username', senderId.toString())
              .order('created_at', { ascending: false })
              .limit(1);

            // If the text perfectly matches their last message, drop it!
            if (lastMsg && lastMsg.length > 0 && lastMsg[0].incoming_message === webhookEvent.message.text) {
              console.log("♻️ Duplicate Meta event dropped.");
              continue;
            }

            console.log("📨 Received DM:", webhookEvent.message.text);
            
            await supabase.from('b2b_inbox').insert([{
              ig_username: senderId.toString(),
              incoming_message: webhookEvent.message.text,
              status: 'pending',
              business_ig_id: businessId.toString()
            }]);
          }
        }

        // --- B. CATCH PUBLIC COMMENTS ---
        if (entry.changes && entry.changes[0]) {
          const change = entry.changes[0];
          
          // PREVENT COMMENT ECHO: Ignore comments posted by the bot itself!
          if (change.field === 'comments' && change.value.from.id.toString() !== businessId.toString()) {
            const commentId = change.value.id;
            const commentText = change.value.text;
            const commenterUsername = change.value.from.username;

            console.log(`💬 Received Comment from @${commenterUsername}: ${commentText}`);
            
            try {
              // 1. DYNAMIC LOOKUP: Check if the ID belongs to their IG or FB profile
              const { data: client } = await supabase
                .from('clients')
                .select('meta_access_token, ig_username')
                .or(`ig_account_id.eq.${businessId},fb_page_id.eq.${businessId}`)
                .single();

              // 2. THE DYNAMIC KILL SWITCH (COMMENTS)
              if (client && client.ig_username && commenterUsername.toLowerCase() === client.ig_username.toLowerCase()) {
                console.log(`Skipping comment - it was posted by the client account: @${commenterUsername}`);
                continue; 
              }

              let replyText = "";
              const cleanText = commentText.toLowerCase().trim();

              // 3. GENERATE REPLY
              if (cleanText.includes('demo')) {
                replyText = `Hey @${commenterUsername}! Awesome, we just sent you a DM with the link to grab a time on Wes's calendar! 🚀`;
              } else {
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `You are replying to a public Instagram comment for Sun City Connect. Keep it under 10 words, highly energetic, and use emojis. The user commented: "${commentText}"`;
                const result = await model.generateContent(prompt);
                replyText = result.response.text().trim();
              }

              // 4. POST REPLY
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