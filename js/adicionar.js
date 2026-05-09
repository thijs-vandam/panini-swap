// js/adicionar.js
async function init() {
  const cards = await fetch('cards.json').then(r => r.json());
  window.CARDS = cards;

  // Populate neighborhood dropdown
  const select = document.getElementById('neighborhood');
  t('hoods').forEach(h => {
    const opt = document.createElement('option');
    opt.value = h; opt.textContent = h;
    select.appendChild(opt);
  });

  const grid = new CardGrid(document.getElementById('grid-container'), cards);

  document.getElementById('submit-btn').addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const neighborhood = document.getElementById('neighborhood').value;
    const email = document.getElementById('email').value.trim();
    const agree = document.getElementById('agree').checked;
    const msgEl = document.getElementById('form-msg');

    if (!name || !neighborhood || !email) {
      msgEl.className = 'msg msg-error'; msgEl.textContent = '⚠ Preenche todos os campos.'; return;
    }
    if (!agree) {
      msgEl.className = 'msg msg-error'; msgEl.textContent = '⚠ Tens de aceitar as condições.'; return;
    }
    if (grid.getDoubles().length === 0 && grid.getMissing().length === 0) {
      msgEl.className = 'msg msg-error'; msgEl.textContent = '⚠ Selecciona pelo menos um cromo.'; return;
    }
    msgEl.textContent = '';
    document.getElementById('submit-btn').disabled = true;

    try {
      const res = await fetch('/.netlify/functions/submit-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name, neighborhood, parent_email: email,
          doubles: grid.getDoubles(), missing: grid.getMissing() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      document.getElementById('form-area').style.display = 'none';
      const ok = document.getElementById('success-msg');
      ok.style.display = '';
      ok.textContent = t('submitOk');
    } catch (e) {
      msgEl.className = 'msg msg-error'; msgEl.textContent = `Erro: ${e.message}`;
      document.getElementById('submit-btn').disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
