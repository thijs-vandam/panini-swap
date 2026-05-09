// js/admin.js
async function init() {
  const key = new URLSearchParams(location.search).get('key');
  if (!key) { document.getElementById('admin-content').innerHTML = '<p>Acesso negado.</p>'; return; }

  const res = await fetch(`/.netlify/functions/admin?action=list&key=${key}`);
  if (res.status === 401) { document.getElementById('admin-content').innerHTML = '<p>Chave inválida.</p>'; return; }
  const { listings, reports } = await res.json();

  // Listings table
  const lt = document.getElementById('listings-table');
  if (!listings.length) { lt.textContent = 'Nenhuma lista.'; }
  else {
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Nome</th><th>Bairro</th><th>Criado</th><th>Expira</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    listings.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${l.display_name}</td><td>${l.neighborhood}</td>
        <td>${new Date(l.created_at).toLocaleDateString()}</td>
        <td>${new Date(l.expires_at).toLocaleDateString()}</td>
        <td><button class="btn btn-danger btn-sm" data-del="${l.id}">Apagar</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    lt.appendChild(table);
    lt.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch(`/.netlify/functions/admin?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', key, listing_id: btn.dataset.del }),
        });
        btn.closest('tr').remove();
      });
    });
  }

  // Reports table
  const rt = document.getElementById('reports-table');
  if (!reports.length) { rt.textContent = 'Sem reportes pendentes.'; }
  else {
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Listing ID</th><th>Motivo</th><th>Data</th><th></th></tr></thead>';
    const tbody = document.createElement('tbody');
    reports.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.listing_id.slice(0,8)}…</td><td>${r.reason || '—'}</td>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
        <td><button class="btn btn-sm" style="background:var(--green);color:white" data-res="${r.id}">Resolver</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    rt.appendChild(table);
    rt.querySelectorAll('[data-res]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch(`/.netlify/functions/admin?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resolve', key, report_id: btn.dataset.res }),
        });
        btn.closest('tr').remove();
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
