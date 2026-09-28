/*
  content.js — shared by every page.
  Fills in every element marked data-f="some.path" (text) or
  data-f-href="some.path" (link) from content.json, so site text can be
  changed in one place without touching the HTML layout.
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

  fetch('content.json', { cache: 'no-store' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) { if (data) { apply(data); document.dispatchEvent(new Event('content:applied')); } })
    .catch(function () { /* keep the built-in text if content.json can't load */ });
})();
