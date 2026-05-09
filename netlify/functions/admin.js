// netlify/functions/admin.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
  const secret = event.queryStringParameters?.key || JSON.parse(event.body || '{}').key;
  if (secret !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const action = event.queryStringParameters?.action || JSON.parse(event.body || '{}').action;

  if (event.httpMethod === 'GET' || action === 'list') {
    const { data: listings } = await supabase.from('listings')
      .select('id, display_name, neighborhood, created_at, expires_at, active')
      .order('created_at', { ascending: false });
    const { data: reports } = await supabase.from('reports')
      .select('id, listing_id, reason, created_at, resolved')
      .eq('resolved', false);
    return { statusCode: 200, body: JSON.stringify({ listings, reports }) };
  }

  if (action === 'delete') {
    const { listing_id } = JSON.parse(event.body);
    await supabase.from('listings').update({ active: false }).eq('id', listing_id);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (action === 'resolve') {
    const { report_id } = JSON.parse(event.body);
    await supabase.from('reports').update({ resolved: true }).eq('id', report_id);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };
};
