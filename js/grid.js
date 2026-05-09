// js/grid.js
// Renders the card selection grid and manages doubles/missing state.
// Usage:
//   const grid = new CardGrid(containerEl, cardsData);
//   grid.getDoubles() → string[]   e.g. ["MEX-1", "POR-7"]
//   grid.getMissing() → string[]
//   grid.loadState({ doubles, missing }) → restores saved state

class CardGrid {
  constructor(container, cardsData) {
    this.container = container;
    this.cardsData = cardsData;  // window.CARDS
    this.doubles = new Set();
    this.missing = new Set();
    this.mode = 'doubles'; // 'doubles' | 'missing'
    this._render();
  }

  _render() {
    this.container.innerHTML = '';

    // Mode toggle
    const modeBar = document.createElement('div');
    modeBar.className = 'grid-mode-bar';
    modeBar.innerHTML = `
      <button class="mode-btn active" data-mode="doubles">${t('gridModeDoubles')}</button>
      <button class="mode-btn" data-mode="missing">${t('gridModeMissing')}</button>
    `;
    modeBar.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.mode;
        modeBar.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    this.container.appendChild(modeBar);

    // Special sections (FWC, CCL)
    const specialSection = document.createElement('div');
    specialSection.className = 'grid-section';
    this.cardsData.special.forEach(special => {
      const lang = window.getCurrentLang ? window.getCurrentLang() : 'pt';
      const label = document.createElement('h3');
      label.textContent = special[`name_${lang}`] || special.name_pt;
      specialSection.appendChild(label);
      specialSection.appendChild(this._renderTeamGrid(special.id, special.count));
    });
    this.container.appendChild(specialSection);

    // Group/team selector
    const groupSelect = document.createElement('select');
    groupSelect.id = 'group-select';
    groupSelect.innerHTML = `<option value="">${t('selectGroup')}</option>` +
      this.cardsData.groups.map(g => `<option value="${g.id}">${t('selectGroup')} ${g.id}</option>`).join('');

    const teamSelect = document.createElement('select');
    teamSelect.id = 'team-select';
    teamSelect.innerHTML = `<option value="">${t('selectTeam')}</option>`;
    teamSelect.style.display = 'none';

    const teamGridContainer = document.createElement('div');
    teamGridContainer.id = 'team-grid-container';

    groupSelect.addEventListener('change', () => {
      const group = this.cardsData.groups.find(g => g.id === groupSelect.value);
      if (!group) { teamSelect.style.display = 'none'; teamGridContainer.innerHTML = ''; return; }
      teamSelect.style.display = '';
      teamSelect.innerHTML = `<option value="">${t('selectTeam')}</option>` +
        group.teams.map(tm => `<option value="${tm.code}">${tm.flag} ${tm.name}</option>`).join('');
      teamGridContainer.innerHTML = '';
    });

    teamSelect.addEventListener('change', () => {
      const group = this.cardsData.groups.find(g => g.id === groupSelect.value);
      if (!group) return;
      const team = group.teams.find(tm => tm.code === teamSelect.value);
      if (!team) { teamGridContainer.innerHTML = ''; return; }
      teamGridContainer.innerHTML = '';
      const h3 = document.createElement('h3');
      h3.textContent = `${team.flag} ${team.name}`;
      teamGridContainer.appendChild(h3);
      teamGridContainer.appendChild(this._renderTeamGrid(team.code, team.count));
    });

    this.container.appendChild(groupSelect);
    this.container.appendChild(teamSelect);
    this.container.appendChild(teamGridContainer);
  }

  _renderTeamGrid(code, count) {
    const grid = document.createElement('div');
    grid.className = 'sticker-grid';
    for (let i = 1; i <= count; i++) {
      const id = `${code}-${i}`;
      const btn = document.createElement('button');
      btn.className = 'sticker-btn';
      btn.textContent = i;
      btn.dataset.id = id;
      this._updateBtnStyle(btn, id);
      btn.addEventListener('click', () => this._toggle(btn, id));
      grid.appendChild(btn);
    }
    return grid;
  }

  _toggle(btn, id) {
    if (this.mode === 'doubles') {
      this.missing.delete(id);
      this.doubles.has(id) ? this.doubles.delete(id) : this.doubles.add(id);
    } else {
      this.doubles.delete(id);
      this.missing.has(id) ? this.missing.delete(id) : this.missing.add(id);
    }
    this._updateBtnStyle(btn, id);
    // Update other visible instances of this sticker (special sections may overlap)
    this.container.querySelectorAll(`[data-id="${id}"]`).forEach(b => this._updateBtnStyle(b, id));
  }

  _updateBtnStyle(btn, id) {
    btn.classList.remove('is-double', 'is-missing');
    if (this.doubles.has(id)) btn.classList.add('is-double');
    else if (this.missing.has(id)) btn.classList.add('is-missing');
  }

  getDoubles() { return [...this.doubles]; }
  getMissing() { return [...this.missing]; }

  loadState({ doubles = [], missing = [] }) {
    this.doubles = new Set(doubles);
    this.missing = new Set(missing);
    this.container.querySelectorAll('[data-id]').forEach(btn => {
      this._updateBtnStyle(btn, btn.dataset.id);
    });
  }
}

if (typeof module !== 'undefined') module.exports = { CardGrid };
else window.CardGrid = CardGrid;
