/*
  content.js — hydrates the static pages with text from content.json.

  Any element tagged with data-f="dot.path" gets its textContent replaced.
  Any element tagged with data-f-href="dot.path" gets its href replaced.
  If content.json can't be fetched (offline, opened from disk, etc.) the
  page quietly keeps whatever text is already baked into the HTML.
*/
(function () {
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, key) {
      return o == null ? undefined : o[key];
    }, obj);
  }

  function apply(data) {
    document.querySelectorAll('[data-f]').forEach(function (el) {
      var val = getPath(data, el.getAttribute('data-f'));
      if (typeof val === 'string') el.textContent = val;
    });
    document.querySelectorAll('[data-f-href]').forEach(function (el) {
      var val = getPath(data, el.getAttribute('data-f-href'));
      if (typeof val === 'string' && val) el.setAttribute('href', val);
    });
  }

  fetch('content.json', { cache: 'no-store' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) { if (data) apply(data); })
    .catch(function () { /* keep static fallback text */ });
})();
