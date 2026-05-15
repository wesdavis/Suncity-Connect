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
            .select('ig_account_id, fb_page_id, meta_access_token') // <-- WE NOW PULL THE ACCESS TOKEN
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

          // 3. PROCESS THE DM & FETCH REAL HANDLE
          if (webhookEvent.message && webhookEvent.message.text) {
            const messageId = webhookEvent.message.mid; 
            
            console.log("📨 Received DM:", webhookEvent.message.text);

            // --- 1. DETECT PLATFORM AND LEAD SOURCE ---
            const platformName = body.object === 'instagram' ? 'Instagram' : 'Facebook';
            let leadSource = "Direct Message";

            if (webhookEvent.message.reply_to && webhookEvent.message.reply_to.story) {
              leadSource = "Story Reply";
            } else if (webhookEvent.message.referral && webhookEvent.message.referral.source === "ADS") {
              leadSource = "Meta Ad Click";
            }

            // --- 2. FETCH THE REAL HANDLE FROM META (FIXED) ---
            let realHandle = senderId.toString(); 
            
            if (clientCheck && clientCheck.meta_access_token) {
              try {
                // Facebook throws an error if you ask for 'username'. We have to ask dynamically!
                const profileFields = platformName === 'Instagram' ? 'username,name' : 'name,first_name';
                const profileUrl = `https://graph.facebook.com/v18.0/${senderId}?fields=${profileFields}&access_token=${clientCheck.meta_access_token}`;
                const profileRes = await fetch(profileUrl);
                
                if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  realHandle = profileData.username || profileData.name || profileData.first_name || senderId.toString();
                  console.log(`👤 Resolved ID ${senderId} to Handle: @${realHandle} on ${platformName}`);
                } else {
                   console.error("❌ Meta API Error fetching profile:", await profileRes.text());
                }
              } catch (e) {
                console.error("❌ Failed to fetch user handle from Meta:", e);
              }
            }
            
            // --- 3. SAVE TO DATABASE ---
            const { error } = await supabase.from('b2b_inbox').insert([{
              ig_username: realHandle, 
              incoming_message: webhookEvent.message.text,
              status: 'pending',
              business_ig_id: businessId.toString(),
              meta_message_id: messageId, 
              platform: platformName,
              lead_source: leadSource,
              meta_sender_id: senderId.toString()
            }]);

            if (error && error.code === '23505') {
              console.log("♻️ Race condition caught! The database blocked Meta's duplicate ping.");
            } else if (error) {
              console.error("❌ Error inserting DM:", error);
            }
          }
        }

        // --- B. CATCH PUBLIC COMMENTS ---
        if (entry.changes && entry.changes[0]) {
          const change = entry.changes[0];
          
          if (change.field === 'comments' && change.value.from.id.toString() !== businessId.toString()) {
            const commentId = change.value.id;
            const commentText = change.value.text;
            const commenterUsername = change.value.from.username;

            // --- THE DATABASE LOCK FOR COMMENTS ---
            // Try to insert the comment ID into our bouncer table
            const { error: lockError } = await supabase.from('handled_comments').insert([{ comment_id: commentId }]);
            
            // If it fails, it means we already replied to this comment. Drop the duplicate!
            if (lockError) {
              console.log("♻️ Duplicate comment ping dropped by database lock.");
              continue; 
            }

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