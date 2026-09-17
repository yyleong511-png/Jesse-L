(function () {
  'use strict';

  var CREDS_KEY = 'jl_admin_creds_v1';
  var STATE = { owner: '', repo: '', branch: 'main', token: '', sha: null, data: null, dirty: false };

  // ---------- tiny utils ----------
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o == null) ? undefined : o[k]; }, obj);
  }
  function setPath(obj, path, value) {
    var parts = path.split('.');
    var last = parts.pop();
    var target = parts.reduce(function (o, k) { return o[k]; }, obj);
    target[last] = value;
  }
  function b64EncodeUnicode(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function b64DecodeUnicode(b64) {
    var binary = atob(b64.replace(/\n/g, ''));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function toast(msg, isErr) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = isErr ? 'show err' : 'show';
    clearTimeout(toast._h);
    toast._h = setTimeout(function () { t.className = t.className.replace('show', ''); }, 4200);
  }

  // ---------- GitHub API ----------
  function apiHeaders() {
    return {
      Authorization: 'token ' + STATE.token,
      Accept: 'application/vnd.github+json'
    };
  }
  function contentsUrl() {
    return 'https://api.github.com/repos/' + encodeURIComponent(STATE.owner) + '/' +
      encodeURIComponent(STATE.repo) + '/contents/content.json';
  }

  function loadContent() {
    var url = contentsUrl() + '?ref=' + encodeURIComponent(STATE.branch) + '&t=' + Date.now();
    return fetch(url, { headers: apiHeaders() }).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('That token was rejected. Check it\u2019s valid and has "Contents: Read and write" on this repo.');
      }
      if (res.status === 404) {
        throw new Error('content.json wasn\u2019t found in ' + STATE.owner + '/' + STATE.repo + ' on branch "' + STATE.branch + '". Make sure the updated site files (including content.json) are pushed there first.');
      }
      if (!res.ok) throw new Error('GitHub returned an error (' + res.status + '). Double-check the username, repo name and branch.');
      return res.json();
    }).then(function (json) {
      STATE.sha = json.sha;
      STATE.data = JSON.parse(b64DecodeUnicode(json.content));
    });
  }

  function publishContent() {
    var body = {
      message: 'Update site content via admin panel',
      content: b64EncodeUnicode(JSON.stringify(STATE.data, null, 2)),
      branch: STATE.branch,
      sha: STATE.sha
    };
    return fetch(contentsUrl(), {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, apiHeaders()),
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          throw new Error(j.message || ('GitHub rejected the save (' + res.status + ').'));
        });
      }
      return res.json();
    }).then(function (json) {
      STATE.sha = json.content.sha;
    });
  }

  // ---------- credentials ----------
  function saveCreds() {
    if (document.getElementById('tRemember').checked) {
      localStorage.setItem(CREDS_KEY, JSON.stringify({
        owner: STATE.owner, repo: STATE.repo, branch: STATE.branch, token: STATE.token
      }));
    } else {
      localStorage.removeItem(CREDS_KEY);
    }
  }
  function loadSavedCreds() {
    try {
      var raw = localStorage.getItem(CREDS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function forgetCreds() {
    localStorage.removeItem(CREDS_KEY);
  }

  // ---------- rendering ----------
  function fieldRow(field) {
    var id = 'f-' + field.path.replace(/\./g, '-');
    var wrap = el('div', { class: 'field' });
    wrap.appendChild(el('label', { class: 'flabel', for: id, text: field.label }));
    var input;
    if (field.type === 'textarea') {
      input = el('textarea', { id: id, rows: '4' });
    } else {
      input = el('input', { id: id, type: field.type === 'url' ? 'url' : 'text' });
    }
    input.value = getPath(STATE.data, field.path) || '';
    input.addEventListener('input', function () {
      setPath(STATE.data, field.path, input.value);
      setDirty(true);
    });
    wrap.appendChild(input);
    return wrap;
  }

  function renderSection(section) {
    var det = el('details', { id: 'sec-' + section.key });
    var summary = el('summary');
    var left = el('div');
    if (section.eyebrow) left.appendChild(el('span', { class: 'eyebrow', text: section.eyebrow }));
    left.appendChild(document.createTextNode(section.title));
    summary.appendChild(left);
    summary.appendChild(el('span', { class: 'chev', text: '\u2192' }));
    det.appendChild(summary);

    if (section.note) det.appendChild(el('p', { class: 'hint', text: section.note }));

    section.fields.forEach(function (item) {
      if (item.group) {
        var block = el('div', { class: 'item-block' });
        block.appendChild(el('div', { class: 'item-title', text: item.group }));
        item.fields.forEach(function (f) { block.appendChild(fieldRow(f)); });
        det.appendChild(block);
      } else {
        det.appendChild(fieldRow(item));
      }
    });
    return det;
  }

  function renderEditor() {
    var main = document.getElementById('editor');
    main.innerHTML = '';
    SECTIONS.forEach(function (s) { main.appendChild(renderSection(s)); });
    main.appendChild(el('p', {
      class: 'hint',
      text: 'This covers text and links only. Swapping photos still needs a hand from Claude (or a future upload tool) — image files aren\u2019t part of this panel yet.'
    }));
  }

  function setDirty(v) {
    STATE.dirty = v;
    var btn = document.getElementById('publishBtn');
    btn.disabled = !v;
    btn.classList.toggle('dirty', v);
    btn.textContent = v ? 'Publish changes' : 'Publish';
  }

  function setStatus(text, kind) {
    document.getElementById('statusText').textContent = text;
    var dot = document.getElementById('statusDot');
    dot.className = 'dot' + (kind ? ' ' + kind : '');
  }

  // ---------- flow ----------
  function showApp() {
    document.getElementById('connect').classList.add('hidden');
    document.getElementById('appHeader').classList.remove('hidden');
    document.getElementById('statusbar').classList.remove('hidden');
    document.getElementById('editor').classList.remove('hidden');
    document.getElementById('repoLabel').textContent = STATE.owner + '/' + STATE.repo + ' @ ' + STATE.branch;
    renderEditor();
    setDirty(false);
    setStatus('Connected. Loaded just now.', 'ok');
  }

  function attemptConnect(fromSaved) {
    var errBox = document.getElementById('connectError');
    errBox.style.display = 'none';
    var owner = document.getElementById('tOwner').value.trim();
    var repo = document.getElementById('tRepo').value.trim();
    var branch = document.getElementById('tBranch').value.trim() || 'main';
    var token = document.getElementById('tToken').value.trim();

    if (!owner || !repo || !token) {
      errBox.textContent = 'Fill in the username, repo name and token first.';
      errBox.style.display = 'block';
      return;
    }
    STATE.owner = owner; STATE.repo = repo; STATE.branch = branch; STATE.token = token;

    var btn = document.getElementById('connectBtn');
    btn.disabled = true;
    btn.textContent = 'Connecting\u2026';

    loadContent().then(function () {
      saveCreds();
      showApp();
    }).catch(function (e) {
      errBox.textContent = e.message;
      errBox.style.display = 'block';
      if (fromSaved) forgetCreds();
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Connect';
    });
  }

  function doPublish() {
    var btn = document.getElementById('publishBtn');
    btn.disabled = true;
    btn.textContent = 'Publishing\u2026';
    setStatus('Saving to GitHub\u2026');
    publishContent().then(function () {
      setDirty(false);
      setStatus('Published. Live on the site in about a minute.', 'ok');
      toast('Published \u2014 GitHub Pages will rebuild shortly.');
    }).catch(function (e) {
      setStatus('Save failed.', 'err');
      toast(e.message, true);
      btn.disabled = false;
      btn.classList.add('dirty');
    }).finally(function () {
      if (STATE.dirty) btn.textContent = 'Publish changes';
    });
  }

  // ---------- init ----------
  document.getElementById('connectBtn').addEventListener('click', function () { attemptConnect(false); });
  document.getElementById('publishBtn').addEventListener('click', doPublish);

  window.addEventListener('beforeunload', function (e) {
    if (STATE.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  var saved = loadSavedCreds();
  if (saved) {
    document.getElementById('tOwner').value = saved.owner || '';
    document.getElementById('tRepo').value = saved.repo || '';
    document.getElementById('tBranch').value = saved.branch || 'main';
    document.getElementById('tToken').value = saved.token || '';
    attemptConnect(true);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
