import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://suncityconnect.com';

async function getUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function getClientForUser(userId) {
  const { data, error } = await supabase
    .from('clients')
    .select(
      'id, user_id, business_name, notification_email, stripe_account_id, details_submitted, charges_enabled, payouts_enabled, stripe_requirements_due, payment_processor'
    )
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

function mapAccountToClientFields(account) {
  const due = [
    ...(account.requirements?.currently_due || []),
    ...(account.requirements?.past_due || []),
  ];

  return {
    stripe_account_id: account.id,
    details_submitted: !!account.details_submitted,
    charges_enabled: !!account.charges_enabled,
    payouts_enabled: !!account.payouts_enabled,
    stripe_requirements_due: due.length ? due : null,
    payment_processor: 'stripe',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const client = await getClientForUser(user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client profile not found. Finish onboarding first.' });
    }

    const action = req.body?.action || 'status';

    // --- STATUS: refresh from Stripe and sync DB ---
    if (action === 'status') {
      if (!client.stripe_account_id) {
        return res.status(200).json({
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
          requirements_due: [],
          stripe_account_id: null,
        });
      }

      const account = await stripe.accounts.retrieve(client.stripe_account_id);
      const fields = mapAccountToClientFields(account);

      await supabase.from('clients').update(fields).eq('id', client.id);

      return res.status(200).json({
        connected: true,
        stripe_account_id: account.id,
        charges_enabled: fields.charges_enabled,
        payouts_enabled: fields.payouts_enabled,
        details_submitted: fields.details_submitted,
        requirements_due: fields.stripe_requirements_due || [],
      });
    }

    // --- ONBOARD: create Express connected account if needed + Account Link ---
    if (action === 'onboard') {
      let accountId = client.stripe_account_id || null;

      // Platform's own account cannot use Account Links — must be a Connected account
      let platformAccountId = null;
      try {
        const platform = await stripe.accounts.retrieve();
        platformAccountId = platform.id;
      } catch (e) {
        console.warn('Could not retrieve platform account id:', e.message);
      }

      const isPlatformSelf =
        accountId && platformAccountId && accountId === platformAccountId;

      // Validate existing id is a real connected account we can link
      let needsNewAccount = !accountId || isPlatformSelf;
      if (accountId && !needsNewAccount) {
        try {
          const existing = await stripe.accounts.retrieve(accountId);
          // Standard/platform-only accounts aren't Express connected under us
          if (!existing || existing.id === platformAccountId) {
            needsNewAccount = true;
          }
        } catch (e) {
          console.warn('Stored stripe_account_id not retrievable, creating new Express account:', e.message);
          needsNewAccount = true;
        }
      }

      if (needsNewAccount) {
        const email = client.notification_email || user.email || undefined;

        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: email || undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: client.business_name || undefined,
            product_description: 'Orders placed through Sun City Connect AI cashier',
          },
          metadata: {
            suncity_client_id: client.id,
            suncity_user_id: user.id,
          },
        });

        accountId = account.id;

        await supabase
          .from('clients')
          .update({
            stripe_account_id: accountId,
            payment_processor: 'stripe',
            details_submitted: false,
            charges_enabled: false,
            payouts_enabled: false,
            stripe_requirements_due: null,
          })
          .eq('id', client.id);
      }

      let accountLink;
      try {
        accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
          return_url: `${baseUrl}/dashboard/settings?stripe=return`,
          type: 'account_onboarding',
        });
      } catch (linkErr) {
        // Stale/non-connected acct_ in DB — create a fresh Express account and retry once
        console.warn('Account link failed, recreating Express account:', linkErr.message);

        const email = client.notification_email || user.email || undefined;
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: email || undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: client.business_name || undefined,
            product_description: 'Orders placed through Sun City Connect AI cashier',
          },
          metadata: {
            suncity_client_id: client.id,
            suncity_user_id: user.id,
          },
        });

        accountId = account.id;
        await supabase
          .from('clients')
          .update({
            stripe_account_id: accountId,
            payment_processor: 'stripe',
            details_submitted: false,
            charges_enabled: false,
            payouts_enabled: false,
            stripe_requirements_due: null,
          })
          .eq('id', client.id);

        accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
          return_url: `${baseUrl}/dashboard/settings?stripe=return`,
          type: 'account_onboarding',
        });
      }

      return res.status(200).json({
        url: accountLink.url,
        stripe_account_id: accountId,
      });
    }

    // --- DASHBOARD: Express login link for payouts / bank details ---
    if (action === 'dashboard') {
      if (!client.stripe_account_id) {
        return res.status(400).json({ error: 'Stripe not connected yet' });
      }

      const loginLink = await stripe.accounts.createLoginLink(client.stripe_account_id);
      return res.status(200).json({ url: loginLink.url });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('stripe-connect error:', err);
    return res.status(500).json({
      error: err.message || 'Stripe Connect failed',
    });
  }
}
