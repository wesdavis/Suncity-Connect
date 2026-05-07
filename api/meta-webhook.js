const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async (req, res) => {
  // 1. THE HANDSHAKE (GET Request)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook securely connected to Meta!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Verification failed');
    }
  }

  // 2. THE CATCHER (POST Request)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      if (body.object === 'page' || body.object === 'instagram') {
        
        for (const entry of body.entry) {
          const webhookEvent = entry.messaging ? entry.messaging[0] : null;
          
          if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
            
            if (webhookEvent.message.is_echo) {
                console.log('👻 Ignored bot echo');
                continue;
            }

            const senderId = webhookEvent.sender.id;
            const recipientId = webhookEvent.recipient.id; 
            const messageText = webhookEvent.message.text;
            
            console.log(`📥 Incoming text: "${messageText}" to Business ID: ${recipientId}`);

            // NEW: The Stutter Filter
            // Check if we just caught this exact message a millisecond ago
            const { data: existingMsg } = await supabase
              .from('b2b_inbox')
              .select('id')
              .eq('ig_username', senderId)
              .eq('incoming_message', messageText)
              .eq('status', 'pending')
              .limit(1);

            if (existingMsg && existingMsg.length > 0) {
              console.log('🛑 Caught a Meta stutter! Ignoring duplicate payload.');
              continue; // Skips the insert entirely
            }

            // Insert into Supabase 
            const { error: insertError } = await supabase
              .from('b2b_inbox')
              .insert([{ 
                  ig_username: senderId, 
                  incoming_message: messageText,
                  business_ig_id: recipientId, 
                  status: 'pending'
              }]);

            if (insertError) console.error('Supabase Insert Error:', insertError);
            
          } else {
            console.log('👻 Ignored non-text event');
          }
        }

        return res.status(200).send('EVENT_RECEIVED');
      } else {
        return res.status(404).send('Not Found');
      }

    } catch (webhookError) {
      console.error('Webhook Error:', webhookError);
      return res.status(500).send('Internal Server Error');
    }
  }