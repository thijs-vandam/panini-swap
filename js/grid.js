// js/grid.js
// Card grid component with sidebar team navigation and live counter.
// Usage:
//   const grid = new CardGrid(containerEl, cardsData);
//   grid.getDoubles() → string[]
//   grid.getMissing() → string[]
//   grid.loadState({ doubles, missing }) → restores saved state

class CardGrid {
  constructor(container, cardsData) {
    this.container = container;
    this.cardsData = cardsData;
    this.doubles = new Set();
    this.missing = new Set();
    this.mode = 'doubles';
    this.activeSection = null;
    this._render();
  }

  _render() {
    this.container.innerHTML = '';
    this.container.className = 'grid-layout';

    // ── Sidebar ──────────────────────────────────────────────
    const sidebar = document.createElement('div');
    sidebar.className = 'grid-sidebar';

    // Special sections
    const specialLabel = document.createElement('div');
    specialLabel.className = 'sidebar-group-label';
    specialLabel.textContent = 'Special';
    sidebar.appendChild(specialLabel);

    this.cardsData.special.forEach(s => {
      sidebar.appendChild(this._makeSidebarBtn(s.id, s.id));
    });

    // Groups + teams
    this.cardsData.groups.forEach(group => {
      const label = document.createElement('div');
      label.className = 'sidebar-group-label';
      label.textContent = `Grupo ${group.id}`;
      sidebar.appendChild(label);
      group.teams.forEach(team => {
        sidebar.appendChild(this._makeSidebarBtn(team.code, `${team.flag} ${team.code}`));
      });
    });

    // ── Main area ─────────────────────────────────────────────
    const main = document.createElement('div');
    main.className = 'grid-main';

    // Counter — always visible
    const counter = document.createElement('div');
    counter.className = 'grid-counter';
    counter.innerHTML = `
      <span class="cnt-doubles">🟢 <strong id="cnt-d">0</strong> a dobrar</span>
      <span class="cnt-sep">·</span>
      <span class="cnt-missing">🟠 <strong id="cnt-m">0</strong> a precisar</span>
    `;
    main.appendChild(counter);

    // Mode toggle
    const modeBar = document.createElement('div');
    modeBar.className = 'grid-mode-bar';
    ['doubles', 'missing'].forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn' + (m === this.mode ? ' active' : '');
      btn.dataset.mode = m;
      btn.textContent = m === 'doubles' ? '🟢 Tenho a dobrar' : '🟠 Preciso';
      btn.addEventListener('click', () => {
        this.mode = m;
        modeBar.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      });
      modeBar.appendChild(btn);
    });
    main.appendChild(modeBar);

    // Team header
    const teamHeader = document.createElement('div');
    teamHeader.className = 'grid-team-header';
    main.appendChild(teamHeader);

    // Sticker grid area
    const gridArea = document.createElement('div');
    gridArea.id = 'grid-area';
    const placeholder = document.createElement('p');
    placeholder.className = 'grid-placeholder';
    placeholder.textContent = '← Seleciona uma equipa';
    gridArea.appendChild(placeholder);
    main.appendChild(gridArea);

    this.container.appendChild(sidebar);
    this.container.appendChild(main);

    this._sidebar = sidebar;
    this._gridArea = gridArea;
    this._teamHeader = teamHeader;

    // Select first by default
    const firstBtn = sidebar.querySelector('.team-sidebar-btn');
    if (firstBtn) firstBtn.click();
  }

  _makeSidebarBtn(code, label) {
    const btn = document.createElement('button');
    btn.className = 'team-sidebar-btn';
    btn.dataset.code = code;
    btn.innerHTML = `<span class="team-label">${label}</span><span class="team-count" id="tc-${code}"></span>`;
    btn.addEventListener('click', () => this._selectSection(code, btn));
    return btn;
  }

  _selectSection(code, btn) {
    this.activeSection = code;
    this._sidebar.querySelectorAll('.team-sidebar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Scroll button into view in sidebar
    btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    // Find data
    let sectionData = null;
    let headerText = code;

    const special = this.cardsData.special.find(s => s.id === code);
    if (special) {
      const lang = window.getCurrentLang ? window.getCurrentLang() : 'pt';
      headerText = special[`name_${lang}`] || special.name_pt;
      sectionData = { code: special.id, count: special.count };
    } else {
      for (const group of this.cardsData.groups) {
        const team = group.teams.find(t => t.code === code);
        if (team) {
          headerText = `${team.flag} ${team.name}`;
          sectionData = team;
          break;
        }
      }
    }

    this._teamHeader.textContent = headerText;
    this._gridArea.innerHTML = '';
    if (sectionData) {
      this._gridArea.appendChild(this._renderTeamGrid(sectionData.code, sectionData.count));
    }
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
    this._updateCounter();
    this._updateSidebarCount(id.split('-')[0]);
  }

  _updateBtnStyle(btn, id) {
    btn.classList.remove('is-double', 'is-missing');
    if (this.doubles.has(id)) btn.classList.add('is-double');
    else if (this.missing.has(id)) btn.classList.add('is-missing');
  }

  _updateCounter() {
    const d = document.getElementById('cnt-d');
    const m = document.getElementById('cnt-m');
    if (d) d.textContent = this.doubles.size;
    if (m) m.textContent = this.missing.size;
  }

  _updateSidebarCount(code) {
    const el = document.getElementById(`tc-${code}`);
    if (!el) return;
    const d = [...this.doubles].filter(id => id.startsWith(code + '-')).length;
    const m = [...this.missing].filter(id => id.startsWith(code + '-')).length;
    el.textContent = (d || m) ? `${d ? '🟢' + d : ''}${m ? ' 🟠' + m : ''}` : '';
  }

  getDoubles() { return [...this.doubles]; }
  getMissing() { return [...this.missing]; }

  loadState({ doubles = [], missing = [] }) {
    this.doubles = new Set(doubles);
    this.missing = new Set(missing);
    this._gridArea.querySelectorAll('[data-id]').forEach(btn => {
      this._updateBtnStyle(btn, btn.dataset.id);
    });
    this._updateCounter();
    const codes = new Set([...doubles, ...missing].map(id => id.split('-')[0]));
    codes.forEach(code => this._updateSidebarCount(code));
  }
}

if (typeof module !== 'undefined') module.exports = { CardGrid };
else window.CardGrid = CardGrid;
