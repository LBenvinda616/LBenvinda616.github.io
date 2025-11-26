// Simple contacts renderer — renders icons-only and shows tooltip on hover/click.
(function(){
  async function loadContacts(){
    try{
      const res = await fetch('data/contacts.json');
      if(!res.ok) throw new Error('Failed to load contacts.json');
      const contacts = await res.json();
      renderContacts(contacts);
    }catch(err){
      console.error('contacts.js:', err);
    }
  }

  function makeAnchor(contact){
    let href = '#';
    if(contact.type === 'email') href = 'mailto:' + contact.value;
    else href = contact.value;
    return href;
  }

  function renderContacts(contacts){
    const container = document.getElementById('contacts-container') || document.querySelector('#contact');
    if(!container) return;
    container.innerHTML = '';
    contacts.forEach(c => {
      // wrapper so we can show label next to icon on small screens
      const item = document.createElement('div');
      item.className = 'contact-item';

      const a = document.createElement('a');
      a.className = 'contact-icon';
      a.href = makeAnchor(c);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', c.type + (c.value ? (': ' + c.value) : ''));

  // use a background-image span so icons (SVG or PNG) visually fill the same box
  const graphic = document.createElement('span');
  graphic.className = 'contact-graphic';
  graphic.style.backgroundImage = `url(${c.icon})`;
  graphic.setAttribute('aria-hidden','true');
  a.appendChild(graphic);

      // small tooltip on hover using title — translated label could be added later
      a.title = c.value || c.type;

      const label = document.createElement('span');
      label.className = 'contact-label';
      label.textContent = c.value || c.type;

      item.appendChild(a);
      item.appendChild(label);
      container.appendChild(item);
    });
  }

  // re-render on language change in case aria-labels need updating later
  window.addEventListener('i18n:changed', ()=>{ loadContacts(); });

  // init
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadContacts);
  else loadContacts();
})();
