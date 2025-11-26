// projects.js - opens a modal with project details and images
(function(){
  const dataPath = 'data/projects.json';
  let projects = {};
  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#0f1724"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dy="7">Image placeholder</text></svg>'
  );

  let projectsArray = [];
  async function fetchProjects(){
    try{
      const arr = await (await fetch(dataPath)).json();
      projectsArray = arr;
      projects = arr.reduce((map,p)=>{map[p.id]=p;return map},{})
      return arr;
    }catch(e){
      console.warn('could not load projects.json', e);
      projects = {};
      projectsArray = [];
      return [];
    }
  }

  function $(s,root=document){return root.querySelector(s)}
  function $all(s,root=document){return Array.from(root.querySelectorAll(s))}

  function openModal(id){
    const p = projects[id];
    if(!p) return;
    const modal = $('#project-modal');
    modal.setAttribute('aria-hidden','false');
    modal.classList.add('open');
    // set title/summary/details using I18n
    const title = I18n.t(p.title_key);
    const summary = I18n.t(p.summary_key);
    const details = I18n.t(p.details_key);
    $('#pm-title').textContent = title;
    $('#pm-summary').textContent = summary;
    // details may contain line breaks; escape or set as text for now
    $('#pm-details').textContent = details;

    // images
    const main = $('#pm-main-image');
    const thumbs = $('#pm-thumbs');
    thumbs.innerHTML = '';
    const imgs = p.images && p.images.length ? p.images : [];
    const first = imgs[0] || null;
    main.src = first || placeholder;
    main.alt = title;
    imgs.forEach((src, idx)=>{
      const t = document.createElement('img');
      t.className = 'pm-thumb';
      t.src = src;
      t.alt = title + ' ' + (idx+1);
      t.loading = 'lazy';
      t.addEventListener('click', ()=> main.src = src);
      thumbs.appendChild(t);
    });

    // update hash for shareability
    history.replaceState(null, '', '#project/'+id);
  }

  function closeModal(){
    const modal = $('#project-modal');
    modal.setAttribute('aria-hidden','true');
    modal.classList.remove('open');
    // remove hash
    if(location.hash.startsWith('#project/')) history.replaceState(null,'',location.pathname+location.search);
  }

  function renderProjects(arr){
    const container = $('#projects-container');
    container.innerHTML = '';
    const groups = { academic: [], professional: [], personal: [] };
    arr.forEach(p=> groups[p.category = p.category || 'personal'].push(p));
    const order = ['academic','professional','personal'];
    order.forEach(cat=>{
      const items = groups[cat];
      if(!items || items.length===0) return;
      const section = document.createElement('section');
      section.className = 'projects-category container section';
      const h = document.createElement('h3');
      h.textContent = I18n.t('cat_'+cat);
      section.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'grid';
      items.forEach(p=>{
        const art = document.createElement('article');
        art.className = 'card project-card';
        art.setAttribute('data-project-id', p.id);
        art.tabIndex = 0;
        const title = document.createElement('h3');
        title.textContent = I18n.t(p.title_key);
        const summary = document.createElement('p');
        summary.textContent = I18n.t(p.summary_key);
        art.appendChild(title);
        art.appendChild(summary);
        grid.appendChild(art);
      });
      section.appendChild(grid);
      container.appendChild(section);
    });
    // attach handlers to newly created elements
    $all('.project-card').forEach(el=>{
      const id = el.getAttribute('data-project-id');
      el.addEventListener('click', ()=> openModal(id));
      el.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') openModal(id); });
    });
  }

  function setupControls(ids){
    // modal close
    document.addEventListener('click', e=>{
      const a = e.target.closest('[data-action="close"]');
      if(a) closeModal();
    });
    document.querySelector('.pm-close')?.addEventListener('click', closeModal);

    // prev/next - use provided ids ordering
    document.querySelector('.pm-prev')?.addEventListener('click', ()=>{
      const cur = (location.hash||'').replace('#project/','');
      const i = ids.indexOf(cur);
      if(i>0) openModal(ids[i-1]);
    });
    document.querySelector('.pm-next')?.addEventListener('click', ()=>{
      const cur = (location.hash||'').replace('#project/','');
      const i = ids.indexOf(cur);
      if(i < ids.length-1) openModal(ids[i+1]);
    });

    // keyboard
    document.addEventListener('keydown', e=>{
      if(e.key==='Escape') closeModal();
      if(e.key==='ArrowLeft') document.querySelector('.pm-prev')?.click();
      if(e.key==='ArrowRight') document.querySelector('.pm-next')?.click();
    });

    // hashchange -> open project
    window.addEventListener('hashchange', ()=>{
      const id = (location.hash||'').replace('#project/','');
      if(id && projects[id]) openModal(id);
    });
  }

  async function init(){
    // ensure I18n has initialized so translations are available
    if (window.I18n && typeof window.I18n.init === 'function') await window.I18n.init();
    const arr = await fetchProjects();
    // render grouped projects
    renderProjects(arr);
    // prepare ordered ids for prev/next
    const ids = arr.map(p=>p.id);
    setupControls(ids);
    // listen for language changes and re-render projects so category headings and texts update
    window.addEventListener('i18n:changed', ()=>{
      // re-render using the cached projectsArray
      renderProjects(projectsArray);
      // refresh controls ordering
      setupControls(projectsArray.map(p=>p.id));
    });
    // if user opened with a project hash
    const id = (location.hash||'').replace('#project/','');
    if(id && projects[id]) openModal(id);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
