// netlify/functions/resend-link.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

async function resendLink({ supabase, resend, body }) {
  const { parent_email } = body;
  if (!parent_email) return { statusCode: 400, body: JSON.stringify({ error: 'Missing email' }) };

  const { data } = await supabase
    .from('listings')
    .select('display_name, edit_token')
    .eq('parent_email', parent_email)
    .eq('active', true)
    .maybeSingle();

  // Silent success regardless — prevent email enumeration
  if (data) {
    const magicUrl = `${process.env.SITE_URL}/gerir.html?token=${data.edit_token}`;
    await resend.emails.send({
      from: 'Troca Cromos Oeiras <noreply@resend.dev>',
      to: parent_email,
      subject: 'O teu link para gerir os cromos — Troca Cromos Oeiras',
      text: `Olá!\n\nAqui está o link para gerir a lista de ${data.display_name}:\n${magicUrl}\n\nTroca Cromos Oeiras`,
    });
  }
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    return await resendLink({ supabase, resend, body: JSON.parse(event.body) });
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
exports._resendLink = resendLink;
