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

  // Page Produits : recherche, prix et rayon, combinés. Les puces de la bande choisissent un rayon (ou les nouveautés).
  var form = document.getElementById('recherche');
  if (form) {
    var champ = form.querySelector('input'), effacer = form.querySelector('.recherche-effacer');
    var selPrix = document.getElementById('filtre-prix'), puces = document.querySelectorAll('.sommaire [data-cat]');
    var sommaire = document.querySelector('.sommaire');
    var statut = document.querySelector('.recherche-resultat'), vide = document.querySelector('.recherche-vide');
    var waVide = document.querySelector('[data-recherche-wa]'), waBase = waVide ? waVide.getAttribute('href') : '';
    var rayons = document.querySelectorAll('.rayon'), bandeau = document.querySelector('main > .bandeau');
    var nouv = document.querySelector('.rayon-nouveautes'); // ses produits sont aussi dans leur rayon : on ne la montre que sans filtre, ou seule
    var norm = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
    var synonymes = { frigo: 'refrigerateur', congelo: 'congelateur', tele: 'tv', television: 'tv', telephone: 'samsung', portable: 'ordinateur', ecouteur: 'casque', micro: 'micro', ventilo: 'ventilateur', gaz: 'cuisiniere' };
    var lire = function (zone) {
      return Array.prototype.map.call(zone.querySelectorAll('.produit'), function (c) {
        return { el: c, texte: norm(c.textContent), cat: c.getAttribute('data-cat'), prix: +c.getAttribute('data-prix') };
      });
    };
    var cartes = [];
    rayons.forEach(function (r) { cartes = cartes.concat(lire(r)); });
    var cartesNouv = nouv ? lire(nouv) : [];
    var cat = '';
    var poserPuces = function () {
      puces.forEach(function (p) {
        var actif = p.getAttribute('data-cat') === cat;
        p.setAttribute('aria-current', actif ? 'true' : 'false');
        if (actif) { var ul = p.closest('ul'); ul.scrollLeft = p.parentNode.offsetLeft - (ul.clientWidth - p.offsetWidth) / 2; }
      });
    };
    var filtrer = function () {
      var brut = champ.value.trim(), q = norm(brut);
      effacer.hidden = !q;
      var mots = q.split(/\s+/).filter(Boolean).map(function (m) { return m.length > 3 ? m.replace(/s$/, '') : m; });
      var bornes = selPrix.value.split('-'), min = +bornes[0] || 0, max = bornes[1] ? +bornes[1] : Infinity;
      var garder = function (c) {
        return c.prix >= min && c.prix < max && mots.every(function (m) { return c.texte.indexOf(m) > -1 || (synonymes[m] && c.texte.indexOf(synonymes[m]) > -1); });
      };
      var n = 0;
      if (cat === 'nouveautes') {
        cartes.forEach(function (c) { c.el.hidden = true; });
        cartesNouv.forEach(function (c) { var ok = garder(c); c.el.hidden = !ok; if (ok) n++; });
        rayons.forEach(function (r) { r.hidden = true; });
        if (nouv) nouv.hidden = n === 0;
      } else {
        cartes.forEach(function (c) { var ok = (!cat || c.cat === cat) && garder(c); c.el.hidden = !ok; if (ok) n++; });
        cartesNouv.forEach(function (c) { c.el.hidden = false; });
        rayons.forEach(function (r) { r.hidden = !r.querySelector('.produit:not([hidden])'); });
        if (nouv) nouv.hidden = !!(q || cat || selPrix.value);
      }
      var filtre = !!(q || cat || selPrix.value);
      if (bandeau) bandeau.hidden = filtre && n === 0;
      vide.hidden = !(filtre && n === 0);
      if (waVide) waVide.setAttribute('href', waBase + encodeURIComponent(brut));
      selPrix.classList.toggle('actif', !!selPrix.value);
      statut.textContent = !filtre ? '' : n === 0 ? 'Aucun produit trouvé' + (q ? ' pour « ' + brut + ' »' : ' avec ces filtres') + '.' : n + (n > 1 ? ' produits trouvés' : ' produit trouvé') + (q ? ' pour « ' + brut + ' »' : '') + '.';
      if (filtre) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'filtres-effacer'; b.textContent = 'Tout effacer';
        b.addEventListener('click', function () { champ.value = ''; selPrix.value = ''; cat = ''; poserPuces(); filtrer(); });
        statut.appendChild(b);
      }
      // Address shown: rihezastore.com/<rayon> for a section, /produits otherwise
      var p = new URLSearchParams(), chemin = '/produits';
      if (brut) p.set('q', brut); if (selPrix.value) p.set('prix', selPrix.value);
      if (cat && cat !== 'nouveautes') chemin = '/' + cat; else if (cat) p.set('cat', cat);
      if (history.replaceState) history.replaceState(null, '', chemin + (p.toString() ? '?' + p.toString() : ''));
    };
    champ.addEventListener('input', filtrer);
    form.addEventListener('submit', function (ev) { ev.preventDefault(); champ.blur(); filtrer(); });
    effacer.addEventListener('click', function () { champ.value = ''; filtrer(); champ.focus(); });
    selPrix.addEventListener('change', filtrer);
    puces.forEach(function (p) {
      p.addEventListener('click', function (ev) {
        ev.preventDefault();
        var c = p.getAttribute('data-cat');
        cat = (c && c === cat) ? '' : c;
        poserPuces(); filtrer();
        if (window.scrollY > sommaire.offsetTop) window.scrollTo({ top: sommaire.offsetTop, behavior: 'smooth' });
      });
    });
    // Point de départ : ?q=, ?cat=, ?prix=, une adresse /rayon ou un ancien lien #rayon
    var params = new URLSearchParams(location.search), depart = params.get('q');
    var dieze = location.hash.slice(1), ids = Array.prototype.map.call(puces, function (p) { return p.getAttribute('data-cat'); });
    var rayon = location.pathname.replace(/^\/+|\/+$/g, '');
    if (ids.indexOf(params.get('cat')) > 0) cat = params.get('cat'); else if (ids.indexOf(rayon) > 0) cat = rayon; else if (ids.indexOf(dieze) > 0) cat = dieze;
    if (params.get('prix')) { selPrix.value = params.get('prix'); if (selPrix.selectedIndex < 0) selPrix.value = ''; }
    if (depart) champ.value = depart;
    poserPuces();
    if (depart || cat || selPrix.value) filtrer();
    // La barre de l'en-tête, déjà sur cette page : elle filtre sans recharger
    var haut = document.getElementById('entete-champ');
    if (haut) {
      if (depart) haut.value = depart;
      haut.form.addEventListener('submit', function (ev) {
        ev.preventDefault(); haut.blur();
        champ.value = haut.value; filtrer();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
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
