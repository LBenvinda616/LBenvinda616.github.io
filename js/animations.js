document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in-view');
    });
  }, {threshold: 0.12});
  document.querySelectorAll('.fade-up, .card').forEach(el => {
    obs.observe(el);
  });
});
