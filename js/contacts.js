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
    else if(contact.type === 'phone') href = 'tel:' + contact.value;
    else if(contact.type === 'linkedin') href = contact.value.startsWith('http') ? contact.value : 'https://linkedin.com/in/' + contact.value;
    else if(contact.href) href = contact.href;
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

      const img = document.createElement('img');
      img.src = c.icon;
      img.alt = c.type;
      img.width = 28;
      img.height = 28;
      a.appendChild(img);

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
