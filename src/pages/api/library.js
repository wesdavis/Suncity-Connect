const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Fetch all campaigns, newest first
    const { data, error } = await supabase
      .from('saved_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, campaigns: data });
  } catch (error) {
    console.error("❌ Library Fetch Error:", error);
    return res.status(500).json({ error: error.message });
  }
};