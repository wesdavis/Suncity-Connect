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

          // 2. THE DYNAMIC KILL SWITCH: Pull user_id along with account details
          const { data: clientCheck } = await supabase
            .from('clients')
            .select('user_id, ig_account_id, fb_page_id, meta_access_token') // 🚨 FIXED: Now pulling user_id
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

            // --- 2. FETCH THE REAL HANDLE FROM META (WORKAROUND) ---
            let realHandle = senderId.toString(); 
            
            if (clientCheck && clientCheck.meta_access_token) {
              try {
                if (platformName === 'Instagram') {
                  // Instagram still allows standard profile fetching via username
                  const profileUrl = `https://graph.facebook.com/v25.0/${senderId}?fields=username,name&access_token=${clientCheck.meta_access_token}`;
                  const profileRes = await fetch(profileUrl);
                  
                  if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    realHandle = profileData.username || profileData.name || senderId.toString();
                    console.log(`👤 Resolved IG Handle: @${realHandle}`);
                  }
                } else {
                  // 🚨 THE FACEBOOK WORKAROUND: Query the Message ID instead of the User ID
                  const msgUrl = `https://graph.facebook.com/v25.0/${messageId}?fields=from&access_token=${clientCheck.meta_access_token}`;
                  const msgRes = await fetch(msgUrl);
                  
                  if (msgRes.ok) {
                    const msgData = await msgRes.json();
                    // Extract the name directly from the message's 'from' object
                    if (msgData.from && msgData.from.name) {
                      realHandle = msgData.from.name;
                      console.log(`👤 Resolved FB Name via Message: ${realHandle}`);
                    }
                  } else {
                     const errJson = await msgRes.json().catch(() => ({}));
                     console.warn(`⚠️ Meta API message fetch restricted. Reason: ${errJson.error?.message || 'Permission Restricted'}`);
                  }
                }
              } catch (e) {
                console.error("❌ Failed to fetch user handle from Meta:", e.message);
              }
            }
            
            // --- 3. SAVE TO DATABASE WITH USER_ID STAMP ---
            const { error } = await supabase.from('b2b_inbox').insert([{
              ig_username: realHandle, 
              incoming_message: webhookEvent.message.text,
              status: 'pending',
              business_ig_id: businessId.toString(),
              meta_message_id: messageId, 
              platform: platformName,
              lead_source: leadSource,
              meta_sender_id: senderId.toString(),
              user_id: clientCheck?.user_id || null // 🚨 FIXED: Immediately stamp user_id so Dashboard can render the lead!
            }]);

            if (error && error.code === '23505') {
              console.log("♻️ Race condition caught! The database blocked Meta's duplicate ping.");
            } else if (error) {
              console.error("❌ Error inserting DM:", error);
            }
          }
        }

       // --- B. CATCH PUBLIC COMMENTS (OMNI-CHANNEL) ---
        if (entry.changes && entry.changes[0]) {
          const change = entry.changes[0];
          
          const isIGComment = change.field === 'comments';
          const isFBComment = change.field === 'feed' && change.value.item === 'comment';

          if (isIGComment || isFBComment) {
            const commentId = isIGComment ? change.value.id : change.value.comment_id;
            const commentText = isIGComment ? change.value.text : change.value.message;
            
            if (!change.value.from) continue;

            if (!commentText) {
              console.log("🔇 Dropping comment because it contains no text payload.");
              continue;
            }

            if (change.value.from.id.toString() === businessId.toString()) continue;

            const commenterName = change.value.from.username || change.value.from.name || "User";
            const platformName = isIGComment ? "Instagram" : "Facebook";

            const { error: lockError } = await supabase.from('handled_comments').insert([{ comment_id: commentId }]);
            
            if (lockError) {
              console.log(`♻️ Duplicate ${platformName} comment dropped by database lock.`);
              continue; 
            }

            console.log(`💬 Received ${platformName} Comment from @${commenterName}: ${commentText}`);
            
            try {
              const { data: client } = await supabase
                .from('clients')
                .select('meta_access_token, is_bot_active')
                .or(`ig_account_id.eq.${businessId},fb_page_id.eq.${businessId}`)
                .single();

              if (client && client.is_bot_active === false) {
                 console.log(`⏸️ Bot is PAUSED. Dropping comment reply.`);
                 continue; 
              }

              let replyText = "";
              const cleanText = commentText.toLowerCase().trim();

              if (cleanText.includes('demo')) {
                replyText = `Hey @${commenterName}! Awesome, we just sent you a DM with the link to grab a time on Wes's calendar! 🚀`;
              } else { 
                // 🚨 FIXED: Updated model string to gemini-1.5-flash
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `You are replying to a public ${platformName} comment for Sun City Connect. Keep it under 10 words, highly energetic, and use emojis. The user commented: "${commentText}"`;
                const result = await model.generateContent(prompt);
                replyText = result.response.text().trim();
              }

              if (client && client.meta_access_token) {
                const endpoint = isIGComment ? 'replies' : 'comments';
                const url = `https://graph.facebook.com/v18.0/${commentId}/${endpoint}`;

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
                  console.error(`❌ Failed to post ${platformName} comment reply:`, JSON.stringify(errorData));
                } else {
                  console.log(`✅ Successfully replied to ${platformName} comment with: ${replyText}`);
                }

                if (cleanText.includes('demo')) {
                  const dmUrl = `https://graph.facebook.com/v18.0/me/messages`;
                  const dmText = "Hey! Here is the link to grab a spot on Wes's calendar: https://calendar.app.google/rbTHX427Am9dFxhN9 Let me know if you have any questions! 🚀";

                  const dmResponse = await fetch(dmUrl, {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${client.meta_access_token}`
                    },
                    body: JSON.stringify({
                      recipient: { comment_id: commentId },
                      message: { text: dmText }
                    })
                  });

                  if (!dmResponse.ok) {
                    const errorText = await dmResponse.text();
                    console.error(`❌ Failed to send Private DM for ${platformName}:`, errorText);
                  } else {
                    console.log(`✉️ Successfully slid into DMs for ${platformName} comment!`);
                  }
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