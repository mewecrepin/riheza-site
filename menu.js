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

  // Page Produits : recherche, rayon, prix et tri, combinés. Sans tri, les produits restent rangés par rayon ;
  // avec un tri ou « Nouveautés », ils passent dans une seule grille, puis reviennent à leur place.
  var form = document.getElementById('recherche');
  if (form) {
    var champ = form.querySelector('input'), effacer = form.querySelector('.recherche-effacer');
    var selPrix = document.getElementById('filtre-prix'), selTri = document.getElementById('tri');
    var puces = document.querySelectorAll('.sommaire [data-cat]');
    var statut = document.querySelector('.recherche-resultat'), vide = document.querySelector('.recherche-vide');
    var waVide = document.querySelector('[data-recherche-wa]'), waBase = waVide ? waVide.getAttribute('href') : '';
    var rayons = document.querySelectorAll('.rayon'), bandeau = document.querySelector('main > .bandeau');
    var resultats = document.querySelector('.resultats'), grille = document.getElementById('grille-resultats');
    var sommaire = document.querySelector('.sommaire');
    var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    var synonymes = { frigo: 'refrigerateur', congelo: 'congelateur', tele: 'tv', television: 'tv', telephone: 'samsung', portable: 'ordinateur', ecouteur: 'casque', micro: 'micro', ventilo: 'ventilateur', gaz: 'cuisiniere', pese: 'balance' };
    var cartes = [];
    rayons.forEach(function (r) {
      r.querySelectorAll('.produit').forEach(function (c) {
        cartes.push({ el: c, parent: c.parentNode, texte: norm(c.textContent), cat: c.getAttribute('data-cat'),
          prix: +c.getAttribute('data-prix'), remise: +c.getAttribute('data-remise'), ordre: +c.getAttribute('data-ordre'),
          pop: +c.getAttribute('data-pop'), nouveau: c.hasAttribute('data-nouveau') });
      });
    });
    var tris = {
      populaires: function (a, b) { return a.pop - b.pop; },
      recents: function (a, b) { return b.ordre - a.ordre; },
      'prix-croissant': function (a, b) { return a.prix - b.prix; },
      'prix-decroissant': function (a, b) { return b.prix - a.prix; },
      remise: function (a, b) { return b.remise - a.remise || a.prix - b.prix; }
    };
    var cat = '', aplat = false;
    var poserPuce = function () {
      puces.forEach(function (p) {
        var actif = p.getAttribute('data-cat') === cat;
        p.setAttribute('aria-current', actif ? 'true' : 'false');
        // la puce choisie reste visible dans la bande qui défile sur téléphone
        if (actif) { var ul = p.closest('ul'); ul.scrollLeft = p.parentNode.offsetLeft - (ul.clientWidth - p.offsetWidth) / 2; }
      });
    };
    var filtrer = function () {
      var brut = champ.value.trim(), q = norm(brut);
      effacer.hidden = !q;
      var mots = q.split(/\s+/).filter(Boolean).map(function (m) { return m.length > 3 ? m.replace(/s$/, '') : m; });
      var bornes = selPrix.value.split('-'), min = +bornes[0] || 0, max = bornes[1] ? +bornes[1] : Infinity;
      var tri = selTri.value || (cat === 'nouveautes' ? 'recents' : '');
      var n = 0, gardees = [];
      cartes.forEach(function (c) {
        var ok = mots.every(function (m) { return c.texte.indexOf(m) > -1 || (synonymes[m] && c.texte.indexOf(synonymes[m]) > -1); })
          && (!cat || (cat === 'nouveautes' ? c.nouveau : c.cat === cat))
          && c.prix >= min && c.prix < max;
        c.el.hidden = !ok; if (ok) { n++; gardees.push(c); }
      });
      // Une seule grille triée, ou retour aux rayons dans l'ordre d'origine
      if (tri) {
        gardees.sort(tris[tri]).forEach(function (c) { grille.appendChild(c.el); });
        aplat = true;
      } else if (aplat) {
        cartes.forEach(function (c) { c.parent.appendChild(c.el); });
        aplat = false;
      }
      resultats.hidden = !tri || n === 0;
      rayons.forEach(function (r) { r.hidden = !!tri || !r.querySelector('.produit:not([hidden])'); });
      var filtre = !!(q || cat || selPrix.value || selTri.value);
      if (bandeau) bandeau.hidden = filtre && n === 0;
      vide.hidden = n !== 0;
      if (waVide) waVide.setAttribute('href', waBase + encodeURIComponent(brut));
      selPrix.classList.toggle('actif', !!selPrix.value); selTri.classList.toggle('actif', !!selTri.value);
      statut.textContent = !filtre ? '' : n === 0 ? 'Aucun produit trouvé' + (q ? ' pour « ' + brut + ' »' : ' avec ces filtres') + '.' : n + (n > 1 ? ' produits' : ' produit') + (q ? ' pour « ' + brut + ' »' : '') + '.';
      if (filtre) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'filtres-effacer'; b.textContent = 'Tout effacer';
        b.addEventListener('click', function () { champ.value = ''; selPrix.value = ''; selTri.value = ''; cat = ''; poserPuce(); filtrer(); });
        statut.appendChild(b);
      }
      var p = new URLSearchParams();
      if (brut) p.set('q', brut); if (cat) p.set('cat', cat); if (selPrix.value) p.set('prix', selPrix.value); if (selTri.value) p.set('tri', selTri.value);
      if (history.replaceState) history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p.toString() : ''));
    };
    var versResultats = function () {
      var haut = sommaire.offsetTop;
      if (window.scrollY > haut) window.scrollTo({ top: haut, behavior: 'smooth' });
    };
    champ.addEventListener('input', filtrer);
    form.addEventListener('submit', function (ev) { ev.preventDefault(); champ.blur(); filtrer(); });
    effacer.addEventListener('click', function () { champ.value = ''; filtrer(); champ.focus(); });
    selPrix.addEventListener('change', filtrer);
    selTri.addEventListener('change', filtrer);
    puces.forEach(function (p) {
      p.addEventListener('click', function (ev) {
        ev.preventDefault();
        var c = p.getAttribute('data-cat');
        cat = (c === cat && c) ? '' : c;
        poserPuce(); filtrer(); versResultats();
      });
    });
    var depart = new URLSearchParams(location.search);
    champ.value = depart.get('q') || '';
    if (/^[a-z]+$/.test(depart.get('cat') || '')) cat = depart.get('cat');
    if (depart.get('prix')) selPrix.value = depart.get('prix');
    if (depart.get('tri')) selTri.value = depart.get('tri');
    if (selPrix.selectedIndex < 0) selPrix.value = '';
    if (selTri.selectedIndex < 0) selTri.value = '';
    poserPuce();
    if (champ.value || cat || selPrix.value || selTri.value) filtrer();
    if (location.hash === '#recherche' && !champ.value) { setTimeout(function () { champ.focus(); }, 300); }
    // La loupe de l'en-tête, déjà sur cette page : on va au champ au lieu de recharger
    var loupe = document.querySelector('.entete-recherche');
    if (loupe) loupe.addEventListener('click', function (ev) { ev.preventDefault(); form.scrollIntoView({ behavior: 'smooth', block: 'center' }); champ.focus({ preventScroll: true }); });
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

  // Vitrine : les quatre cases changent de produit tour à tour, en fondu, sans fin
  var cases = [];
  document.querySelectorAll('.vitrine-case').forEach(function (a) {
    var liste; try { liste = JSON.parse(a.getAttribute('data-vitrine')); } catch (e) { liste = []; }
    if (liste.length > 1) cases.push({ a: a, liste: liste, n: 0 });
  });
  if (cases.length) {
    var tour = 0;
    var changer = function () {
      if (document.hidden) return;
      var c = cases[tour % cases.length]; tour++;
      var n = (c.n + 1) % c.liste.length, p = c.liste[n];
      var neuve = new Image();
      neuve.onload = function () {
        neuve.alt = p.n; neuve.width = 800; neuve.height = 800; neuve.className = 'suivante';
        c.a.appendChild(neuve);
        void neuve.offsetWidth; // force le navigateur à poser l'image invisible avant le fondu
        neuve.classList.remove('suivante');
        var nettoyer = function () { var imgs = c.a.querySelectorAll('img'); for (var i = 0; i < imgs.length - 1; i++) imgs[i].remove(); };
        neuve.addEventListener('transitionend', nettoyer, { once: true });
        setTimeout(nettoyer, 2500);
        c.a.href = p.u; c.n = n;
      };
      neuve.src = 'images/produits/' + p.i;
    };
    setTimeout(function () { changer(); setInterval(changer, 2000); }, 2500);
  }
})();
