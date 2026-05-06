const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async (req, res) => {
  // 1. THE HANDSHAKE (GET Request)
  // Meta requires a security check when you first connect the webhook.
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // This is a custom password you will set in Vercel and Meta
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook securely connected to Meta!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Verification failed');
    }
  }

  // 2. THE CATCHER (POST Request)
  // This catches the actual DMs and comments.
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Ensure it's a page or instagram event
      if (body.object === 'page' || body.object === 'instagram') {
        
        for (const entry of body.entry) {
          // Navigate Meta's nested JSON to find the message
          const webhookEvent = entry.messaging ? entry.messaging[0] : null;
          
          // THIS IS YOUR NEW FILTER: Only trigger if actual text exists
          if (webhookEvent && webhookEvent.message && webhookEvent.message.text) {
            const senderId = webhookEvent.sender.id;
            const recipientId = webhookEvent.recipient.id; // <-- WE ADDED THIS
            const messageText = webhookEvent.message.text;
            
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

            console.log(`📥 Incoming text: "${messageText}" to Business ID: ${recipientId}`);

            // Insert into Supabase with the Business ID included
            const { error } = await supabase
              .from('b2b_inbox')
              .insert([{ 
                  ig_username: senderId, 
                  incoming_message: messageText,
                  business_ig_id: recipientId, // <-- WE ADDED THIS
                  status: 'pending'
              }]);

            console.log(`📥 Incoming text caught: "${messageText}" from ID: ${senderId}`);

            // Insert into Supabase (This triggers your existing sales-bot.js!)
            const { error } = await supabase
              .from('b2b_inbox')
              .insert([{ 
                  ig_username: senderId, 
                  incoming_message: messageText,
                  status: 'pending'
              }]);

            if (error) console.error('Supabase Insert Error:', error);
          } else {
            console.log('👻 Ignored non-text event (read receipt, typing, etc.)');
          }
        }

        // Return a 200 OK immediately so Meta doesn't retry and spam you
        return res.status(200).send('EVENT_RECEIVED');
      } else {
        return res.status(404).send('Not Found');
      }

    } catch (error) {
      console.error('Webhook Error:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  return res.status(405).send('Method Not Allowed');
};