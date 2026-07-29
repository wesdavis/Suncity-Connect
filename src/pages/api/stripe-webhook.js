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

    // --- 🛒 1. CONVERSATIONAL COMMERCE ROUTING (PRODUCT ORDERS) ---
    if (session.metadata?.order_type === 'product_order') {
      const clientId = session.metadata.client_id;
      const rawItems = session.metadata.items;
      const fulfillmentType = session.metadata.fulfillment || "Standard";
      
      console.log(`📦 New storefront order for Client ID: ${clientId}. Processing order...`);

      // 1A. DECREMENT INVENTORY STOCK
      let parsedItems = [];
      try {
        parsedItems = typeof rawItems === 'string' && rawItems.startsWith('[') 
          ? JSON.parse(rawItems) 
          : [];
      } catch (pErr) {
        console.warn("⚠️ Could not parse items metadata as JSON array for stock update.");
      }

      if (Array.isArray(parsedItems) && parsedItems.length > 0) {
        for (const item of parsedItems) {
          if (item.name && item.quantity) {
            // Find the item in client's inventory
            const { data: invItem } = await supabase
              .from('client_inventory')
              .select('id, stock_count')
              .eq('client_id', clientId)
              .ilike('item_name', item.name)
              .single();

            // If found and stock is tracked (not unlimited 9999)
            if (invItem && invItem.stock_count !== null && invItem.stock_count < 9999) {
              const newStock = Math.max(0, invItem.stock_count - item.quantity);
              
              await supabase
                .from('client_inventory')
                .update({ stock_count: newStock })
                .eq('id', invItem.id);

              console.log(`📉 Decremented stock for '${item.name}': ${invItem.stock_count} ➔ ${newStock}`);
            }
          }
        }
      }

      // 1B. FETCH CLIENT DETAILS & SEND MERCHANT NOTIFICATION
      const { data: clientData, error: dbError } = await supabase
        .from('clients')
        .select('email, business_name')
        .eq('id', clientId)
        .single();

      if (dbError) {
         console.error('❌ Error fetching client for order notification:', dbError);
         return res.status(500).json({ error: 'Database fetch failed' });
      }

      const targetEmail = clientData.email; 
      const displayItems = Array.isArray(parsedItems) && parsedItems.length > 0
        ? parsedItems.map(i => `${i.quantity}x ${i.name}`).join(', ')
        : rawItems;

      try {
         await resend.emails.send({
            from: 'Sun City Connect Orders <orders@suncityconnect.com>',
            to: targetEmail,
            subject: `🚨 NEW ORDER RECEIVED: ${clientData.business_name}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto; background-color: #ffffff;">
                <h2 style="text-align: center; color: #111;">New Order Received</h2>
                <p style="text-align: center; color: #666;"><strong>Fulfillment:</strong> ${fulfillmentType}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;"><strong>ORDER DETAILS:</strong></p>
                <p style="font-size: 18px; font-weight: bold; line-height: 1.6; color: #000;">${displayItems}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="text-align: center; color: #16a34a; font-weight: bold;">✔ PAID VIA AI CASHIER</p>
              </div>
            `
         });
         console.log(`✅ Merchant order notification successfully sent to ${targetEmail}`);
      } catch (resendError) {
         console.error('❌ Resend failed to send order notification:', resendError);
      }
    } 
    
    // --- 💻 2. SAAS SUBSCRIPTION ROUTING ---
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