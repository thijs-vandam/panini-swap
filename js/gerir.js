// js/gerir.js
let grid, token;

async function init() {
  token = new URLSearchParams(location.search).get('token');
  if (!token) { showError(); return; }

  const cards = await fetch('cards.json').then(r => r.json());
  window.CARDS = cards;

  let listing;
  try {
    const res = await fetch(`/.netlify/functions/get-listing?token=${token}`);
    if (!res.ok) { showError(); return; }
    listing = await res.json();
  } catch { showError(); return; }

  document.getElementById('loading').style.display = 'none';
  document.getElementById('listing-area').style.display = '';

  // Populate hood dropdown
  const select = document.getElementById('neighborhood');
  t('hoods').forEach(h => {
    const opt = document.createElement('option');
    opt.value = h; opt.textContent = h;
    if (h === listing.neighborhood) opt.selected = true;
    select.appendChild(opt);
  });

  document.getElementById('name').value = listing.display_name;
  document.getElementById('expires-label').textContent =
    t('expires', new Date(listing.expires_at).toLocaleDateString());

  grid = new CardGrid(document.getElementById('grid-container'), cards);
  grid.loadState({ doubles: listing.doubles, missing: listing.missing });

  document.getElementById('save-btn').addEventListener('click', () => call('update', {
    display_name: document.getElementById('name').value.trim(),
    neighborhood: document.getElementById('neighborhood').value,
    doubles: grid.getDoubles(), missing: grid.getMissing(),
  }, t('saveOk')));

  document.getElementById('renew-btn').addEventListener('click', () => call('renew', {}, t('renewOk')));

  document.getElementById('delete-btn').addEventListener('click', async () => {
    if (!confirm(t('deleteConfirm'))) return;
    await call('delete', {}, t('deleteOk'));
    setTimeout(() => { location.href = 'index.html'; }, 1500);
  });
}

async function call(action, extra, successMsg) {
  const msgEl = document.getElementById('gerir-msg');
  try {
    const res = await fetch('/.netlify/functions/manage-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action, ...extra }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    msgEl.className = 'msg msg-success'; msgEl.textContent = successMsg;
  } catch (e) {
    msgEl.className = 'msg msg-error'; msgEl.textContent = `Erro: ${e.message}`;
  }
}

function showError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error-area').style.display = '';
}

document.addEventListener('DOMContentLoaded', init);
