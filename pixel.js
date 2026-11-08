// Pixel Facebook (Meta) de Riheza : pages vues, produits consultes, demandes sur WhatsApp
(function () {
  var ID = '696897534261775';
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', ID);
  fbq('track', 'PageView');

  // Product page: name and price come from the product details written for Google
  var produit = null;
  var bloc = document.querySelector('script[type="application/ld+json"]');
  if (bloc) { try { var d = JSON.parse(bloc.textContent); if (d['@type'] === 'Product') produit = d; } catch (e) {} }
  if (produit) fbq('track', 'ViewContent', { content_name: produit.name, content_type: 'product', value: produit.offers.price, currency: 'XOF' });

  // Click towards Riheza's WhatsApp (Commander, contact...); the share links (wa.me/?text=) are not counted
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="wa.me/"]') : null;
    if (!a || /wa\.me\/\?/.test(a.href)) return;
    var carte = a.closest('.produit');
    var lien = carte ? carte.querySelector('.produit-lien') : null;
    var nom = lien ? lien.textContent.trim() : (produit ? produit.name : '');
    fbq('track', 'Contact', nom ? { content_name: nom } : {});
  });
})();
