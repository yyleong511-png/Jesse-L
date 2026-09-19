(function () {
  'use strict';

  var VAULT_KEY = 'jl_admin_vault_v1';
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
        throw new Error('That token was rejected. Check it’s valid and has "Contents: Read and write" on this repo.');
      }
      if (res.status === 404) {
        throw new Error('content.json wasn’t found in ' + STATE.owner + '/' + STATE.repo + ' on branch "' + STATE.branch + '". Make sure the updated site files (including content.json) are pushed there first.');
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
    summary.appendChild(el('span', { class: 'chev', text: '→' }));
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
      text: 'This covers text and links only. Swapping photos still needs a hand from Claude (or a future upload tool) — image files aren’t part of this panel yet.'
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
    document.getElementById('gate').classList.add('hidden');
    document.getElementById('appHeader').classList.remove('hidden');
    document.getElementById('statusbar').classList.remove('hidden');
    document.getElementById('editor').classList.remove('hidden');
    document.getElementById('repoLabel').textContent = STATE.owner + '/' + STATE.repo + ' @ ' + STATE.branch;
    renderEditor();
    setDirty(false);
    setStatus('Connected. Loaded just now.', 'ok');
  }

  function connectAndShow(errBox, onFail) {
    return loadContent().then(function () {
      showApp();
    }).catch(function (e) {
      if (errBox) {
        errBox.textContent = e.message;
        errBox.style.display = 'block';
      }
      if (onFail) onFail();
      throw e;
    });
  }

  function doPublish() {
    var btn = document.getElementById('publishBtn');
    btn.disabled = true;
    btn.textContent = 'Publishing…';
    setStatus('Saving to GitHub…');
    publishContent().then(function () {
      setDirty(false);
      setStatus('Published. Live on the site in about a minute.', 'ok');
      toast('Published — GitHub Pages will rebuild shortly.');
    }).catch(function (e) {
      setStatus('Save failed.', 'err');
      toast(e.message, true);
      btn.disabled = false;
      btn.classList.add('dirty');
    }).finally(function () {
      if (STATE.dirty) btn.textContent = 'Publish changes';
    });
  }

  // ---------- password-encrypted token vault ----------
  // The GitHub token never leaves this device. It's encrypted with a key
  // derived from your password (PBKDF2 -> AES-GCM) and the ciphertext is
  // the only thing stored in localStorage. Without the password, the
  // stored blob is useless. Nothing here is sent anywhere except the
  // decrypted token going straight to GitHub's own API.
  var PBKDF2_ITERATIONS = 150000;

  function bufToHex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }
  function hexToBuf(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    return bytes;
  }
  function deriveKey(password, saltBytes) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']).then(function (keyMaterial) {
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    });
  }
  function encryptToken(token, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(password, salt).then(function (key) {
      var enc = new TextEncoder();
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(token));
    }).then(function (ciphertext) {
      return { salt: bufToHex(salt), iv: bufToHex(iv), ciphertext: bufToHex(ciphertext) };
    });
  }
  function decryptToken(vault, password) {
    var salt = hexToBuf(vault.salt);
    var iv = hexToBuf(vault.iv);
    var ciphertext = hexToBuf(vault.ciphertext);
    return deriveKey(password, salt).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ciphertext);
    }).then(function (plainBuf) {
      return new TextDecoder().decode(plainBuf);
    });
    // AES-GCM's built-in auth tag makes decrypt() reject on a wrong
    // password, which is exactly how we detect that case below.
  }

  function getVault() {
    try {
      var raw = localStorage.getItem(VAULT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function saveVault(vault) {
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  }
  function clearVault() {
    localStorage.removeItem(VAULT_KEY);
  }

  var gate = {};

  function showSetupView() {
    gate.setupView.classList.remove('hidden');
    gate.unlockView.classList.add('hidden');
    gate.setupError.style.display = 'none';
  }
  function showUnlockView() {
    gate.unlockView.classList.remove('hidden');
    gate.setupView.classList.add('hidden');
    gate.unlockError.style.display = 'none';
    gate.unlockInput.value = '';
    gate.unlockInput.focus();
  }

  function handleSetupSubmit() {
    var errBox = gate.setupError;
    errBox.style.display = 'none';
    var owner = document.getElementById('sOwner').value.trim();
    var repo = document.getElementById('sRepo').value.trim();
    var branch = document.getElementById('sBranch').value.trim() || 'main';
    var token = document.getElementById('sToken').value.trim();
    var pass = document.getElementById('sPass').value;
    var pass2 = document.getElementById('sPass2').value;

    if (!owner || !repo || !token) {
      errBox.textContent = 'Fill in the username, repo name and token first.';
      errBox.style.display = 'block';
      return;
    }
    if (pass.length < 6) {
      errBox.textContent = 'Password must be at least 6 characters.';
      errBox.style.display = 'block';
      return;
    }
    if (pass !== pass2) {
      errBox.textContent = 'Passwords don’t match.';
      errBox.style.display = 'block';
      return;
    }

    STATE.owner = owner; STATE.repo = repo; STATE.branch = branch; STATE.token = token;

    var btn = document.getElementById('setupBtn');
    btn.disabled = true;
    btn.textContent = 'Connecting…';

    encryptToken(token, pass).then(function (enc) {
      return connectAndShow(errBox, function () {
        btn.disabled = false;
        btn.textContent = 'Save & connect';
      }).then(function () {
        saveVault({ owner: owner, repo: repo, branch: branch, salt: enc.salt, iv: enc.iv, ciphertext: enc.ciphertext });
      });
    }).catch(function () {
      // error already shown by connectAndShow; nothing saved
    }).finally(function () {
      if (btn.disabled) { btn.disabled = false; btn.textContent = 'Save & connect'; }
    });
  }

  function handleUnlockSubmit() {
    var errBox = gate.unlockError;
    errBox.style.display = 'none';
    var pass = gate.unlockInput.value;
    if (!pass) return;

    var vault = getVault();
    if (!vault) { showSetupView(); return; }

    var btn = gate.unlockBtn;
    btn.disabled = true;
    btn.textContent = 'Unlocking…';

    decryptToken(vault, pass).then(function (token) {
      STATE.owner = vault.owner; STATE.repo = vault.repo; STATE.branch = vault.branch; STATE.token = token;
      return connectAndShow(errBox, function () {
        // connection failed for a reason other than the password (e.g. token revoked)
      });
    }).catch(function (e) {
      // Web Crypto throws a generic OperationError on auth-tag mismatch,
      // i.e. wrong password — that's the common case here.
      if (!errBox.textContent || errBox.style.display !== 'block') {
        errBox.textContent = 'Wrong password.';
        errBox.style.display = 'block';
      }
      gate.unlockInput.value = '';
      gate.unlockInput.focus();
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = 'Unlock';
    });
  }

  function handleForgot() {
    var ok = window.confirm('This clears the encrypted token and password on this device. You’ll need to re-enter your GitHub token to set it up again. Continue?');
    if (!ok) return;
    clearVault();
    showSetupView();
  }

  function handleLockOut() {
    // Just reloads into the unlock screen; token stays encrypted at rest,
    // nothing decrypted is kept once the page state is gone.
    location.reload();
  }

  function initGate() {
    gate.setupView = document.getElementById('setupView');
    gate.unlockView = document.getElementById('unlockView');
    gate.setupError = document.getElementById('setupError');
    gate.unlockError = document.getElementById('unlockError');
    gate.unlockInput = document.getElementById('unlockInput');
    gate.unlockBtn = document.getElementById('unlockBtn');

    document.getElementById('setupBtn').addEventListener('click', handleSetupSubmit);
    gate.unlockBtn.addEventListener('click', handleUnlockSubmit);
    gate.unlockInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleUnlockSubmit();
    });
    document.getElementById('unlockForgot').addEventListener('click', function (e) {
      e.preventDefault();
      handleForgot();
    });
    document.getElementById('publishBtn').addEventListener('click', doPublish);
    document.getElementById('lockOutBtn').addEventListener('click', handleLockOut);

    window.addEventListener('beforeunload', function (e) {
      if (STATE.dirty) { e.preventDefault(); e.returnValue = ''; }
    });

    if (getVault()) showUnlockView();
    else showSetupView();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  initGate();
})();
