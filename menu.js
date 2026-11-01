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

  // Partager : feuille de partage du téléphone, sinon copie du lien (sinon le lien WhatsApp reste)
  document.querySelectorAll('[data-partager]').forEach(function (b) {
    b.addEventListener('click', function (ev) {
      var url = b.getAttribute('data-url'), titre = b.getAttribute('data-titre');
      if (navigator.share) { ev.preventDefault(); navigator.share({ title: titre, url: url }).catch(function () {}); return; }
      if (navigator.clipboard && window.isSecureContext) {
        ev.preventDefault();
        navigator.clipboard.writeText(url).then(function () {
          var t = b.querySelector('span');
          if (t) { var avant = t.textContent; t.textContent = 'Lien copié'; b.classList.add('btn-partage-ok'); setTimeout(function () { t.textContent = avant; b.classList.remove('btn-partage-ok'); }, 2000); }
          else { b.setAttribute('aria-label', 'Lien copié'); }
        });
      }
    });
  });

  // Galerie : les vignettes font défiler la grande photo, et suivent le doigt
  document.querySelectorAll('[data-galerie]').forEach(function (g) {
    var vue = g.querySelector('.galerie-vue'), vign = g.querySelectorAll('.galerie-vignettes a');
    if (!vue || !vign.length) return;
    vign.forEach(function (a, i) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); vue.scrollTo({ left: i * vue.clientWidth }); });
    });
    var att;
    vue.addEventListener('scroll', function () {
      clearTimeout(att);
      att = setTimeout(function () {
        var i = Math.round(vue.scrollLeft / vue.clientWidth);
        vign.forEach(function (a, j) { a.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      }, 80);
    });
  });

  // Recherche dans la page Produits : filtre les cartes au fil de la frappe
  var form = document.getElementById('recherche');
  if (form) {
    var champ = form.querySelector('input'), effacer = form.querySelector('.recherche-effacer');
    var statut = document.querySelector('.recherche-resultat'), vide = document.querySelector('.recherche-vide');
    var waVide = document.querySelector('[data-recherche-wa]'), waBase = waVide ? waVide.getAttribute('href') : '';
    var rayons = document.querySelectorAll('.rayon'), bandeau = document.querySelector('main > .bandeau');
    var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    var synonymes = { frigo: 'refrigerateur', congelo: 'congelateur', tele: 'tv', television: 'tv', telephone: 'samsung', portable: 'ordinateur', ecouteur: 'casque', micro: 'micro', ventilo: 'ventilateur', gaz: 'cuisiniere' };
    var cartes = [];
    rayons.forEach(function (r) { r.querySelectorAll('.produit').forEach(function (c) { cartes.push({ el: c, rayon: r, texte: norm(c.textContent) }); }); });
    var filtrer = function () {
      var q = norm(champ.value.trim());
      effacer.hidden = !q;
      var mots = q.split(/\s+/).filter(Boolean).map(function (m) { return m.length > 3 ? m.replace(/s$/, '') : m; });
      var n = 0;
      cartes.forEach(function (c) {
        var ok = mots.every(function (m) { return c.texte.indexOf(m) > -1 || (synonymes[m] && c.texte.indexOf(synonymes[m]) > -1); });
        c.el.hidden = !ok; if (ok) n++;
      });
      rayons.forEach(function (r) { r.hidden = !!q && !r.querySelector('.produit:not([hidden])'); });
      if (bandeau) bandeau.hidden = !!q && n === 0;
      vide.hidden = !(q && n === 0);
      if (waVide) waVide.setAttribute('href', waBase + encodeURIComponent(champ.value.trim()));
      statut.textContent = !q ? '' : n === 0 ? 'Aucun produit trouvé pour « ' + champ.value.trim() + ' ».' : n + (n > 1 ? ' produits trouvés' : ' produit trouvé') + ' pour « ' + champ.value.trim() + ' ».';
      if (history.replaceState) history.replaceState(null, '', q ? '?q=' + encodeURIComponent(champ.value.trim()) + '#recherche' : location.pathname);
    };
    champ.addEventListener('input', filtrer);
    form.addEventListener('submit', function (ev) { ev.preventDefault(); champ.blur(); filtrer(); });
    effacer.addEventListener('click', function () { champ.value = ''; filtrer(); champ.focus(); });
    var depart = new URLSearchParams(location.search).get('q');
    if (depart) { champ.value = depart; filtrer(); }
    if (location.hash === '#recherche' && !depart) { setTimeout(function () { champ.focus(); }, 300); }
  }

  // Application installable : mise en mémoire et bandeau « Installer »
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  (function () {
    var bandeau = document.querySelector('.installer'); if (!bandeau) return;
    var ok = bandeau.querySelector('.installer-ok'), fermer = bandeau.querySelector('.installer-fermer');
    var aide = bandeau.querySelector('[data-installer-aide]'), lien = document.querySelector('[data-installer-lien]');
    var installee = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    if (installee) return;
    var lire = function () { try { return +localStorage.getItem('riheza-installer-ferme') || 0; } catch (e) { return 0; } };
    var ecrire = function () { try { localStorage.setItem('riheza-installer-ferme', Date.now()); } catch (e) {} };
    var recent = Date.now() - lire() < 14 * 24 * 3600 * 1000;
    var montrer = function () { bandeau.hidden = false; html.classList.add('installer-visible'); };
    var cacher = function () { bandeau.hidden = true; html.classList.remove('installer-visible'); };
    var invite = null;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    window.addEventListener('beforeinstallprompt', function (ev) {
      ev.preventDefault(); invite = ev;
      if (lien) lien.hidden = false;
      if (!recent) setTimeout(montrer, 4000);
    });
    if (ios) {
      ok.hidden = true;
      aide.textContent = 'Touchez le bouton Partager, puis « Sur l’écran d’accueil ».';
      if (lien) lien.hidden = false;
      if (!recent) setTimeout(montrer, 4000);
    }
    ok.addEventListener('click', function () {
      if (!invite) return;
      invite.prompt();
      invite.userChoice.finally(function () { invite = null; cacher(); if (lien) lien.hidden = true; });
    });
    fermer.addEventListener('click', function () { ecrire(); cacher(); });
    if (lien) lien.addEventListener('click', function (ev) { ev.preventDefault(); montrer(); });
    window.addEventListener('appinstalled', function () { cacher(); if (lien) lien.hidden = true; });
  })();

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
