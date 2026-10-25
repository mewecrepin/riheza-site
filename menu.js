// Riheza : menu sur téléphone, apparitions au défilement, vitrine de l'accueil.
// Sans ce fichier, le site reste complet : le menu s'affiche déplié et tout est visible.
(function () {
  var html = document.documentElement;
  html.classList.remove('sans-js');

  // Menu repliable
  var bouton = document.querySelector('.nav-bouton');
  var nav = document.getElementById('nav');
  if (bouton && nav) {
    bouton.addEventListener('click', function () {
      var ouvert = nav.classList.toggle('ouvert');
      bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  }

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calme || !('IntersectionObserver' in window)) return;
  html.classList.add('anime');

  // Apparitions au défilement, une seule fois par élément
  var observateur = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); observateur.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.apparait').forEach(function (el) { observateur.observe(el); });

  // Vitrine : chaque case passe une fois à son second produit, puis tout se pose
  document.querySelectorAll('.vitrine figure').forEach(function (fig, i) {
    var imgs = fig.querySelectorAll('img');
    if (imgs.length < 2) return;
    setTimeout(function () {
      imgs[0].style.opacity = '0';
      imgs[1].classList.remove('suivante');
    }, 2600 + i * 450);
  });
})();
