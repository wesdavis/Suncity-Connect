import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Next.js config to disable the default body parser (Crucial for Stripe Webhooks)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read the raw body stream
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the webhook is legitimately from Stripe
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // 1. Extract the user ID we passed into the Payment Link
    const userId = session.client_reference_id;
    const stripeCustomerId = session.customer;

    if (userId) {
      console.log(`✅ Payment received for User ID: ${userId}. Upgrading account...`);

      // 2. Upgrade the account in Supabase
      const { error } = await supabase
        .from('clients')
        .update({ 
          is_subscribed: true,
          stripe_customer_id: stripeCustomerId
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating Supabase subscription:', error);
        return res.status(500).json({ error: 'Database update failed' });
      }
      
      console.log('🎉 Client successfully subscribed!');
    } else {
       console.log('⚠️ Checkout completed, but no client_reference_id was found.');
    }
  }

  // Handle cancelled subscriptions (when you are ready to build that)
  if (event.type === 'customer.subscription.deleted') {
     const subscription = event.data.object;
     const stripeCustomerId = subscription.customer;

     console.log(`📉 Subscription cancelled for Stripe Customer: ${stripeCustomerId}. Downgrading...`);
     
     await supabase
        .from('clients')
        .update({ is_subscribed: false })
        .eq('stripe_customer_id', stripeCustomerId);
  }

  // Tell Stripe we received the event successfully
  res.status(200).json({ received: true });
}