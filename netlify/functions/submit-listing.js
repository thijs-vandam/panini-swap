// netlify/functions/submit-listing.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');

async function submitListing({ supabase, resend, body }) {
  const { display_name, neighborhood, parent_email, doubles, missing } = body;
  if (!display_name || !neighborhood || !parent_email || !Array.isArray(doubles) || !Array.isArray(missing)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parent_email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  const { data: existing } = await supabase
    .from('listings')
    .select('id, edit_token')
    .eq('parent_email', parent_email)
    .eq('active', true)
    .maybeSingle();

  const edit_token = existing?.edit_token || uuidv4();
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  if (existing) {
    await supabase.from('listings').update(
      { display_name, neighborhood, doubles, missing, expires_at, last_active: now }
    ).eq('id', existing.id);
  } else {
    await supabase.from('listings').insert({
      display_name, neighborhood, parent_email, doubles, missing,
      edit_token, expires_at, last_active: now, active: true,
    });
  }

  const magicUrl = `${process.env.SITE_URL}/gerir.html?token=${edit_token}`;
  await resend.emails.send({
    from: 'Troca Cromos Oeiras <noreply@resend.dev>',
    to: parent_email,
    subject: `O link para gerir os cromos de ${display_name} — Troca Cromos Oeiras`,
    text: `Olá!\n\nA lista de ${display_name} foi guardada.\n\nGere aqui:\n${magicUrl}\n\nExpira em 30 dias. 1 cromo = 1 cromo, sem dinheiro!\n\nTroca Cromos Oeiras`,
  });

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    return await submitListing({ supabase, resend, body: JSON.parse(event.body) });
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
exports._submitListing = submitListing;
