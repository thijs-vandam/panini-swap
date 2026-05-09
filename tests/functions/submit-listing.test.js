// tests/functions/submit-listing.test.js
const { _submitListing } = require('../../netlify/functions/submit-listing');

const mockSupabase = (existing = null) => ({
  from: () => ({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing }) }) }) }),
    insert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) }),
  }),
});
const mockResend = { emails: { send: async () => ({}) } };

test('returns 400 when fields missing', async () => {
  const res = await _submitListing({ supabase: mockSupabase(), resend: mockResend, body: {} });
  expect(res.statusCode).toBe(400);
});

test('returns 400 for invalid email', async () => {
  const res = await _submitListing({ supabase: mockSupabase(), resend: mockResend,
    body: { display_name: 'João', neighborhood: 'Algés', parent_email: 'notanemail', doubles: [], missing: [] } });
  expect(res.statusCode).toBe(400);
});

test('creates new listing and returns 200', async () => {
  process.env.SITE_URL = 'https://test.netlify.app';
  const res = await _submitListing({ supabase: mockSupabase(null), resend: mockResend,
    body: { display_name: 'João', neighborhood: 'Algés', parent_email: 'p@test.com', doubles: ['MEX-1'], missing: ['POR-1'] } });
  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body).success).toBe(true);
});

test('updates existing listing when email already registered', async () => {
  process.env.SITE_URL = 'https://test.netlify.app';
  const existing = { id: 'abc', edit_token: 'tok-123' };
  const res = await _submitListing({ supabase: mockSupabase(existing), resend: mockResend,
    body: { display_name: 'João', neighborhood: 'Algés', parent_email: 'p@test.com', doubles: [], missing: [] } });
  expect(res.statusCode).toBe(200);
});
