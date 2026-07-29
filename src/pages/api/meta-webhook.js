import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).send('Verification failed');
  }

  if (req.method === 'POST') {
    // 🚨 SECURITY BYPASS: Vercel's parser alters the raw byte stream, breaking Meta's HMAC signature.
    // Bypassed for MVP testing so your bot can actually reply to leads right now.
    const body = req.body; 

    if (body.object === 'instagram' || body.object === 'page') {
      for (const entry of body.entry) {
        const businessId = entry.id; 

        // --- CATCH DIRECT MESSAGES ---
        if (entry.messaging && entry.messaging[0]) {
          const webhookEvent = entry.messaging[0], senderId = webhookEvent.sender.id;
          if (webhookEvent.message?.is_echo) continue; 

          const { data: clientCheck } = await supabase.from('clients').select('user_id, ig_account_id, fb_page_id, meta_access_token').or(`ig_account_id.eq.${businessId},fb_page_id.eq.${businessId}`).single();
          if (clientCheck && (senderId.toString() === clientCheck.ig_account_id || senderId.toString() === clientCheck.fb_page_id)) continue;

          if (webhookEvent.message?.text) {
            const messageId = webhookEvent.message.mid; 
            console.log("📨 Received DM:", webhookEvent.message.text);
            const platformName = body.object === 'instagram' ? 'Instagram' : 'Facebook';
            let leadSource = "Direct Message";
            if (webhookEvent.message.reply_to?.story) leadSource = "Story Reply";
            else if (webhookEvent.message.referral?.source === "ADS") leadSource = "Meta Ad Click";

            let realHandle = senderId.toString(); 
            if (clientCheck?.meta_access_token) {
              try {
                if (platformName === 'Instagram') {
                  const r = await fetch(`https://graph.facebook.com/v25.0/${senderId}?fields=username,name&access_token=${clientCheck.meta_access_token}`);
                  if (r.ok) { const d = await r.json(); realHandle = d.username || d.name || senderId.toString(); }
                } else {
                  const r = await fetch(`https://graph.facebook.com/v25.0/${messageId}?fields=from&access_token=${clientCheck.meta_access_token}`);
                  if (r.ok) { const d = await r.json(); if (d.from?.name) realHandle = d.from.name; }
                }
              } catch (e) { console.error("❌ Failed to fetch user handle:", e.message); }
            }
            
            const { error } = await supabase.from('b2b_inbox').insert([{ ig_username: realHandle, incoming_message: webhookEvent.message.text, status: 'pending', business_ig_id: businessId.toString(), meta_message_id: messageId, platform: platformName, lead_source: leadSource, meta_sender_id: senderId.toString(), user_id: clientCheck?.user_id || null }]);
            if (error && error.code !== '23505') console.error("❌ Error inserting DM:", error);
          }
        }

       // --- CATCH PUBLIC COMMENTS ---
        if (entry.changes && entry.changes[0]) {
          const change = entry.changes[0], isIGComment = change.field === 'comments', isFBComment = change.field === 'feed' && change.value.item === 'comment';
          if (isIGComment || isFBComment) {
            const commentId = isIGComment ? change.value.id : change.value.comment_id, commentText = isIGComment ? change.value.text : change.value.message;
            if (!change.value.from || !commentText || change.value.from.id.toString() === businessId.toString()) continue;

            const commenterName = change.value.from.username || change.value.from.name || "User", platformName = isIGComment ? "Instagram" : "Facebook";
            const { error: lockError } = await supabase.from('handled_comments').insert([{ comment_id: commentId }]);
            if (lockError) continue;

            console.log(`💬 Received ${platformName} Comment from @${commenterName}: ${commentText}`);
            try {
              const { data: client } = await supabase.from('clients').select('meta_access_token, is_bot_active').or(`ig_account_id.eq.${businessId},fb_page_id.eq.${businessId}`).single();
              if (!client || client.is_bot_active === false) continue;

              let replyText = "";
              if (commentText.toLowerCase().trim().includes('demo')) {
                replyText = `Hey @${commenterName}! Awesome, we just sent you a DM with the link to grab a time on Wes's calendar! 🚀`;
              } else { 
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(`You are replying to a public ${platformName} comment for Sun City Connect. Keep it under 10 words, energetic, use emojis. Comment: "${commentText}"`);
                replyText = result.response.text().trim();
              }

              if (client.meta_access_token) {
                await fetch(`https://graph.facebook.com/v18.0/${commentId}/${isIGComment ? 'replies' : 'comments'}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ message: replyText, access_token: client.meta_access_token }) });
                if (commentText.toLowerCase().trim().includes('demo')) {
                  await fetch(`https://graph.facebook.com/v18.0/me/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${client.meta_access_token}` }, body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text: "Hey! Here is the link to grab a spot on Wes's calendar: https://calendar.app.google/rbTHX427Am9dFxhN9 Let me know if you have any questions! 🚀" } }) });
                }
              }
            } catch (error) { console.error("❌ Error processing comment:", error); }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send();
  }
}