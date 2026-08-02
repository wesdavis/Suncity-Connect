const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🚨 1. DISABLE VERCEL BODY PARSER TO PRESERVE RAW BUFFER
const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read raw request stream
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Helper function to verify Meta's HMAC SHA-256 Signature against RAW body
function verifyMetaSignature(rawBody, signatureHeader) {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    console.warn("⚠️ META_APP_SECRET environment variable missing. Skipping signature check.");
    return true; 
  }

  if (!signatureHeader) {
    console.error("❌ Missing X-Hub-Signature-256 header.");
    return false;
  }

  try {
    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const expectedSignature = `sha256=${expectedHash}`;

    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return false;
  }
}

const handler = async (req, res) => {
  // 1. THE HANDSHAKE (GET)
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

  // 2. RECEIVING DATA FROM META (POST)
  if (req.method === 'POST') {
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-hub-signature-256'];

    // 🚨 HMAC SECURITY CHECK
    if (!verifyMetaSignature(rawBody, signature)) {
      console.error("⛔ Unauthorized request: HMAC signature mismatch.");
      return res.status(401).send('Invalid signature');
    }

    let body;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch (parseErr) {
      console.error("❌ Failed to parse incoming webhook JSON body.");
      return res.status(400).send('Invalid JSON');
    }

    // THE OMNI-CHANNEL SWITCH: Accept both IG and FB Page data!
    if (body.object === 'instagram' || body.object === 'page') {
      for (const entry of body.entry) {
        const businessId = entry.id; 

        // --- A. CATCH DIRECT MESSAGES ---
        if (entry.messaging && entry.messaging[0]) {
          const webhookEvent = entry.messaging[0];
          const senderId = webhookEvent.sender.id;
          
          if (webhookEvent.message && webhookEvent.message.is_echo) {
            console.log("🔇 Dropping Meta echo message.");
            continue; 
          }

          const { data: clientCheck } = await supabase
            .from('clients')
            .select('user_id, ig_account_id, fb_page_id, meta_access_token')
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

          if (webhookEvent.message && webhookEvent.message.text) {
            const messageId = webhookEvent.message.mid; 
            
            console.log("📨 Received DM:", webhookEvent.message.text);

            const platformName = body.object === 'instagram' ? 'Instagram' : 'Facebook';
            let leadSource = "Direct Message";

            if (webhookEvent.message.reply_to && webhookEvent.message.reply_to.story) {
              leadSource = "Story Reply";
            } else if (webhookEvent.message.referral && webhookEvent.message.referral.source === "ADS") {
              leadSource = "Meta Ad Click";
            }

            let realHandle = senderId.toString(); 
            
            if (clientCheck && clientCheck.meta_access_token) {
              try {
                if (platformName === 'Instagram') {
                  const profileUrl = `https://graph.facebook.com/v25.0/${senderId}?fields=username,name&access_token=${clientCheck.meta_access_token}`;
                  const profileRes = await fetch(profileUrl);
                  
                  if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    realHandle = profileData.username || profileData.name || senderId.toString();
                    console.log(`👤 Resolved IG Handle: @${realHandle}`);
                  }
                } else {
                  const msgUrl = `https://graph.facebook.com/v25.0/${messageId}?fields=from&access_token=${clientCheck.meta_access_token}`;
                  const msgRes = await fetch(msgUrl);
                  
                  if (msgRes.ok) {
                    const msgData = await msgRes.json();
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
            
            const { error } = await supabase.from('b2b_inbox').insert([{
              ig_username: realHandle, 
              incoming_message: webhookEvent.message.text,
              status: 'pending',
              business_ig_id: businessId.toString(),
              meta_message_id: messageId, 
              platform: platformName,
              lead_source: leadSource,
              meta_sender_id: senderId.toString(),
              user_id: clientCheck?.user_id || null
            }]);

            if (error && error.code === '23505') {
              console.log("♻️ Race condition caught! Database blocked Meta's duplicate ping.");
            } else if (error) {
              console.error("❌ Error inserting DM:", error);
            }
          }
        }

       // --- B. CATCH PUBLIC COMMENTS ---
        if (entry.changes && entry.changes[0]) {
          const change = entry.changes[0];
          
          const isIGComment = change.field === 'comments';
          const isFBComment = change.field === 'feed' && change.value.item === 'comment';

          if (isIGComment || isFBComment) {
            const commentId = isIGComment ? change.value.id : change.value.comment_id;
            const commentText = isIGComment ? change.value.text : change.value.message;
            
            if (!change.value.from || !commentText) continue;
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
              // 🚨 QUERY DYNAMIC CLIENT BOOKING LINKS
              const { data: client } = await supabase
                .from('clients')
                .select('user_id, meta_access_token, is_bot_active, booking_link, calendar_url, business_name')
                .or(`ig_account_id.eq.${businessId},fb_page_id.eq.${businessId}`)
                .single();

              // Insert comment into inbox as 'replied' so sales-bot.js ignores it
              const { error: inboxError } = await supabase.from('b2b_inbox').insert([{
                ig_username: commenterName, 
                incoming_message: commentText,
                status: 'replied',
                business_ig_id: businessId.toString(),
                comment_id: commentId,
                platform: platformName,
                lead_source: `${platformName} Comment`,
                meta_sender_id: change.value.from.id.toString(),
                user_id: client?.user_id || null
              }]);

              if (inboxError && inboxError.code !== '23505') {
                console.error("❌ Error inserting comment into CRM inbox:", inboxError);
              }

              if (client && client.is_bot_active === false) {
                 console.log(`⏸️ Bot is PAUSED. Dropping comment reply.`);
                 continue; 
              }

              // 🚨 DYNAMIC AI INTENT CLASSIFICATION SCHEMA
              const responseSchema = {
                type: SchemaType.OBJECT,
                properties: {
                  should_send_dm: {
                    type: SchemaType.BOOLEAN,
                    description: "True ONLY if the user's comment shows intent to book, buy, learn more, or request a link/demo."
                  },
                  public_reply_text: {
                    type: SchemaType.STRING,
                    description: "Under 10 words, highly energetic, use emojis. If should_send_dm is true, tell them to check their DMs. If false, reply warmly without mentioning DMs."
                  }
                },
                required: ["should_send_dm", "public_reply_text"]
              };

              const model = genAI.getGenerativeModel({ 
                model: "gemini-3.5-flash-lite",
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: responseSchema
                }
              });

              const prompt = `Evaluate this public ${platformName} comment left on ${client?.business_name || 'Sun City Connect'}'s page: "${commentText}"`;
              const result = await model.generateContent(prompt);
              
              let aiDecision;
              try {
                aiDecision = JSON.parse(result.response.text());
              } catch (e) {
                console.error("Failed to parse Gemini intent JSON:", e);
                aiDecision = { should_send_dm: false, public_reply_text: "Thanks for commenting! 🚀" };
              }

              const replyText = aiDecision.public_reply_text;
              const isLeadIntent = aiDecision.should_send_dm;

              if (client && client.meta_access_token) {
                // 1. Post Public Reply
                const endpoint = isIGComment ? 'replies' : 'comments';
                const url = `https://graph.facebook.com/v25.0/${commentId}/${endpoint}`;

                await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                    message: replyText,
                    access_token: client.meta_access_token
                  })
                });

                // 2. Send Private DM using the onboarded client's dynamic booking link
                if (isLeadIntent) {
                  const dynamicLink = client.booking_link || client.calendar_url || 'https://suncityconnect.com';
                  const dmUrl = `https://graph.facebook.com/v25.0/me/messages`;
                  const dmText = `Hey! Here is the link to grab a spot on our calendar: ${dynamicLink} Let us know if you have any questions! 🚀`;

                  await fetch(dmUrl, {
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
                }
              }
            } catch (error) {
              console.error("❌ Error processing comment:", error);
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } else {
      return res.status(404).send();
    }
  }
};

module.exports = handler;
module.exports.config = config;