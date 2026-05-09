// tests/functions/send-swap-request.test.js
const { _sendSwapRequest } = require('../../netlify/functions/send-swap-request');

const mockSupabase = (found = true) => ({
  from: () => ({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({
      data: found ? { display_name: 'Ana', neighborhood: 'Algés', parent_email: 'ana@test.com' } : null
    }) }) }) }),
  }),
});
const mockResend = { emails: { send: async () => ({}) } };

test('returns 400 when fields missing', async () => {
  const res = await _sendSwapRequest({ supabase: mockSupabase(), resend: mockResend, body: {} });
  expect(res.statusCode).toBe(400);
});

test('returns 400 when no stickers to swap', async () => {
  const res = await _sendSwapRequest({ supabase: mockSupabase(), resend: mockResend,
    body: { listing_id: 'x', requester_name: 'João', requester_email: 'j@t.com', requester_neighborhood: 'Porto Salvo', i_give: [], they_give: [] } });
  expect(res.statusCode).toBe(400);
});

test('returns 404 when listing not found', async () => {
  const res = await _sendSwapRequest({ supabase: mockSupabase(false), resend: mockResend,
    body: { listing_id: 'x', requester_name: 'João', requester_email: 'j@t.com', requester_neighborhood: 'Porto Salvo', i_give: ['MEX-1'], they_give: ['POR-1'] } });
  expect(res.statusCode).toBe(404);
});

test('returns 200 and sends email to both parents', async () => {
  const sentTo = [];
  const resend = { emails: { send: async (msg) => { sentTo.push(msg.to); } } };
  const res = await _sendSwapRequest({ supabase: mockSupabase(true), resend,
    body: { listing_id: 'x', requester_name: 'João', requester_email: 'j@t.com', requester_neighborhood: 'Porto Salvo', i_give: ['MEX-1'], they_give: ['POR-1'] } });
  expect(res.statusCode).toBe(200);
  expect(sentTo[0]).toContain('j@t.com');
  expect(sentTo[0]).toContain('ana@test.com');
});
