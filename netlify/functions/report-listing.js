// netlify/functions/report-listing.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const { listing_id, reason } = JSON.parse(event.body);
  if (!listing_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing listing_id' }) };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  await supabase.from('reports').insert({ listing_id, reason: reason || '' });
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
