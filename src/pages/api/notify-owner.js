/**
 * Email the business owner when something needs attention while they're offline.
 * Uses clients.notification_email, then auth user email, then ORDERS_FALLBACK_EMAIL.
 */
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resolveOwnerEmail(client) {
  if (client?.notification_email && String(client.notification_email).includes('@')) {
    return String(client.notification_email).trim().toLowerCase();
  }

  if (client?.user_id) {
    try {
      const { data, error } = await supabase.auth.admin.getUserById(client.user_id);
      if (!error && data?.user?.email) return data.user.email;
    } catch (e) {
      console.warn('notify-owner: auth email lookup failed', e.message);
    }
  }

  return process.env.ORDERS_FALLBACK_EMAIL || null;
}

/**
 * @param {object} opts
 * @param {object} opts.client - client row (needs notification_email and/or user_id, business_name)
 * @param {'escalation'|'booking'|'hot_lead'|'order'|'info'} opts.type
 * @param {string} opts.title - short headline
 * @param {string} opts.body - plain details
 * @param {object} [opts.meta] - optional key/value rows for the email
 */
async function notifyOwner({ client, type, title, body, meta = {} }) {
  try {
    const to = await resolveOwnerEmail(client);
    if (!to) {
      console.warn('notify-owner: no email for client', client?.id || client?.business_name);
      return { ok: false, reason: 'no_email' };
    }

    const business = client.business_name || 'Your business';
    const typeLabel = {
      escalation: 'Needs you',
      booking: 'New booking',
      hot_lead: 'Hot lead',
      order: 'New order',
      info: 'Update',
    }[type] || 'Update';

    const metaRows = Object.entries(meta)
      .filter(([, v]) => v != null && String(v).trim() !== '' && String(v) !== 'Pending')
      .map(
        ([k, v]) =>
          `<p style="margin:0 0 8px;font-size:14px;color:#333;"><strong>${k}:</strong> ${String(v)}</p>`
      )
      .join('');

    const subject = `🔔 ${typeLabel}: ${business}${title ? ` — ${title}` : ''}`;

    const { data, error } = await resend.emails.send({
      from: 'Sun City Connect <assistant@suncityconnect.com>',
      to,
      subject: subject.slice(0, 120),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e5e5;border-radius:12px;background:#fff;">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">${typeLabel}</p>
          <h2 style="margin:0 0 12px;color:#111;font-size:20px;">${title || typeLabel}</h2>
          <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.5;">${body || ''}</p>
          ${metaRows ? `<div style="background:#f8f8f8;padding:14px;border-radius:8px;margin:0 0 16px;">${metaRows}</div>` : ''}
          <p style="margin:0;font-size:13px;color:#888;">
            <a href="https://suncityconnect.com/dashboard" style="color:#ea580c;font-weight:bold;">Open dashboard</a>
            · ${business} · Sun City Connect
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('notify-owner Resend error:', error);
      return { ok: false, reason: error };
    }

    console.log(`🔔 Owner notified (${type}) → ${to}`, data?.id || '');
    return { ok: true, to };
  } catch (err) {
    console.error('notify-owner failed:', err.message || err);
    return { ok: false, reason: err.message };
  }
}

module.exports = { notifyOwner, resolveOwnerEmail };
