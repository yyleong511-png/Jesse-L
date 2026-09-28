/*
  content.js — shared by every page.
  1) Fills in every element marked data-f="some.path" (text) or
     data-f-href="some.path" (link) from content.json, so the admin panel
     can change site text without touching the HTML.
  2) Makes sure the nav bar has a "Gallery" link on every page, placed
     between "More" and "Contact" — so no page needs editing by hand.
*/
(function () {
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o == null) ? undefined : o[k]; }, obj);
  }

  function apply(data) {
    document.querySelectorAll('[data-f]').forEach(function (el) {
      var v = getPath(data, el.getAttribute('data-f'));
      if (v != null && typeof v !== 'object') el.textContent = v;
    });
    document.querySelectorAll('[data-f-href]').forEach(function (el) {
      var v = getPath(data, el.getAttribute('data-f-href'));
      if (v != null && typeof v !== 'object') el.setAttribute('href', v);
    });
  }

  function ensureGalleryLink() {
    var nav = document.querySelector('header nav');
    if (!nav || nav.querySelector('a[href="gallery.html"]')) return;
    var link = document.createElement('a');
    link.href = 'gallery.html';
    link.textContent = 'Gallery';
    if (/(^|\/)gallery\.html$/.test(location.pathname)) link.className = 'active';
    var contact = nav.querySelector('a[href="contact.html"]');
    if (contact) nav.insertBefore(link, contact);
    else nav.appendChild(link);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureGalleryLink);
  } else {
    ensureGalleryLink();
  }

  fetch('content.json', { cache: 'no-store' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) { if (data) apply(data); })
    .catch(function () { /* keep the built-in text if content.json can't load */ });
})();
