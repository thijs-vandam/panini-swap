// tests/matchmaking.test.js
const { computeMatches } = require('../js/matchmaking');

test('returns empty array when no listings', () => {
  expect(computeMatches(['MEX-1'], ['MEX-2'], [])).toEqual([]);
});

test('returns empty when no mutual match', () => {
  const listing = { id: '1', display_name: 'João', neighborhood: 'Algés',
    doubles: ['POR-1'], missing: ['POR-2'] };
  expect(computeMatches(['MEX-1'], ['MEX-2'], [listing])).toHaveLength(0);
});

test('returns match when mutual swap exists', () => {
  const listing = { id: '1', display_name: 'João', neighborhood: 'Algés',
    doubles: ['MEX-2'], missing: ['MEX-1'] };
  const result = computeMatches(['MEX-1'], ['MEX-2'], [listing]);
  expect(result).toHaveLength(1);
  expect(result[0].score).toBe(1);
  expect(result[0].iGive).toEqual(['MEX-1']);
  expect(result[0].theyGive).toEqual(['MEX-2']);
});

test('score is min of what each side can give', () => {
  const listing = { id: '1', display_name: 'João', neighborhood: 'Algés',
    doubles: ['MEX-2', 'MEX-3'], missing: ['MEX-1'] };
  // I have 1 they need, they have 2 I need → score = min(1,2) = 1
  const result = computeMatches(['MEX-1'], ['MEX-2', 'MEX-3'], [listing]);
  expect(result[0].score).toBe(1);
  expect(result[0].iGive).toHaveLength(1);
  expect(result[0].theyGive).toHaveLength(1);
});

test('returns top 3 matches sorted by score desc', () => {
  const listings = [
    { id: '1', display_name: 'A', neighborhood: 'Algés',
      doubles: ['MEX-2'], missing: ['MEX-1'] },
    { id: '2', display_name: 'B', neighborhood: 'Algés',
      doubles: ['MEX-2', 'MEX-3'], missing: ['MEX-1', 'MEX-4'] },
    { id: '3', display_name: 'C', neighborhood: 'Algés',
      doubles: ['MEX-2', 'MEX-3', 'MEX-5'], missing: ['MEX-1', 'MEX-4', 'MEX-6'] },
    { id: '4', display_name: 'D', neighborhood: 'Algés',
      doubles: ['POR-1'], missing: ['POR-2'] },
  ];
  const result = computeMatches(['MEX-1', 'MEX-4', 'MEX-6'], ['MEX-2', 'MEX-3', 'MEX-5'], listings);
  expect(result).toHaveLength(3);
  expect(result[0].listing.display_name).toBe('C');
  expect(result[0].score).toBe(3);
  expect(result[1].score).toBe(2);
  expect(result[2].score).toBe(1);
});

test('ignores listings with score 0', () => {
  const listings = [
    { id: '1', display_name: 'A', neighborhood: 'Algés', doubles: ['POR-1'], missing: ['POR-2'] },
    { id: '2', display_name: 'B', neighborhood: 'Algés', doubles: ['MEX-2'], missing: ['MEX-1'] },
  ];
  const result = computeMatches(['MEX-1'], ['MEX-2'], listings);
  expect(result).toHaveLength(1);
  expect(result[0].listing.display_name).toBe('B');
});
