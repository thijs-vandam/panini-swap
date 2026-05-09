// scripts/maintenance.js
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date();

  // Keep-alive ping
  await supabase.from('listings').select('id', { head: true, count: 'exact' });
  console.log('Keep-alive ping done.');

  // Expire old listings
  await supabase.from('listings')
    .update({ active: false })
    .eq('active', true)
    .lt('expires_at', now.toISOString());
  console.log('Expiry sweep done.');

  // Renewal reminders: listings expiring in 3–4 days
  const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const in4 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();
  const { data: expiring } = await supabase.from('listings')
    .select('display_name, parent_email, edit_token')
    .eq('active', true)
    .gte('expires_at', in3)
    .lte('expires_at', in4);

  for (const l of (expiring || [])) {
    const url = `${process.env.SITE_URL}/gerir.html?token=${l.edit_token}`;
    await resend.emails.send({
      from: 'Troca Cromos Oeiras <noreply@resend.dev>',
      to: l.parent_email,
      subject: `A lista de cromos de ${l.display_name} expira em 3 dias`,
      text: `Olá!\n\nA lista de ${l.display_name} expira em 3 dias.\n\nRenova aqui:\n${url}\n\nTroca Cromos Oeiras`,
    });
    console.log(`Reminder sent: ${l.parent_email}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
