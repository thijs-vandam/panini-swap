// netlify/functions/manage-listing.js
const { createClient } = require('@supabase/supabase-js');

async function manageListing({ supabase, body }) {
  const { token, action, display_name, neighborhood, doubles, missing } = body;
  if (!token || !action) return { statusCode: 400, body: JSON.stringify({ error: 'Missing token or action' }) };

  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('edit_token', token)
    .eq('active', true)
    .maybeSingle();

  if (!listing) return { statusCode: 404, body: JSON.stringify({ error: 'Listing not found or expired' }) };

  if (action === 'delete') {
    await supabase.from('listings').update({ active: false }).eq('id', listing.id);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (action === 'renew') {
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('listings').update({ expires_at, last_active: new Date().toISOString() }).eq('id', listing.id);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  if (action === 'update') {
    const updates = {};
    if (display_name) updates.display_name = display_name;
    if (neighborhood) updates.neighborhood = neighborhood;
    if (doubles) updates.doubles = doubles;
    if (missing) updates.missing = missing;
    updates.last_active = new Date().toISOString();
    await supabase.from('listings').update(updates).eq('id', listing.id);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  try {
    return await manageListing({ supabase, body: JSON.parse(event.body) });
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
exports._manageListing = manageListing;
