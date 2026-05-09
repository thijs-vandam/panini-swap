// tests/functions/manage-listing.test.js
const { _manageListing } = require('../../netlify/functions/manage-listing');

const mockSupabase = (found = true) => ({
  from: () => ({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: found ? { id: 'abc' } : null }) }) }) }),
    update: () => ({ eq: async () => ({ error: null }) }),
  }),
});

test('returns 400 when token missing', async () => {
  const res = await _manageListing({ supabase: mockSupabase(), body: { action: 'delete' } });
  expect(res.statusCode).toBe(400);
});

test('returns 404 when token not found', async () => {
  const res = await _manageListing({ supabase: mockSupabase(false), body: { token: 'x', action: 'delete' } });
  expect(res.statusCode).toBe(404);
});

test('delete action returns 200', async () => {
  const res = await _manageListing({ supabase: mockSupabase(), body: { token: 'x', action: 'delete' } });
  expect(res.statusCode).toBe(200);
});

test('renew action returns 200', async () => {
  const res = await _manageListing({ supabase: mockSupabase(), body: { token: 'x', action: 'renew' } });
  expect(res.statusCode).toBe(200);
});

test('update action returns 200', async () => {
  const res = await _manageListing({ supabase: mockSupabase(), body: { token: 'x', action: 'update', display_name: 'Ana', doubles: ['MEX-1'], missing: [] } });
  expect(res.statusCode).toBe(200);
});
