/* Núcleo: estado, conexión con la API, cola sin conexión, utilidades y lector de códigos. */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
  };
  const S = {
    session: store.get('alm.session', null), data: store.get('alm.data', null), queue: store.get('alm.queue', []),
    online: navigator.onLine, view: 'catalogo', lastSync: store.get('alm.sync', null), busy: false, authLost: false
  };
  const Alm = { S, store, cfg: CFG, render() {} };
  window.Alm = Alm;

  /* ---------- utilidades ---------- */
  Alm.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Alm.num = (n) => { if (n === '' || n == null || isNaN(n)) return '–'; return Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 }); };
  Alm.money = (n) => (n === '' || n == null || isNaN(n)) ? '–' : Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  Alm.date = (s) => { if (!s) return '–'; const d = new Date(s + 'T12:00:00'); return isNaN(d) ? s : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', ''); };
  Alm.uid = () => 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  Alm.today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  Alm.addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  Alm.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const TAGS = { 'SIN EXISTENCIA': 't-bad', 'BAJO MÍNIMO': 't-low', 'REORDENAR': 't-warn', 'EXCEDENTE': 't-info', 'EN PRÉSTAMO': 't-loan', 'OK': 't-ok',
    'VENCIDO': 't-bad', 'En préstamo': 't-loan', 'Atrasada': 't-bad' };
  Alm.tag = (e) => `<span class="tag ${TAGS[e] || 't-off'}">${Alm.esc(e)}</span>`;
  Alm.items = () => (S.data && S.data.items) || [];
  Alm.findItem = (txt) => {
    const t = String(txt || '').trim().toLowerCase();
    if (!t) return null;
    return Alm.items().find((i) => String(i.cod).toLowerCase() === t || (i.barras && String(i.barras).toLowerCase() === t) ||
      (i.no_parte && String(i.no_parte).toLowerCase() === t)) || null;
  };
  Alm.parseBadge = (txt) => { const m = String(txt || '').match(/\d{6,8}/); return m ? m[0] : ''; };
  Alm.person = (badge) => ((S.data && S.data.people) || []).find((p) => p.badge === String(badge)) || null;

  /* ---------- avisos ---------- */
  let toastT;
  Alm.toast = (msg, kind) => {
    document.querySelectorAll('.toast').forEach((n) => n.remove());
    const n = document.createElement('div');
    n.className = 'toast ' + (kind || ''); n.setAttribute('role', 'status'); n.textContent = msg;
    document.body.appendChild(n);
    clearTimeout(toastT); toastT = setTimeout(() => n.remove(), kind === 'bad' ? 6500 : 3500);
  };

  /* ---------- API ---------- */
  async function api(action, body) {
    const payload = Object.assign({ action, token: S.session && S.session.token }, body || {});
    if (CFG.API_URL === 'DEMO') return window.DemoServer.handle(payload);
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: ctl.signal, redirect: 'follow' });
      const txt = await r.text();
      try { return JSON.parse(txt); } catch (e) {
        const err = new Error('El servidor respondió algo que no es JSON (HTTP ' + r.status + '): ' + txt.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140) + ' | URL usada: ' + String(CFG.API_URL).slice(0, 70));
        err.name = 'BadResponse'; throw err;
      }
    } finally { clearTimeout(t); }
  }
  Alm.api = api;
  const isNet = (e) => !(e && (e.name === 'SyntaxError' || e.name === 'BadResponse'));

  Alm.login = async (badge, pin) => {
    const res = await api('login', { badge, pin });
    if (!res.ok) return res;
    S.session = { token: res.token, user: res.user };
    S.authLost = false;
    store.set('alm.session', S.session); store.set('alm.badge', badge);
    await Alm.refresh(true);
    Alm.processQueue();
    return res;
  };
  Alm.logout = () => { S.session = null; S.data = null; store.del('alm.session'); store.del('alm.data'); Alm.render(); };

  Alm.refresh = async (force) => {
    if (!S.session || !S.online || S.busy) return;
    if (!force && S.lastSync && Date.now() - S.lastSync < 20000) return;
    S.busy = true; Alm.render('soft');
    try {
      const res = await api('bootstrap');
      if (res.ok) { S.data = res; S.lastSync = Date.now(); store.set('alm.data', res); store.set('alm.sync', S.lastSync); S.session.user = res.user; }
      else if (res.code === 'AUTH') { S.authLost = true; Alm.toast(res.error, 'bad'); }
      else Alm.toast(res.error || 'No se pudo actualizar.', 'bad');
    } catch (e) {
      if (isNet(e)) { S.online = navigator.onLine; } else Alm.toast(e.message || 'El servidor respondió algo inesperado.', 'bad');
    }
    S.busy = false; Alm.render('soft');
  };

  /* ---------- fotos de artículos (viven en Drive, se guardan en el celular al verlas) ---------- */
  const FOTOS = 'alm-fotos', photoMem = {};
  const fkey = (cod, ts) => 'foto/' + encodeURIComponent(cod) + '?v=' + ts;
  async function putPhoto(cod, ts, data) {
    photoMem[fkey(cod, ts)] = data;
    try {
      if (!window.caches) return;
      const c = await caches.open(FOTOS);
      for (const k of await c.keys()) { if (k.url.includes('/foto/' + encodeURIComponent(cod) + '?')) await c.delete(k); }
      await c.put(fkey(cod, ts), new Response(data));
    } catch (e) { /* sin almacenamiento: se queda en memoria */ }
  }
  Alm.photo = async (cod, ts) => {
    const k = fkey(cod, ts);
    if (photoMem[k]) return photoMem[k];
    try { if (window.caches) { const hit = await (await caches.open(FOTOS)).match(k); if (hit) return (photoMem[k] = await hit.text()); } } catch (e) { /* sigue */ }
    if (!S.online) return null;
    const r = await api('photo_get', { cod });
    if (!r.ok) return null;
    await putPhoto(cod, r.ts, r.data);
    return r.data;
  };
  Alm.savePhoto = async (cod, data) => {
    const r = await api('photo_save', { cod, data });
    if (r.ok) {
      const it = Alm.items().find((x) => x.cod === cod);
      if (it) it.foto = r.ts;
      await putPhoto(cod, r.ts, data);
      store.set('alm.data', S.data);
    }
    return r;
  };
  /** Reduce la foto a 800 px y JPG para que pese ~80 KB y suba rápido. */
  Alm.shrinkImage = async (file, max) => {
    max = max || 800;
    let src, w, h, done = () => {};
    if (window.createImageBitmap) {
      try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = src.width; h = src.height; } catch (e) { src = null; }
    }
    if (!src) {
      const url = URL.createObjectURL(file);
      src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('No se pudo leer la imagen.')); im.src = url; });
      w = src.naturalWidth; h = src.naturalHeight; done = () => URL.revokeObjectURL(url);
    }
    const k = Math.min(1, max / Math.max(w, h));
    const cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(src, 0, 0, cv.width, cv.height);
    done();
    return cv.toDataURL('image/jpeg', 0.72);
  };

  /* ---------- cola sin conexión ---------- */
  const persistQ = () => store.set('alm.queue', S.queue);
  const ACTION = { movement: ['movement', 'op'], count: ['count', 'op'], item: ['item_save', 'item'] };
  Alm.enqueue = (kind, payload, label) => {
    S.queue.push({ id: payload.op_id, kind, payload, label, at: Date.now(), status: 'pendiente', error: '' });
    persistQ(); Alm.render('soft');
  };
  Alm.discard = (id) => { S.queue = S.queue.filter((q) => q.id !== id); persistQ(); Alm.render('soft'); };
  let running = false;
  Alm.processQueue = async () => {
    if (running || !S.session || !S.online) return { sent: 0 };
    running = true; let sent = 0;
    try {
      for (const q of S.queue.filter((x) => x.status === 'pendiente')) {
        const [action, key] = ACTION[q.kind];
        let res;
        try { res = await api(action, { [key]: q.payload }); } catch (e) { break; }
        if (res.ok) { S.queue = S.queue.filter((x) => x.id !== q.id); sent++; }
        else if (res.code === 'AUTH') { S.authLost = true; break; }
        else { q.status = 'rechazado'; q.error = res.error || 'Rechazado'; }
        persistQ();
      }
    } finally { running = false; }
    persistQ();
    if (sent) { Alm.toast(sent + (sent === 1 ? ' registro pendiente enviado' : ' registros pendientes enviados'), 'ok'); await Alm.refresh(true); }
    else if (S.queue.some((x) => x.status === 'rechazado')) { await Alm.refresh(true); }
    else Alm.render('soft');
    return { sent };
  };

  /* Efecto inmediato en la copia local para que el catálogo no muestre un saldo viejo; el servidor lo confirma al actualizar. */
  const EF = { 'Entrada - Proveedor': [1, 0], 'Entrada - Devolución de material no usado': [1, 0], 'Entrada - Devolución de préstamo': [1, -1], 'Entrada - Ajuste por conteo': [1, 0],
    'Entrada - Inventario inicial': [1, 0], 'Salida - Consumo / insumo': [-1, 0], 'Salida - Préstamo': [-1, 1], 'Salida - Baja / merma': [-1, 0], 'Salida - Ajuste por conteo': [-1, 0], 'Salida - Devolución a proveedor': [-1, 0] };
  function applyLocal(kind, o) {
    if (kind !== 'movement') return;
    const it = Alm.items().find((i) => i.cod === o.cod), ef = EF[o.tipo];
    if (!it || !ef) return;
    it.disp = Math.round((Number(it.disp) + ef[0] * o.cant) * 1000) / 1000; it.prest = Math.round((Number(it.prest) + ef[1] * o.cant) * 1000) / 1000;
    store.set('alm.data', S.data);
  }

  /** Envía una operación; si no hay conexión la deja en la cola. Devuelve {status:'sent'|'queued'|'rejected', res}. */
  Alm.submit = async (kind, payload, label) => {
    const [action, key] = ACTION[kind];
    if (!S.online) { Alm.enqueue(kind, payload, label); applyLocal(kind, payload); Alm.render('soft'); return { status: 'queued' }; }
    try {
      const res = await api(action, { [key]: payload });
      if (res.ok) { if (!res.duplicate) applyLocal(kind, payload); Alm.refresh(true); return { status: 'sent', res }; }
      if (res.code === 'AUTH') { S.authLost = true; Alm.enqueue(kind, payload, label); return { status: 'queued', auth: true }; }
      return { status: 'rejected', res };
    } catch (e) {
      if (isNet(e)) { Alm.enqueue(kind, payload, label); applyLocal(kind, payload); return { status: 'queued' }; }
      return { status: 'rejected', res: { error: 'El servidor respondió algo inesperado.' } };
    }
  };

  /* ---------- lector de códigos de barras (cámara) ---------- */
  Alm.scan = async (cb) => {
    if (!('BarcodeDetector' in window)) { Alm.toast('Este navegador no lee códigos con la cámara. Usa un lector USB o Bluetooth, o teclea el código.', 'bad'); return; }
    let stream, stop = false;
    const box = document.createElement('div');
    box.className = 'scan';
    box.innerHTML = '<video playsinline muted></video><div class="frame"></div><div class="bar"><div>Apunta al código de barras o QR</div><button class="btn" type="button">Cancelar</button></div>';
    document.body.appendChild(box);
    const close = () => { stop = true; if (stream) stream.getTracks().forEach((t) => t.stop()); box.remove(); };
    box.querySelector('button').onclick = close;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const v = box.querySelector('video'); v.srcObject = stream; await v.play();
      const det = new BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'itf', 'codabar', 'qr_code'] });
      const loop = async () => {
        if (stop) return;
        try { const r = await det.detect(v); if (r.length) { const val = r[0].rawValue; close(); cb(val); return; } } catch (e) { /* sigue intentando */ }
        setTimeout(loop, 200);
      };
      loop();
    } catch (e) { close(); Alm.toast('No se pudo abrir la cámara. Revisa el permiso del navegador.', 'bad'); }
  };

  /* ---------- eventos de conexión y arranque ---------- */
  window.addEventListener('online', () => { S.online = true; Alm.render('soft'); Alm.processQueue().then(() => Alm.refresh(true)); });
  window.addEventListener('offline', () => { S.online = false; Alm.render('soft'); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { Alm.refresh(); Alm.processQueue(); } });
  setInterval(() => { if (!document.hidden) { Alm.refresh(true); Alm.processQueue(); } }, CFG.REFRESH_MS || 180000);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { /* sin service worker */ });
})();
