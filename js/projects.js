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

      const list = document.createElement('div');
      list.className = 'project-accordion';

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
        // render skills in the header so they're visible when the accordion is closed
        if(Array.isArray(p.skills) && p.skills.length){
          const skh = document.createElement('ul'); skh.className = 'project-skills skills header-skills';
          p.skills.forEach(s=>{ const li = document.createElement('li'); if(typeof s==='string') li.textContent = s; else if(s && s.key) li.textContent = I18n.t(s.key); skh.appendChild(li); });
          titleWrap.appendChild(skh);
        }
        const toggle = document.createElement('button'); toggle.className = 'accordion-toggle'; toggle.setAttribute('aria-expanded','false'); toggle.innerHTML = '<span class="chev">▾</span>';
        header.appendChild(titleWrap); header.appendChild(toggle);

        const body = document.createElement('div'); body.className = 'accordion-body'; body.hidden = true; body.style.display = 'none';

        // Accordion body: only a right/details column. Left preview removed — details array fully drives content placement.
        const right = document.createElement('div'); right.className = 'acc-right';

        // right: details only (do not duplicate the summary here)
        const detailsEl = document.createElement('div'); detailsEl.className = 'acc-details';
        // render rich detail blocks (in order) — this is the single source of content for the body
        renderDetailBlocks(p.details || I18n.t(p.details_key), detailsEl);
        right.appendChild(detailsEl);

        // body.appendChild(right);
        // body.appendChild(left); 
        body.appendChild(right);
        item.appendChild(header); item.appendChild(body);
        list.appendChild(item);
      });

      section.appendChild(list);
      container.appendChild(section);
    });

    // accordion behavior: toggle on click/keyboard, single-open per accordion
    $all('.accordion-header').forEach(hdr=>{
      const item = hdr.closest('.accordion-item');
      const btn = hdr.querySelector('.accordion-toggle');
      function setOpen(open){
        const body = item.querySelector('.accordion-body');
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        const shouldOpen = open === undefined ? !isOpen : !!open;
        if(shouldOpen){
          // close siblings
          const parent = item.parentNode;
          parent.querySelectorAll('.accordion-item.open').forEach(sib=>{ if(sib!==item){ sib.classList.remove('open'); sib.querySelector('.accordion-body').hidden = true; sib.querySelector('.accordion-toggle').setAttribute('aria-expanded','false'); }});
          item.classList.add('open'); body.hidden = false; body.style.display = 'flex'; btn.setAttribute('aria-expanded','true');
          // update hash for shareability
          const id = item.getAttribute('data-project-id'); history.replaceState(null,'','#project/'+id);
        } else {
          item.classList.remove('open'); body.hidden = true; body.style.display = 'none'; btn.setAttribute('aria-expanded','false');
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
