// cv.js - renders Education and Previous Positions from data files and responds to language changes
(function(){
  const eduPath = 'data/education.json';
  const posPath = 'data/positions.json';

  function $(s,root=document){return root.querySelector(s)}
  function $all(s,root=document){return Array.from(root.querySelectorAll(s))}

  async function fetchJson(path){
    try{ const r = await fetch(path); return await r.json(); }catch(e){ console.warn('cv: failed to load', path, e); return []; }
  }

  function renderEducation(arr){
    const container = $('#education-container');
    if(!container) return;
    container.innerHTML = '';
    arr.forEach(item => {
      const art = document.createElement('article');
      art.className = 'edu-item';
      const img = document.createElement('img');
      img.src = item.image || '';
      img.alt = I18n.t(item.degree_key);
      img.className = 'edu-logo';
      const right = document.createElement('div');
      right.className = 'edu-right';
      const h = document.createElement('h3');
      h.textContent = I18n.t(item.degree_key);
      const meta = document.createElement('div');
      meta.className = 'edu-meta';
      meta.innerHTML = `<span>${I18n.t(item.institution_key)}</span><span class="sep">•</span><span>${I18n.t(item.years_key)}</span>`;
      const p = document.createElement('p');
      p.textContent = I18n.t(item.desc_key);
      // render skills/technologies if present
      let skillsEl = null;
      if(Array.isArray(item.skills) && item.skills.length){
        skillsEl = document.createElement('ul');
        skillsEl.className = 'edu-skills skills';
        item.skills.forEach(s => {
          const li = document.createElement('li');
          // allow either plain string or translation-key object { key: 'skill_key' }
          if(typeof s === 'string') li.textContent = s;
          else if(s && typeof s === 'object' && s.key) li.textContent = I18n.t(s.key);
          skillsEl.appendChild(li);
        });
      }
      right.appendChild(h);
      right.appendChild(meta);
      right.appendChild(p);
      if(skillsEl) right.appendChild(skillsEl);
      art.appendChild(img);
      art.appendChild(right);
      container.appendChild(art);
    });
  }

  function renderPositions(arr){
    const container = $('#positions-container');
    if(!container) return;
    container.innerHTML = '';
    arr.forEach(item => {
      const art = document.createElement('article');
      art.className = 'pos-item';
      const img = document.createElement('img');
      img.src = item.image || '';
      img.alt = I18n.t(item.title_key);
      img.className = 'pos-logo';
      const right = document.createElement('div');
      right.className = 'pos-right';
      const h = document.createElement('h3');
      h.textContent = I18n.t(item.title_key);
      const meta = document.createElement('div');
      meta.className = 'pos-meta';
      meta.innerHTML = `<span>${I18n.t(item.company_key)}</span><span class="sep">•</span><span>${I18n.t(item.years_key)}</span>`;
      const p = document.createElement('p');
      p.textContent = I18n.t(item.desc_key);
      right.appendChild(h);
      right.appendChild(meta);
      right.appendChild(p);
      art.appendChild(img);
      art.appendChild(right);
      container.appendChild(art);
    });
  }

  async function init(){
    if(window.I18n && typeof window.I18n.init === 'function') await window.I18n.init();
    const edu = await fetchJson(eduPath);
    const pos = await fetchJson(posPath);
    renderEducation(edu);
    renderPositions(pos);
    // re-render on language change
    window.addEventListener('i18n:changed', ()=>{
      renderEducation(edu);
      renderPositions(pos);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
