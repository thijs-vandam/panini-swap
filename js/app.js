// js/app.js
let grid, pendingMatch = null;

async function init() {
  const cards = await fetch('cards.json').then(r => r.json());
  window.CARDS = cards;

  // Live counter
  const count = await window.api.getCount();
  document.getElementById('counter').textContent = t('counter', count);

  // Card grid
  grid = new CardGrid(document.getElementById('grid-container'), cards);

  // Find matches button
  document.getElementById('find-btn').addEventListener('click', findMatches);

  // Resend link
  document.getElementById('resend-btn').addEventListener('click', async () => {
    const email = document.getElementById('resend-email').value.trim();
    const msgEl = document.getElementById('resend-msg');
    if (!email) return;
    try {
      await window.api.callFunction('resend-link', { parent_email: email });
      msgEl.className = 'msg msg-success';
      msgEl.textContent = t('resendOk');
    } catch {
      msgEl.className = 'msg msg-error';
      msgEl.textContent = t('resendOk'); // same message — don't reveal if email exists
    }
  });

  // Modal
  document.getElementById('modal-cancel-btn').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
  });
  document.getElementById('modal-send-btn').addEventListener('click', sendSwapRequest);
}

async function findMatches() {
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = '<p style="color:var(--muted)">A procurar…</p>';
  const listings = await window.api.fetchListings();
  const matches = computeMatches(grid.getDoubles(), grid.getMissing(), listings);
  if (matches.length === 0) {
    resultsEl.innerHTML = `<p class="msg msg-error">${t('noMatches')}</p>`;
    return;
  }
  resultsEl.innerHTML = '';
  matches.forEach(m => resultsEl.appendChild(renderMatchCard(m)));
}

function renderMatchCard(m) {
  const days = Math.floor((Date.now() - new Date(m.listing.last_active)) / 86400000);
  const div = document.createElement('div');
  div.className = 'card match-card';
  div.innerHTML = `
    <div class="match-score">${t('matchScore', m.score, m.listing.display_name, m.listing.neighborhood)}</div>
    <span class="badge">${t('matchBadge')}</span>
    <div class="sticker-list"><strong>${t('matchIGive')}</strong> ${m.iGive.join(', ')}</div>
    <div class="sticker-list"><strong>${t('matchTheyGive')}</strong> ${m.theyGive.join(', ')}</div>
    <div class="last-active">${t('lastActive', days)}</div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      <button class="btn btn-primary request-btn" data-i18n="requestBtn">${t('requestBtn')}</button>
      <button class="btn btn-sm" style="background:var(--border)" data-report>${t('reportBtn')}</button>
    </div>
  `;
  div.querySelector('.request-btn').addEventListener('click', () => openModal(m));
  div.querySelector('[data-report]').addEventListener('click', async () => {
    await window.api.callFunction('report-listing', { listing_id: m.listing.id });
    div.querySelector('[data-report]').textContent = '✓';
  });
  return div;
}

function openModal(match) {
  pendingMatch = match;
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('modal-msg').textContent = '';
}

async function sendSwapRequest() {
  const name = document.getElementById('req-name').value.trim();
  const email = document.getElementById('req-email').value.trim();
  const hood = document.getElementById('req-hood').value.trim();
  const msgEl = document.getElementById('modal-msg');
  if (!name || !email || !hood) { msgEl.className = 'msg msg-error'; msgEl.textContent = '⚠ Preenche todos os campos.'; return; }
  try {
    await window.api.callFunction('send-swap-request', {
      listing_id: pendingMatch.listing.id,
      requester_name: name, requester_email: email, requester_neighborhood: hood,
      i_give: pendingMatch.iGive, they_give: pendingMatch.theyGive,
    });
    msgEl.className = 'msg msg-success';
    msgEl.textContent = '✓ Email enviado para ambos os pais!';
    setTimeout(() => { document.getElementById('modal').style.display = 'none'; }, 2000);
  } catch (e) {
    msgEl.className = 'msg msg-error';
    msgEl.textContent = `Erro: ${e.message}`;
  }
}

document.addEventListener('DOMContentLoaded', init);
