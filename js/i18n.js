// js/i18n.js
// Reads window.T, applies translations to all [data-i18n] elements.
// Usage: add data-i18n="keyName" to any HTML element.
// For dynamic strings (functions in T), call t('key', arg1, arg2).

(function () {
  const STORAGE_KEY = 'lang';

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) ||
      (navigator.language.startsWith('pt') ? 'pt' : 'en');
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations(lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langBtn === lang);
    });
  }

  function applyTranslations(lang) {
    const strings = window.T[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (typeof strings[key] === 'string') el.textContent = strings[key];
    });
  }

  // t('key') or t('key', arg1) for function-based strings
  window.t = function (key, ...args) {
    const lang = getLang();
    const val = window.T[lang][key];
    return typeof val === 'function' ? val(...args) : (val || key);
  };

  window.getCurrentLang = getLang;

  document.addEventListener('DOMContentLoaded', () => {
    setLang(getLang());
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.langBtn));
    });
  });
})();
