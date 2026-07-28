import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // --- 🛒 1. CONVERSATIONAL COMMERCE ROUTING (AGNOSTIC) ---
    // If the checkout session has our generic product order metadata
    if (session.metadata?.order_type === 'product_order') {
      const clientId = session.metadata.client_id;
      const items = session.metadata.items;
      const fulfillmentType = session.metadata.fulfillment || "Standard";
      
      console.log(`📦 New storefront order for Client ID: ${clientId}. Sending merchant notification...`);

      const { data: clientData, error: dbError } = await supabase
        .from('clients')
        .select('email, business_name')
        .eq('id', clientId)
        .single();

      if (dbError) {
         console.error('❌ Error fetching client for order notification:', dbError);
         return res.status(500).json({ error: 'Database fetch failed' });
      }

      // NOTE: Using primary email. Can be updated to a dedicated 'orders_email' later.
      const targetEmail = clientData.email; 

      try {
         await resend.emails.send({
            from: 'Sun City Connect Orders <orders@suncityconnect.com>',
            to: targetEmail,
            subject: `🚨 NEW ORDER RECEIVED: ${clientData.business_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
                <h2 style="text-align: center; color: #333;">New Order Received</h2>
                <p style="text-align: center; color: #666;"><strong>Fulfillment:</strong> ${fulfillmentType}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 14px; color: #888;"><strong>ORDER DETAILS:</strong></p>
                <p style="font-size: 18px; font-weight: bold; line-height: 1.6; color: #000;">${items}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="text-align: center; color: #28a745; font-weight: bold;">✔ PAID VIA AI CASHIER</p>
              </div>
            `
         });
         console.log(`✅ Merchant order notification successfully sent to ${targetEmail}`);
      } catch (resendError) {
         console.error('❌ Resend failed to send order notification:', resendError);
      }
    } 
    
    // --- 💻 2. SAAS SUBSCRIPTION ROUTING ---
    // If there is no product metadata, treat it as a standard Sun City Connect software signup
    else {
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;

      if (userId) {
        console.log(`✅ Payment received for User ID: ${userId}. Upgrading account...`);

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
         console.log('⚠️ Checkout completed, but no client_reference_id or product metadata was found.');
      }
    }
  }

  // Handle cancelled subscriptions
  if (event.type === 'customer.subscription.deleted') {
     const subscription = event.data.object;
     const stripeCustomerId = subscription.customer;

     console.log(`📉 Subscription cancelled for Stripe Customer: ${stripeCustomerId}. Downgrading...`);
     
     await supabase
        .from('clients')
        .update({ is_subscribed: false })
        .eq('stripe_customer_id', stripeCustomerId);
  }

  res.status(200).json({ received: true });
}