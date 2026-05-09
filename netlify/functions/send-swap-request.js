// netlify/functions/send-swap-request.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

async function sendSwapRequest({ supabase, resend, body }) {
  const { listing_id, requester_name, requester_email, requester_neighborhood, i_give, they_give } = body;
  if (!listing_id || !requester_name || !requester_email || !Array.isArray(i_give) || !Array.isArray(they_give)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
  }
  if (i_give.length === 0 || they_give.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No stickers to swap' }) };
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('display_name, neighborhood, parent_email')
    .eq('id', listing_id)
    .eq('active', true)
    .maybeSingle();

  if (!listing) return { statusCode: 404, body: JSON.stringify({ error: 'Listing not found' }) };

  const body_text = [
    `Pedido de troca de cromos / Sticker swap request`,
    ``,
    `${requester_name} (${requester_neighborhood}) quer trocar com ${listing.display_name} (${listing.neighborhood}).`,
    ``,
    `${requester_name} dá / gives: ${i_give.join(', ')}`,
    `${listing.display_name} dá / gives: ${they_give.join(', ')}`,
    ``,
    `⚡ 1 cromo = 1 cromo — sem dinheiro / no money`,
    ``,
    `Para combinar, respondam a este email / To arrange, reply to this email.`,
    ``,
    `Troca Cromos Oeiras — trocacromos.netlify.app`,
  ].join('\n');

  await resend.emails.send({
    from: 'Troca Cromos Oeiras <noreply@resend.dev>',
    to: [requester_email, listing.parent_email],
    subject: `Pedido de troca de cromos — ${requester_name} ↔ ${listing.display_name}`,
    text: body_text,
  });

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    return await sendSwapRequest({ supabase, resend, body: JSON.parse(event.body) });
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
exports._sendSwapRequest = sendSwapRequest;
