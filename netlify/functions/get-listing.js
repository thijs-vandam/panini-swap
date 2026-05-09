// netlify/functions/get-listing.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
  const token = event.queryStringParameters?.token;
  if (!token) return { statusCode: 400, body: JSON.stringify({ error: 'Missing token' }) };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data } = await supabase
    .from('listings')
    .select('id, display_name, neighborhood, doubles, missing, expires_at')
    .eq('edit_token', token)
    .eq('active', true)
    .maybeSingle();
  if (!data) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
  return { statusCode: 200, body: JSON.stringify(data) };
};
