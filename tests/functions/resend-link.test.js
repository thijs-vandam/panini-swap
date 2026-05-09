// tests/functions/resend-link.test.js
const { _resendLink } = require('../../netlify/functions/resend-link');

const mockSupabase = (found = true) => ({
  from: () => ({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({
      data: found ? { display_name: 'João', edit_token: 'tok' } : null
    }) }) }) }),
  }),
});
const mockResend = { emails: { send: async () => ({}) } };

test('returns 400 when email missing', async () => {
  const res = await _resendLink({ supabase: mockSupabase(), resend: mockResend, body: {} });
  expect(res.statusCode).toBe(400);
});

test('returns 200 when listing found and sends email', async () => {
  process.env.SITE_URL = 'https://test.netlify.app';
  const res = await _resendLink({ supabase: mockSupabase(true), resend: mockResend, body: { parent_email: 'p@test.com' } });
  expect(res.statusCode).toBe(200);
});

test('returns 200 silently when listing not found (prevent enumeration)', async () => {
  const res = await _resendLink({ supabase: mockSupabase(false), resend: mockResend, body: { parent_email: 'nope@test.com' } });
  expect(res.statusCode).toBe(200);
});
