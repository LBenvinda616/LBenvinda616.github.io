// Simple i18n: loads en.json or pt.json and replaces elements with data-i18n attributes
async function loadLang(lang) {
  const res = await fetch(`lang/${lang}.json`);
  const dict = await res.json();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
}

// Save preference and redirect to proper file if necessary
function setLang(lang){
  localStorage.setItem('lang', lang);
  // if user is on index-pt.html and selects en, redirect
  const current = window.location.pathname.split('/').pop();
  if (lang === 'pt' && current !== 'index-pt.html') {
    window.location.href = 'index-pt.html';
    return;
  } else if (lang === 'en' && current !== 'index.html') {
    window.location.href = 'index.html';
    return;
  }
}

// on load: detect saved lang or default to en
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lang') || 'en';
  if (saved === 'pt' && window.location.pathname.split('/').pop() !== 'index-pt.html') {
    window.location.href = 'index-pt.html';
    return;
  }
  const fileLang = window.location.pathname.split('/').pop() === 'index-pt.html' ? 'pt' : 'en';
  loadLang(fileLang);
});
