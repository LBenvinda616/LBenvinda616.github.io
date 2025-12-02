// projects.js - opens a modal with project details and images
(function(){
  const dataPath = 'data/projects.json';
  let projects = {};
  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#0f1724"/><text x="50%" y="50%" fill="#9aa6b2" font-size="20" text-anchor="middle" dy="7">Image placeholder</text></svg>'
  );

  let projectsArray = [];
  let _chevronCounter = 0;
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
    $('#pm-title').textContent = title;
    $('#pm-summary').textContent = summary;
    // render rich detail blocks in the modal if available (paragraphs, html, video, img)
    const pmDetails = $('#pm-details');
    pmDetails.innerHTML = '';
    renderDetailBlocks(p.details || I18n.t(p.details_key), pmDetails);

    // images
    // populate modal images: prefer the simple preview unless details contains a gallery block
    const pmLeft = document.querySelector('.pm-left') || document.getElementById('pm-left');
    const main = $('#pm-main-image');
    const thumbs = $('#pm-thumbs');
    if(pmLeft) pmLeft.innerHTML = '';
    let galleryBlock = null;
    if(Array.isArray(p.details)) galleryBlock = p.details.find(b=>b && b.type === 'gallery');
    if(galleryBlock){
      // details will render the gallery inline; hide the modal preview area so no placeholder shows
      modal.classList.add('no-preview');
      if(thumbs) thumbs.innerHTML = '';
    } else {
      // fallback: old behavior using #pm-main-image and thumbs
      thumbs.innerHTML = '';
      const imgs = p.images && p.images.length ? p.images : [];
      const first = imgs[0] || null;
      if(main) main.src = first || placeholder;
      if(main) main.alt = title;
      imgs.forEach((src, idx)=>{
        const t = document.createElement('img');
        t.className = 'pm-thumb';
        t.src = src;
        t.alt = title + ' ' + (idx+1);
        t.loading = 'lazy';
        t.addEventListener('click', ()=> { if(main) main.src = src; });
        thumbs.appendChild(t);
      });
    }

    // render skills inside the modal (below summary)
    let skillsContainer = $('#pm-skills');
    if(!skillsContainer){
      skillsContainer = document.createElement('div');
      skillsContainer.id = 'pm-skills';
      // place it after the summary
      const summaryNode = $('#pm-summary');
      summaryNode.parentNode.insertBefore(skillsContainer, summaryNode.nextSibling);
    }
    skillsContainer.innerHTML = '';
    if(Array.isArray(p.skills) && p.skills.length){
      const ul = document.createElement('ul');
      ul.className = 'project-skills skills';
      p.skills.forEach(s => {
        const li = document.createElement('li');
        if(typeof s === 'string') li.textContent = s;
        else if(s && typeof s === 'object' && s.key) li.textContent = I18n.t(s.key);
        ul.appendChild(li);
      });
      skillsContainer.appendChild(ul);
    }

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
    // Group projects by category and render as accessible tabs (one tab per category)
    // include an "all" group that contains every project
    const groups = { all: [], academic: [], professional: [], personal: [] };
    arr.forEach(p=>{
      p.category = p.category || 'personal';
      groups[p.category].push(p);
      groups.all.push(p);
    });
    const order = ['all','academic','professional','personal'];

    // tabs wrapper
    const tabsWrap = document.createElement('div'); tabsWrap.className = 'project-tabs container section';
    const tabList = document.createElement('div'); tabList.className = 'tab-list'; tabList.setAttribute('role','tablist');
    const panelsWrap = document.createElement('div'); panelsWrap.className = 'tab-panels';

    order.forEach((cat, idx)=>{
      const items = groups[cat];
      // render tab button even if empty to keep consistent order, but hide empty panels
      const tabBtn = document.createElement('button');
      tabBtn.className = 'tab';
      tabBtn.type = 'button';
      tabBtn.setAttribute('role','tab');
      tabBtn.setAttribute('aria-selected', idx===0 ? 'true' : 'false');
      tabBtn.dataset.panel = `panel-${cat}`;
      tabBtn.id = `tab-${cat}`;
      tabBtn.textContent = I18n.t('cat_'+cat);
      if(idx===0) tabBtn.classList.add('active');
      tabList.appendChild(tabBtn);

      const panel = document.createElement('div'); panel.className = 'tab-panel'; panel.id = `panel-${cat}`; panel.setAttribute('role','tabpanel'); panel.setAttribute('aria-labelledby', tabBtn.id);
      if(idx!==0) panel.hidden = true;

      // inside each panel render the project accordion list
      const list = document.createElement('div'); list.className = 'project-accordion';
      if(items && items.length){
        items.forEach(p=>{
          const item = document.createElement('article');
          item.className = 'accordion-item card project-card';
          item.setAttribute('data-project-id', p.id);

          const header = document.createElement('header');
          header.className = 'accordion-header';
          header.tabIndex = 0;
          const titleWrap = document.createElement('div');
          titleWrap.className = 'accordion-title';
          const t = document.createElement('h3'); t.textContent = I18n.t(p.title_key);
          const short = document.createElement('p'); short.className = 'summary-short'; short.textContent = I18n.t(p.summary_key);
          titleWrap.appendChild(t); titleWrap.appendChild(short);
          if(Array.isArray(p.skills) && p.skills.length){
            const skh = document.createElement('ul'); skh.className = 'project-skills skills header-skills';
            p.skills.forEach(s=>{ const li = document.createElement('li'); if(typeof s==='string') li.textContent = s; else if(s && s.key) li.textContent = I18n.t(s.key); skh.appendChild(li); });
            titleWrap.appendChild(skh);
          }
          // make the whole header act as the toggle (accessible)
          header.setAttribute('role', 'button');
          header.setAttribute('aria-expanded', 'false');
          header.appendChild(titleWrap);
          // add a desktop-only chevron button to indicate the item can be opened
          try{
            const openLabel = (window.I18n && typeof I18n.t === 'function') ? I18n.t('btn_open') : 'Open';
            const openBtn = document.createElement('button');
            openBtn.type = 'button';
            openBtn.className = 'accordion-open-btn';
            openBtn.setAttribute('aria-label', openLabel || 'Open project');
            // inline chevron-down SVG with its own gradient defs so the arrow can use the site gradient
            const gid = 'chev-grad-' + (++_chevronCounter);
            openBtn.innerHTML = `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <defs>
                  <linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" style="stop-color:var(--accent3)" />
                    <stop offset="0.5" style="stop-color:var(--accent2)" />
                    <stop offset="1" style="stop-color:var(--accent)" />
                  </linearGradient>
                </defs>
                <!-- stroked chevron for a bolder look; gradient applied to stroke -->
                <path d="M6 9l6 6 6-6" stroke="url(#${gid})" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
              </svg>`;
            // clicking the small button should toggle the header without propagating twice
            openBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); header.click(); });
            header.appendChild(openBtn);
          }catch(e){ /* ignore if I18n not ready */ }

          const body = document.createElement('div'); body.className = 'accordion-body'; body.hidden = true; body.style.display = 'none';

          const right = document.createElement('div'); right.className = 'acc-right';
          const detailsEl = document.createElement('div'); detailsEl.className = 'acc-details';
          renderDetailBlocks(p.details || I18n.t(p.details_key), detailsEl);
          right.appendChild(detailsEl);

          body.appendChild(right);
          item.appendChild(header); item.appendChild(body);
          list.appendChild(item);
        });
      }

      panel.appendChild(list);
      panelsWrap.appendChild(panel);
    });

    tabsWrap.appendChild(tabList);
    tabsWrap.appendChild(panelsWrap);
    container.appendChild(tabsWrap);

    // tab switching - attach a click handler to each tab button for reliability
    const tabButtons = Array.from(tabList.querySelectorAll('.tab'));
    tabButtons.forEach(btn => {
      btn.addEventListener('click', ()=>{
        const active = tabList.querySelector('.tab.active'); if(active) { active.classList.remove('active'); active.setAttribute('aria-selected','false'); }
        btn.classList.add('active'); btn.setAttribute('aria-selected','true');
        panelsWrap.querySelectorAll('.tab-panel').forEach(p=> p.hidden = p.id !== btn.dataset.panel);
      });
      // keyboard navigation between tabs
      btn.addEventListener('keydown', (e)=>{
        if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
          e.preventDefault();
          const idx = tabButtons.indexOf(btn);
          const next = tabButtons[(idx + (e.key === 'ArrowRight' ? 1 : tabButtons.length-1)) % tabButtons.length];
          if(next){ next.focus(); next.click(); }
        }
      });
    });

    // accordion behavior: toggle on click/keyboard, single-open per accordion
    $all('.accordion-header').forEach(hdr=>{
      const item = hdr.closest('.accordion-item');
      // support older markup that may contain a .accordion-toggle, but prefer header attributes
      const btn = hdr.querySelector('.accordion-toggle');
      function setOpen(open){
        const body = item.querySelector('.accordion-body');
        const isOpen = (btn ? btn.getAttribute('aria-expanded') : hdr.getAttribute('aria-expanded')) === 'true';
        const shouldOpen = open === undefined ? !isOpen : !!open;
        if(shouldOpen){
          // close siblings
          const parent = item.parentNode;
          parent.querySelectorAll('.accordion-item.open').forEach(sib=>{
            if(sib!==item){
              sib.classList.remove('open');
              const sibBody = sib.querySelector('.accordion-body'); if(sibBody){ sibBody.hidden = true; sibBody.style.display = 'none'; }
              const sibHdr = sib.querySelector('.accordion-header'); if(sibHdr){ sibHdr.setAttribute('aria-expanded','false'); }
              const sibBtn = sib.querySelector('.accordion-toggle'); if(sibBtn) sibBtn.setAttribute('aria-expanded','false');
            }
          });
          item.classList.add('open'); body.hidden = false; body.style.display = 'flex';
          hdr.setAttribute('aria-expanded','true'); if(btn) btn.setAttribute('aria-expanded','true');
          // update hash for shareability
          const id = item.getAttribute('data-project-id'); history.replaceState(null,'','#project/'+id);
        } else {
          item.classList.remove('open'); body.hidden = true; body.style.display = 'none';
          hdr.setAttribute('aria-expanded','false'); if(btn) btn.setAttribute('aria-expanded','false');
          // remove hash if it points to this project
          const cur = (location.hash||'').replace('#project/',''); if(cur === item.getAttribute('data-project-id')) history.replaceState(null,'',location.pathname+location.search);
        }
      }
      hdr.addEventListener('click', ()=> setOpen());
      hdr.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); setOpen(); } });
    });
  }

  function setupControls(ids){
    // keyboard: Escape closes any open accordion, arrows navigate between projects
    document.addEventListener('keydown', e=>{
      if(e.key === 'Escape'){
        document.querySelectorAll('.accordion-item.open').forEach(it=>{ it.classList.remove('open'); it.querySelector('.accordion-body').hidden = true; it.querySelector('.accordion-toggle').setAttribute('aria-expanded','false'); });
      }
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
        const open = document.querySelector('.accordion-item.open');
        const curId = open?.getAttribute('data-project-id') || (location.hash||'').replace('#project/','');
        const i = ids.indexOf(curId);
        if(i === -1) return;
        let nextIndex = i + (e.key==='ArrowRight' ? 1 : -1);
        if(nextIndex < 0 || nextIndex >= ids.length) return;
        const nextId = ids[nextIndex];
        const nextItem = document.querySelector(`.accordion-item[data-project-id="${nextId}"]`);
        if(nextItem){ nextItem.querySelector('.accordion-header').click(); nextItem.querySelector('.accordion-header').focus(); }
      }
    });

    // hashchange -> open project inline
    window.addEventListener('hashchange', ()=>{
      const id = (location.hash||'').replace('#project/','');
      if(!id) return;
      const item = document.querySelector(`.accordion-item[data-project-id="${id}"]`);
      if(item) item.querySelector('.accordion-header').click();
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
    // if user opened with a project hash -> expand that item inline
    const id = (location.hash||'').replace('#project/','');
    if(id){
      const item = document.querySelector(`.accordion-item[data-project-id="${id}"]`);
      if(item) item.querySelector('.accordion-header').click();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

  /**
   * Render an array of detail blocks into the provided container.
   * Supported block types:
   *  - { type: "p", text_key?: "...", text?: "..." }
   *  - { type: "html", html: "<..."> }    // only for trusted/static HTML
   *  - { type: "video", provider: "youtube"|"vimeo", id: "VIDEO_ID", src?: "..." }
   *  - { type: "img", src: "...", alt?: "...", caption?: "..." }
   *
   * If `details` is a string it will be rendered as a paragraph.
   */
  function renderDetailBlocks(details, container){
    if(!container) return;
    // clear existing content
    if(typeof container.innerHTML !== 'undefined') container.innerHTML = '';

    // fallback: string -> single paragraph
    if(!details) return;
    if(typeof details === 'string'){
      const p = document.createElement('p');
      p.textContent = details;
      container.appendChild(p);
      return;
    }

    if(!Array.isArray(details)){
      // unknown type, try to stringify
      const p = document.createElement('p');
      p.textContent = String(details);
      container.appendChild(p);
      return;
    }

    details.forEach(block=>{
      if(!block || !block.type) return;
      if(block.type === 'p'){
        const p = document.createElement('p');
        p.textContent = block.text_key ? I18n.t(block.text_key) : (block.text || '');
        container.appendChild(p);
      } else if(block.type === 'html'){
        const div = document.createElement('div');
        div.className = 'detail-html';
        div.innerHTML = block.html || '';
        container.appendChild(div);
      } else if(block.type === 'video'){
        const wrap = document.createElement('div');
        wrap.className = 'video-wrap';
        const iframe = document.createElement('iframe');
        iframe.setAttribute('loading','lazy');
        iframe.setAttribute('frameborder','0');
        iframe.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen','');
        if(block.src){
          iframe.src = block.src;
        } else if(block.provider === 'youtube' && block.id){
          iframe.src = `https://www.youtube.com/embed/${block.id}?rel=0`;
        } else if(block.provider === 'vimeo' && block.id){
          iframe.src = `https://player.vimeo.com/video/${block.id}`;
        } else {
          return;
        }
        iframe.title = block.title || 'Embedded video';
        wrap.appendChild(iframe);
        container.appendChild(wrap);
      } else if(block.type === 'gallery'){
        // inline gallery/carousel block
        renderGalleryBlock(block, container, (block.alt || ''));
      } else if(block.type === 'file'){
        // render a file link as a button. block: { type: 'file', src: 'path/to.pdf', label_key_en: 'key.en', label_key_pt: 'key.pt', label?: 'Download' , download?: true }
        const wrap = document.createElement('div'); wrap.className = 'detail-file';
        const a = document.createElement('a');
        a.className = 'file-btn btn';
        a.href = block.src || block.url || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        if (block.download) a.setAttribute('download', '');
        // choose label based on i18n current language if specific keys provided
        try{
          let label = '';
          if(block.label_key){ label = I18n.t(block.label_key); }
          else if(block.label){ label = block.label; }
          else {
            // fallback: use filename
            try{ label = (a.href && a.href.split('/').pop()) || 'Download'; }catch(e){ label = 'Download'; }
          }
          a.textContent = label;
        }catch(e){ a.textContent = block.label || 'Download'; }
        wrap.appendChild(a);
        container.appendChild(wrap);
      } else if(block.type === 'img'){
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        img.src = block.src;
        img.alt = block.alt || '';
        img.className = 'project-img';
        figure.appendChild(img);
        if(block.caption){
          const fc = document.createElement('figcaption');
          fc.textContent = block.caption;
          figure.appendChild(fc);
        }
        container.appendChild(figure);
      }
    });
  }

  // Render a gallery/slideshow block inside `container` as a single-image carousel with arrows.
  // block = { type: 'gallery', images: [...], alt?: '...', interval?: number }
  function renderGalleryBlock(block, container, altPrefix){
    if(!block || !container) return;
    const raw = Array.isArray(block.images) ? block.images : [];
    // normalize images array: allow either strings or objects { src, alt, caption }
    const imgs = raw.map(it => {
      if(!it) return null;
      if(typeof it === 'string') return { src: it, alt: '', caption: '' };
      if(typeof it === 'object') return { src: it.src || it.url || '', alt: it.alt || '', caption: it.caption || '' };
      return null;
    }).filter(Boolean);
    const len = imgs.length;
    const wrap = document.createElement('div'); wrap.className = 'slideshow-wrap';
    // expose normalized image srcs for lightbox handling
    try{ wrap.dataset.images = JSON.stringify(imgs.map(i=>i.src)); }catch(e){ wrap.dataset.images = '[]'; }

    const stage = document.createElement('div'); stage.className = 'slideshow-stage';
    const main = document.createElement('img'); main.className = 'slideshow-main';
    main.alt = altPrefix || (block.alt || (imgs[0] && imgs[0].alt) || 'project image');
    main.src = imgs[0] ? imgs[0].src : placeholder;
    main.loading = 'lazy';
    stage.appendChild(main);
    wrap.appendChild(stage);

    // arrows
    const prev = document.createElement('button'); prev.type='button'; prev.className = 'slideshow-prev'; prev.setAttribute('aria-label','Previous image'); prev.innerHTML = '&#10094;';
    const next = document.createElement('button'); next.type='button'; next.className = 'slideshow-next'; next.setAttribute('aria-label','Next image'); next.innerHTML = '&#10095;';
    wrap.appendChild(prev); wrap.appendChild(next);

    // dots
    const dots = document.createElement('div'); dots.className = 'slideshow-dots';
    let current = 0;
    imgs.forEach((imgObj, idx)=>{
      const d = document.createElement('button'); d.type='button'; d.className = 'slideshow-dot'; d.setAttribute('aria-label', `Show image ${idx+1}`);
      d.addEventListener('click', ()=> show(idx));
      dots.appendChild(d);
    });
    wrap.appendChild(dots);

    function update(){
      const imgObj = imgs[current] || null;
      main.src = imgObj ? imgObj.src : placeholder;
      main.alt = (imgObj && imgObj.alt) ? imgObj.alt : (altPrefix || (block.alt || 'project image'));
      Array.from(dots.children).forEach((b,i)=> b.classList.toggle('active', i===current));
    }

    function show(i){ if(typeof i !== 'number') return; current = (i + len) % len; update(); }
    prev.addEventListener('click', ()=> show(current - 1));
    next.addEventListener('click', ()=> show(current + 1));

    // keyboard left/right when focused
    wrap.tabIndex = 0;
    wrap.addEventListener('keydown', (e)=>{ if(e.key==='ArrowLeft') { e.preventDefault(); show(current - 1); } else if(e.key==='ArrowRight'){ e.preventDefault(); show(current + 1); } });

    // auto-advance with optional interval on block
    let timer = null; const interval = (typeof block.interval === 'number' && block.interval > 500) ? block.interval : 5000;
    function start(){ if(timer) clearInterval(timer); if(len>1) timer = setInterval(()=>{ show(current + 1); }, interval); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    wrap.addEventListener('mouseenter', stop); wrap.addEventListener('mouseleave', start);
    start();

    update();
    container.appendChild(wrap);
  }

  // Lightbox handling for project images and galleries (delegated)
  (function(){
    const projectsContainer = document.getElementById('projects-container');
    if(!projectsContainer) return;

    // create lightbox element once
    let lb = null;
    function createLightbox(){
      lb = document.createElement('div'); lb.className = 'image-lightbox'; lb.innerHTML = `
        <div class="lb-backdrop" tabindex="-1"></div>
        <div class="lb-inner" role="dialog" aria-modal="true">
          <button class="lb-close" aria-label="Close">×</button>
          <img class="lb-img" src="" alt="" />
          <div class="lb-caption"></div>
          <button class="lb-prev" aria-label="Previous">‹</button>
          <button class="lb-next" aria-label="Next">›</button>
        </div>`;
      document.body.appendChild(lb);
      lb.querySelector('.lb-close').addEventListener('click', close);
      lb.querySelector('.lb-backdrop').addEventListener('click', close);
      lb.querySelector('.lb-prev').addEventListener('click', ()=> show(currentIndex-1));
      lb.querySelector('.lb-next').addEventListener('click', ()=> show(currentIndex+1));
      document.addEventListener('keydown', onKey);
    }

    let currentList = [];
    let currentIndex = 0;
    function openList(list, idx){
      if(!lb) createLightbox();
      currentList = Array.isArray(list) ? list : [];
      currentIndex = Math.max(0, Math.min((idx|0), currentList.length-1));
      lb.classList.add('open');
      updateLB();
    }
    function updateLB(){
      const imgEl = lb.querySelector('.lb-img');
      const cap = lb.querySelector('.lb-caption');
      if(!currentList.length){ imgEl.src = ''; cap.textContent = ''; return; }
      imgEl.src = currentList[currentIndex] || '';
      imgEl.alt = '';
      cap.textContent = `${currentIndex+1} / ${currentList.length}`;
      // show/hide nav
      lb.querySelector('.lb-prev').style.display = currentList.length>1 ? 'block' : 'none';
      lb.querySelector('.lb-next').style.display = currentList.length>1 ? 'block' : 'none';
    }
    function show(i){ if(!currentList.length) return; currentIndex = (i + currentList.length) % currentList.length; updateLB(); }
    function close(){ if(!lb) return; lb.classList.remove('open'); }
    function onKey(e){ if(!lb || !lb.classList.contains('open')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') show(currentIndex-1); if(e.key==='ArrowRight') show(currentIndex+1); }

    // delegate clicks inside projects container
    projectsContainer.addEventListener('click', (ev)=>{
      const img = ev.target.closest && ev.target.closest('img');
      if(!img) return;
      // prefer gallery dataset on ancestor slideshow-wrap
      const wrap = img.closest && img.closest('.slideshow-wrap');
      if(wrap && wrap.dataset && wrap.dataset.images){
        try{
          const list = JSON.parse(wrap.dataset.images || '[]');
          // determine index by matching src
          const src = img.src || img.getAttribute('src');
          let idx = list.indexOf(src);
          if(idx === -1) idx = 0;
          openList(list, idx);
          return;
        }catch(e){ /* ignore */ }
      }

      // otherwise open single image (could be inside figure)
      const src = img.src || img.getAttribute('src');
      if(src){ openList([src], 0); }
    });
  })();
