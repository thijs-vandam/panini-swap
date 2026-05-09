// js/matchmaking.js
function computeMatches(myDoubles, myMissing, listings) {
  return listings
    .map(listing => {
      const iCanGive = myDoubles.filter(s => listing.missing.includes(s));
      const theyCanGive = listing.doubles.filter(s => myMissing.includes(s));
      const score = Math.min(iCanGive.length, theyCanGive.length);
      return {
        listing,
        score,
        iGive: iCanGive.slice(0, score),
        theyGive: theyCanGive.slice(0, score),
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// Supports both browser (window) and Node.js (Jest)
if (typeof module !== 'undefined') module.exports = { computeMatches };
else window.computeMatches = computeMatches;
