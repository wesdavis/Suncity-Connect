const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, businessName, customerName, customerEmail, customerPhone, appointmentTime } = req.body;

    if (!userId || !appointmentTime || !customerName) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // 1. SAVE TO CALENDAR
    const { error: apptError } = await supabase.from('appointments').insert([{
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      notes: "Booked via Storefront Widget",
      appointment_time: appointmentTime,
      service_type: 'Storefront Booking',
      status: 'confirmed'
    }]);

    if (apptError) throw apptError;

    // 2. CAPTURE AS A HOT LEAD IN THE CRM
    await supabase.from('b2b_inbox').insert([{
      user_id: userId,
      ig_username: customerName,
      incoming_message: `(Storefront Widget) Requested an appointment for ${new Date(appointmentTime).toLocaleString()}`,
      ai_reply: "Automated widget booking confirmed.",
      platform: 'Website',
      lead_source: 'Storefront Widget',
      status: 'replied',
      extracted_data: {
        intent: 'Storefront Widget Booking',
        email: customerEmail || 'Pending',
        phone: customerPhone || 'Pending',
        status: 'Hot'
      }
    }]);

    // 3. SEND CONFIRMATION EMAIL
    if (customerEmail && customerEmail.includes('@')) {
      const formattedTime = new Date(appointmentTime).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });
      
      const cleanBusinessName = businessName.replace(/['"]/g, '');
      
      await resend.emails.send({
        from: `${cleanBusinessName} <bookings@suncityconnect.com>`,
        to: customerEmail,
        subject: `Booking Confirmed: ${cleanBusinessName}`,
        text: `Hi ${customerName},\n\nYou are all set! Your appointment is confirmed for ${formattedTime}.\n\nIf you need to reschedule or have any questions, please let us know.\n\nThanks,\n${cleanBusinessName}`
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Widget Booking Error:", error);
    return res.status(500).json({ error: error.message });
  }
};