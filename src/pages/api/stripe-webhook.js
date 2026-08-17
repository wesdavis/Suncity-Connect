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

/** Parse items from metadata — supports JSON array OR "2x Name, 1x Other" strings */
function parseOrderItems(rawItems, rawItemsJson) {
  // Prefer structured JSON from checkout-link
  if (rawItemsJson) {
    try {
      const parsed = JSON.parse(rawItemsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((i) => i && i.name && i.quantity)
          .map((i) => ({ name: String(i.name).trim(), quantity: Number(i.quantity) || 1 }));
      }
    } catch (e) {
      console.warn('⚠️ items_json parse failed:', e.message);
    }
  }

  if (!rawItems) return [];

  // JSON array stored in items field
  if (typeof rawItems === 'string' && rawItems.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((i) => i && i.name && i.quantity)
          .map((i) => ({ name: String(i.name).trim(), quantity: Number(i.quantity) || 1 }));
      }
    } catch (e) {
      console.warn('⚠️ items JSON parse failed:', e.message);
    }
  }

  // Human string: "2x Hazy Pale Ale, 1x Midnight Stout"
  if (typeof rawItems === 'string') {
    return rawItems
      .split(',')
      .map((part) => {
        const m = part.trim().match(/^(\d+)\s*x\s+(.+)$/i);
        if (!m) return null;
        return { name: m[2].trim(), quantity: parseInt(m[1], 10) };
      })
      .filter(Boolean);
  }

  return [];
}

async function resolveOwnerEmail(clientRow) {
  // 1. Preferred: notification_email from onboarding / settings
  if (clientRow?.notification_email && clientRow.notification_email.includes('@')) {
    console.log('📧 Using clients.notification_email');
    return clientRow.notification_email.trim().toLowerCase();
  }

  // 2. Fallback: auth.users (often missing for Facebook login)
  if (clientRow?.user_id) {
    try {
      const { data, error } = await supabase.auth.admin.getUserById(clientRow.user_id);
      if (error) {
        console.warn('⚠️ auth.admin.getUserById error:', error.message);
      } else if (data?.user?.email) {
        console.log(`📧 Resolved owner email via auth for user ${clientRow.user_id}`);
        return data.user.email;
      }
    } catch (e) {
      console.warn('⚠️ auth.admin.getUserById failed:', e.message);
    }
  } else {
    console.warn('⚠️ Client has no user_id — cannot resolve owner email from auth');
  }

  // 3. Optional platform fallback
  if (process.env.ORDERS_FALLBACK_EMAIL) {
    console.log('📧 Using ORDERS_FALLBACK_EMAIL');
    return process.env.ORDERS_FALLBACK_EMAIL;
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];

  // Support both platform ("Your account") and Connect ("Connected accounts") destinations
  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
  ].filter(Boolean);

  if (webhookSecrets.length === 0) {
    console.error('❌ No STRIPE_WEBHOOK_SECRET or STRIPE_CONNECT_WEBHOOK_SECRET configured');
    return res.status(500).send('Webhook secrets not configured');
  }

  let event;
  let lastVerifyError = null;

  for (const secret of webhookSecrets) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      lastVerifyError = null;
      break;
    } catch (err) {
      lastVerifyError = err;
    }
  }

  if (!event) {
    console.error('❌ Stripe Webhook signature verification failed:', lastVerifyError?.message);
    return res.status(400).send(`Webhook Error: ${lastVerifyError?.message || 'Invalid signature'}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // --- 🛒 1. PRODUCT ORDERS (storefront / DM cashier) ---
    if (session.metadata?.order_type === 'product_order') {
      const clientId = session.metadata.client_id;
      const rawItems = session.metadata.items;
      const rawItemsJson = session.metadata.items_json;
      const fulfillmentType = session.metadata.fulfillment || 'Standard';
      const orderTotal = session.metadata.order_total || (session.amount_total != null ? (session.amount_total / 100).toFixed(2) : null);
      const customerEmail = session.customer_details?.email || session.customer_email || null;

      console.log(`📦 New product order for Client ID: ${clientId}`);

      const parsedItems = parseOrderItems(rawItems, rawItemsJson);
      console.log(`🧾 Parsed items:`, parsedItems);

      // 1A. DECREMENT INVENTORY
      for (const item of parsedItems) {
        try {
          const { data: invItem, error: invErr } = await supabase
            .from('client_inventory')
            .select('id, stock_count, item_name')
            .eq('client_id', clientId)
            .ilike('item_name', item.name)
            .maybeSingle();

          if (invErr) {
            console.error(`❌ Inventory lookup failed for ${item.name}:`, invErr);
            continue;
          }

          if (invItem && invItem.stock_count !== null && invItem.stock_count < 9999) {
            const newStock = Math.max(0, Number(invItem.stock_count) - Number(item.quantity));
            const { error: updErr } = await supabase
              .from('client_inventory')
              .update({ stock_count: newStock })
              .eq('id', invItem.id);

            if (updErr) {
              console.error(`❌ Stock update failed for ${item.name}:`, updErr);
            } else {
              console.log(`📉 Stock '${invItem.item_name}': ${invItem.stock_count} → ${newStock}`);
            }
          } else if (!invItem) {
            console.warn(`⚠️ No inventory row matched name "${item.name}" for client ${clientId}`);
          }
        } catch (stockErr) {
          console.error(`❌ Stock loop error for ${item.name}:`, stockErr);
        }
      }

      // 1B. NOTIFY BUSINESS OWNER
      const { data: clientData, error: dbError } = await supabase
        .from('clients')
        .select('id, business_name, user_id, notification_email')
        .eq('id', clientId)
        .single();

      if (dbError) {
        console.error('❌ Error fetching client for order notification:', dbError);
      } else {
        console.log(`📬 Notifying owner for ${clientData.business_name} (user_id=${clientData.user_id || 'NONE'})`);
        const targetEmail = await resolveOwnerEmail(clientData);
        const displayItems =
          parsedItems.length > 0
            ? parsedItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')
            : rawItems || 'See Stripe dashboard';

        if (!targetEmail) {
          console.error(
            '❌ No owner email found for client',
            clientId,
            '- set ORDERS_FALLBACK_EMAIL in Vercel or ensure clients.user_id is linked to auth.users'
          );
        } else {
          try {
            // Use assistant@ — same verified domain sender pattern as web-chat / bookings
            const { data: sendData, error: sendError } = await resend.emails.send({
              from: 'Sun City Connect Orders <assistant@suncityconnect.com>',
              to: targetEmail,
              subject: `🚨 NEW ORDER: ${clientData.business_name || 'Your storefront'}`,
              html: `
                <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e5e5e5; border-radius: 12px; max-width: 520px; margin: auto; background: #fff;">
                  <h2 style="margin: 0 0 8px; color: #111; text-align: center;">New Order Received</h2>
                  <p style="text-align: center; color: #666; margin: 0 0 20px;"><strong>Fulfillment:</strong> ${fulfillmentType}</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 0 0 20px;" />
                  <p style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;"><strong>Order details</strong></p>
                  <p style="font-size: 18px; font-weight: bold; line-height: 1.5; color: #000; margin: 0 0 12px;">${displayItems}</p>
                  ${orderTotal ? `<p style="font-size: 16px; color: #111; margin: 0 0 12px;"><strong>Total paid:</strong> $${orderTotal}</p>` : ''}
                  ${customerEmail ? `<p style="font-size: 14px; color: #444; margin: 0 0 12px;"><strong>Customer email:</strong> ${customerEmail}</p>` : ''}
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="text-align: center; color: #16a34a; font-weight: bold; margin: 0;">✔ Paid via AI Cashier</p>
                  <p style="text-align: center; color: #999; font-size: 12px; margin: 12px 0 0;">Sun City Connect</p>
                </div>
              `,
            });

            if (sendError) {
              console.error('❌ Resend API error:', JSON.stringify(sendError));
            } else {
              console.log(`✅ Merchant order notification sent to ${targetEmail}`, sendData?.id || '');
            }
          } catch (resendError) {
            console.error('❌ Resend failed to send order notification:', resendError?.message || resendError);
          }
        }
      }
    }

    // --- 💻 2. SAAS SUBSCRIPTION ---
    else {
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;

      if (userId) {
        console.log(`✅ Subscription payment for User ID: ${userId}`);

        const { error } = await supabase
          .from('clients')
          .update({
            is_subscribed: true,
            stripe_customer_id: stripeCustomerId,
          })
          .eq('user_id', userId);

        if (error) {
          console.error('❌ Error updating subscription:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        console.log('🎉 Client subscribed successfully');
      } else {
        console.log('⚠️ Checkout completed without client_reference_id or product_order metadata');
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const stripeCustomerId = subscription.customer;

    console.log(`📉 Subscription cancelled for Stripe Customer: ${stripeCustomerId}`);

    await supabase
      .from('clients')
      .update({ is_subscribed: false })
      .eq('stripe_customer_id', stripeCustomerId);
  }

  res.status(200).json({ received: true });
}
