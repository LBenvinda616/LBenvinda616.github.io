// Enhanced client-side i18n for a single-page site
const I18n = (function () {
  let dict = {};
  let fallback = {};
  let current = 'en';

  async function fetchJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (e) {
      console.warn('i18n fetch failed:', path, e);
      return {};
    }
  }

  async function load(lang) {
    current = lang;
    // relative paths (good for GH Pages project pages)
    dict = await fetchJson(`lang/${lang}.json`);
  }

  async function loadFallback(lang = 'en') {
    fallback = await fetchJson(`lang/${lang}.json`);
  }

  function t(key, vars) {
    let s = dict[key] ?? fallback[key] ?? null;
    if (s == null) {
      console.warn('Missing i18n key:', key);
      return key; // visible fallback so you can find missing keys
    }
    if (vars) {
      Object.keys(vars).forEach(k => {
        s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
      });
    }
    return s;
  }

  function apply(node) {
    if (!node || !node.getAttribute) return;
    // text replacement
    if (node.hasAttribute('data-i18n')) {
      const key = node.getAttribute('data-i18n');
      node.textContent = t(key);
    }
    // single-attr keys: data-i18n-title="key"
    Array.from(node.attributes).forEach(attr => {
      if (!attr.name.startsWith('data-i18n-') || attr.name === 'data-i18n') return;
      const attrName = attr.name.replace('data-i18n-', '');
      const key = attr.value;
      node.setAttribute(attrName, t(key));
    });
    // flexible mapping: data-i18n-attr="placeholder:search_placeholder,alt:hero_image_alt"
    if (node.hasAttribute('data-i18n-attr')) {
      const map = node.getAttribute('data-i18n-attr').split(',');
      map.forEach(pair => {
        const [attrName, key] = pair.split(':').map(s => s && s.trim());
        if (attrName && key) node.setAttribute(attrName, t(key));
      });
    }
  }

  function translatePage() {
    document.querySelectorAll('[data-i18n], [data-i18n-attr], [data-i18n-title], [data-i18n-placeholder], [data-i18n-alt]').forEach(apply);
    document.documentElement.lang = current;
    // update language button states if present
    const btnEn = document.getElementById('btn-en');
    const btnPt = document.getElementById('btn-pt');
    if (btnEn) btnEn.classList.toggle('active', current === 'en');
    if (btnPt) btnPt.classList.toggle('active', current === 'pt');
  }

  async function setLang(lang) {
    localStorage.setItem('lang', lang);
    await load(lang);
    await loadFallback('en');
    translatePage();
    // notify other modules that language changed so they can re-render if needed
    try { window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } })); } catch(e) { /* ignore */ }
  }

  async function init() {
    await loadFallback('en');
    const saved = localStorage.getItem('lang');
    const browser = navigator.language && navigator.language.startsWith('pt') ? 'pt' : 'en';
    const start = saved || browser || 'en';
    await load(start);
    translatePage();
    // initial ready event
    try { window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: start } })); } catch(e) {}
  }

  return { init, setLang, t, current: () => current };
})();

// expose a global setLang to keep existing inline onclick working
window.setLang = I18n.setLang;
window.I18n = I18n;

document.addEventListener('DOMContentLoaded', () => { I18n.init(); });
