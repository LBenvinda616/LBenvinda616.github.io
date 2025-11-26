document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in-view');
    });
  }, {threshold: 0.12});
  document.querySelectorAll('.fade-up, .card').forEach(el => {
    obs.observe(el);
  });

  // Hero image parallax movement
  const heroImage = document.querySelector('.hero-image');
  const hero = document.querySelector('.hero');
  if(heroImage && hero){
    hero.addEventListener('mousemove', (ev)=>{
      const r = hero.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      heroImage.style.transform = `translate(${x * 12}px, ${y * 8}px) scale(1.02)`;
    });
    hero.addEventListener('mouseleave', ()=>{ heroImage.style.transform = '' });
  }

  // small click/tap animation for contact icons
  document.addEventListener('click', (ev)=>{
    const a = ev.target.closest && ev.target.closest('.contact-icon');
    if(!a) return;
    a.classList.add('contact-press');
    setTimeout(()=> a.classList.remove('contact-press'), 260);
  });
});
