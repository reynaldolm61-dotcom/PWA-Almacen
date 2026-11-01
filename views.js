/* Pantallas de la app. Sin dependencias: HTML por plantillas y delegación de eventos. */
(function () {
  'use strict';
  const { S, esc, num, money, date, tag, toast } = Alm;
  const root = document.getElementById('app');
  const RET = ['Herramienta', 'Llave', 'Equipo pesado'];
  const I = {
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3M14 9l2 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18v.01"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 9v6M11 9v6M15 9v6"/></svg>',
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>'
  };
  const DEFS = {
    in_prov: { tipo: 'Entrada - Proveedor', label: 'Recibir de proveedor', sub: 'Contra una orden de compra', cls: 'in', arrow: '↓', me: 'recibe', fields: ['oc', 'cod', 'cant', 'remision', 'lote', 'costo', 'condicion', 'obs'], req: ['oc', 'cod', 'cant', 'remision'] },
    out_cons: { tipo: 'Salida - Consumo / insumo', label: 'Entregar insumo', sub: 'Consumo para un trabajo u OT', cls: 'out', arrow: '↑', me: 'entrega', fields: ['cod', 'cant', 'recibe', 'area', 'ot', 'obs'], req: ['cod', 'cant', 'recibe'], need2: true },
    out_prest: { tipo: 'Salida - Préstamo', label: 'Prestar', sub: 'Herramienta, llave o equipo pesado', cls: 'loan', arrow: '⇄', me: 'entrega', fields: ['cod', 'cant', 'recibe', 'area', 'compromiso', 'condicion', 'horo', 'obs'], req: ['cod', 'cant', 'recibe', 'compromiso'], need2: true },
    in_devprest: { tipo: 'Entrada - Devolución de préstamo', label: 'Recibir devolución', sub: 'Regresa un préstamo', cls: 'loan', arrow: '⇄', me: 'recibe', fields: ['prestamo', 'cod', 'cant', 'entrega', 'condicion', 'horo', 'obs'], req: ['prestamo', 'cod', 'cant', 'entrega'], need2: true },
    in_noused: { tipo: 'Entrada - Devolución de material no usado', label: 'Material no usado', sub: 'Regresa al almacén sin usarse', cls: 'in', arrow: '↓', me: 'recibe', fields: ['cod', 'cant', 'entrega', 'ot', 'obs'], req: ['cod', 'cant', 'entrega'], need2: true },
    out_baja: { tipo: 'Salida - Baja / merma', label: 'Baja o merma', sub: 'Dañado, vencido o perdido', cls: 'out', arrow: '↑', me: 'recibe', fields: ['cod', 'cant', 'obs'], req: ['cod', 'cant', 'obs'] },
    out_prov: { tipo: 'Salida - Devolución a proveedor', label: 'Devolver a proveedor', sub: 'Garantía o error de surtido', cls: 'out', arrow: '↑', me: 'recibe', fields: ['cod', 'cant', 'oc', 'remision', 'obs'], req: ['cod', 'cant', 'remision'] },
    adj_in: { tipo: 'Entrada - Ajuste por conteo', label: 'Ajuste por conteo (+)', sub: 'Sobra material', cls: 'in', arrow: '↓', me: 'recibe', fields: ['cod', 'cant', 'obs'], req: ['cod', 'cant', 'obs'] },
    adj_out: { tipo: 'Salida - Ajuste por conteo', label: 'Ajuste por conteo (−)', sub: 'Falta material', cls: 'out', arrow: '↑', me: 'recibe', fields: ['cod', 'cant', 'obs'], req: ['cod', 'cant', 'obs'] },
    init: { tipo: 'Entrada - Inventario inicial', label: 'Inventario inicial', sub: 'Alta de existencias', cls: 'in', arrow: '↓', me: 'recibe', fields: ['cod', 'cant', 'obs'], req: ['cod', 'cant'] }
  };
  const MAIN_DEFS = ['in_prov', 'out_cons', 'out_prest', 'in_devprest', 'in_noused'];
  const MORE_DEFS = ['out_baja', 'out_prov', 'adj_in', 'adj_out', 'init'];
  const LABEL = { cod: 'Artículo (escanea o teclea el código)', cant: 'Cantidad', oc: 'Orden de compra', remision: 'Remisión o factura', lote: 'Lote o serie (opcional)', costo: 'Costo unitario real (opcional)',
    recibe: 'Quién recibe (badge)', entrega: 'Quién entrega (badge)', area: 'Área o destino', ot: 'Folio de la OT (opcional)', compromiso: 'Fecha compromiso de devolución', condicion: 'Condición del artículo',
    horo: 'Horómetro o lectura (opcional)', prestamo: 'Préstamo que se devuelve', obs: 'Observaciones' };
  const FORMS = { move: null, count: null, item: null };
  const ui = { q: '', chip: 'todos' };
  const canWrite = () => !!(S.session && S.session.user && S.session.user.canWrite);
  const me = () => S.session && S.session.user;

  /* ---------- componentes de formulario ---------- */
  const fv = (f, n) => (FORMS[f] && FORMS[f].vals[n] != null ? FORMS[f].vals[n] : '');
  const err = (f, n) => `<div class="err" data-err="${f}.${n}">${esc((FORMS[f].errs || {})[n] || '')}</div>`;
  function input(f, n, label, o) {
    o = o || {};
    return `<label class="f"><span>${esc(label)}${o.req ? ' *' : ''}</span><input data-form="${f}" data-f="${n}" type="${o.type || 'text'}" value="${esc(fv(f, n))}" placeholder="${esc(o.ph || '')}" ${o.attrs || ''} autocomplete="off">${o.hint || ''}${err(f, n)}</label>`;
  }
  function select(f, n, label, opts, o) {
    o = o || {};
    const cur = String(fv(f, n));
    const list = opts.map((x) => (Array.isArray(x) ? x : [x, x]));
    return `<label class="f"><span>${esc(label)}${o.req ? ' *' : ''}</span><select data-form="${f}" data-f="${n}"><option value="">${esc(o.ph || 'Elige…')}</option>${list.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === cur ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>${err(f, n)}</label>`;
  }
  function personField(f, n, label, req) {
    const b = Alm.parseBadge(fv(f, n));
    const p = b && Alm.person(b);
    return `<label class="f"><span>${esc(label)}${req ? ' *' : ''}</span><input data-form="${f}" data-f="${n}" data-who="1" list="people-list" inputmode="numeric" value="${esc(fv(f, n))}" placeholder="Escanea el gafete o teclea el badge" autocomplete="off">
      <div class="small muted" data-hint="${f}.${n}">${p ? '✓ ' + esc(p.nombre) : ''}</div>${err(f, n)}</label>`;
  }
  const peopleList = () => `<datalist id="people-list">${((S.data && S.data.people) || []).map((p) => `<option value="${esc(p.badge)}">${esc(p.nombre)}</option>`).join('')}</datalist>`;

  function sheet(html) {
    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
    scrim.addEventListener('click', (e) => { if (e.target === scrim) scrim.remove(); });
    document.body.appendChild(scrim);
    return { el: scrim.firstElementChild, close: () => scrim.remove() };
  }
  const closeSheets = () => document.querySelectorAll('.scrim').forEach((n) => n.remove());

  /* ---------- armazón ---------- */
  function ago() { if (!S.lastSync) return 'Sin datos'; const m = Math.round((Date.now() - S.lastSync) / 60000); return m < 1 ? 'Actualizado ahora' : 'Actualizado hace ' + m + ' min'; }
  function nPend() { return S.queue.filter((q) => q.status === 'pendiente').length; }
  function nBad() { return S.queue.filter((q) => q.status === 'rechazado').length; }
  function headerHtml() {
    const u = me();
    const pend = nPend() + nBad();
    return `<h1>Almacén</h1>
      <button class="pill ${S.online ? '' : 'off'}" data-act="pendientes" aria-label="Estado de conexión y pendientes"><i class="dot"></i>${S.online ? 'En línea' : 'Sin conexión'}${pend ? ' · ' + pend + ' pend.' : ''}</button>
      <button class="iconbtn" data-act="refresh" aria-label="Actualizar" ${S.busy ? 'disabled' : ''}>${I.refresh}</button>
      <div class="who">${u ? esc(u.nombre) + '<br>' + esc(u.rol) : ''}</div>`;
  }
  const NAV = [['catalogo', 'Catálogo', I.box], ['mover', 'Mover', I.swap], ['prestamos', 'Préstamos', I.key], ['faltantes', 'Faltantes', I.alert], ['mas', 'Más', I.more]];
  function navHtml() {
    const bad = S.data ? (S.data.loans || []).filter((l) => l.estado_prest === 'VENCIDO').length : 0;
    return NAV.map(([k, t, ic]) => `<button data-act="nav" data-v="${k}" ${S.view === k ? 'aria-current="page"' : ''}>${ic}${t}${k === 'prestamos' && bad ? `<span class="count">${bad}</span>` : ''}${k === 'mas' && nBad() ? '<span class="count">!</span>' : ''}</button>`).join('');
  }

  Alm.render = function (mode) {
    if (!S.session || S.authLost) return renderLogin();
    if (!document.getElementById('shell')) {
      root.innerHTML = '<header class="top" id="top"></header><main id="main"></main><nav id="nav" aria-label="Secciones"></nav>';
      root.firstElementChild.id = 'top';
      root.insertAdjacentHTML('afterbegin', '<div id="shell" hidden></div>');
      mode = 'full';
    }
    document.getElementById('top').innerHTML = headerHtml();
    document.getElementById('top').className = 'top' + (S.online ? '' : ' off');
    document.getElementById('nav').innerHTML = navHtml();
    if (mode === 'soft') {
      if (S.view === 'catalogo') refreshCatalog();
      else if (S.view === 'prestamos') viewPrestamos();
      else if (S.view === 'faltantes') viewFaltantes();
      else if (S.view === 'mas') viewMas();
      return;
    }
    ({ catalogo: viewCatalogo, mover: viewMover, prestamos: viewPrestamos, faltantes: viewFaltantes, mas: viewMas })[S.view]();
    window.scrollTo(0, 0);
  };
  const main = () => document.getElementById('main');

  function renderLogin() {
    const badge = Alm.store.get('alm.badge', '');
    root.innerHTML = `<div class="login"><div class="logo">${I.logo}</div><h2>Almacén</h2>
      <p class="muted">${S.authLost ? 'Tu sesión venció. Entra de nuevo; lo que dejaste pendiente se enviará al entrar.' : 'Entra con tu badge y tu PIN.'}</p>
      <label class="f"><span>Badge</span><input id="lg-badge" inputmode="numeric" autocomplete="username" value="${esc(badge)}" placeholder="6 u 8 dígitos"></label>
      <label class="f"><span>PIN</span><input id="lg-pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="4 a 6 dígitos"><div class="err" id="lg-err"></div></label>
      <button class="btn primary block" id="lg-go">Entrar</button>
      ${Alm.cfg.API_URL === 'DEMO' ? '<p class="small muted" style="margin-top:16px">Modo demostración: datos de ejemplo guardados en este navegador. Badge 100001 (almacenista), 100002 (supervisor) o 20000001 (solo consulta). PIN 1234.</p>' : ''}
      ${S.queue.length ? `<p class="small muted">Registros pendientes en este dispositivo: ${S.queue.length}</p>` : ''}</div>`;
    const go = async () => {
      const b = document.getElementById('lg-badge').value.trim(), p = document.getElementById('lg-pin').value.trim(), e = document.getElementById('lg-err'), btn = document.getElementById('lg-go');
      e.textContent = ''; btn.disabled = true; btn.textContent = 'Entrando…';
      try { const r = await Alm.login(b, p); if (!r.ok) e.textContent = r.error; else { S.view = 'catalogo'; Alm.render(); } }
      catch (x) { e.textContent = S.online ? 'No se pudo conectar con el servidor.' : 'Sin conexión: necesitas red para entrar la primera vez.'; }
      btn.disabled = false; btn.textContent = 'Entrar';
    };
    document.getElementById('lg-go').onclick = go;
    document.getElementById('lg-pin').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  }

  /* ---------- catálogo ---------- */
  const FALTAN = ['SIN EXISTENCIA', 'BAJO MÍNIMO', 'REORDENAR'];
  function filterItems() {
    const words = ui.q.toLowerCase().split(/\s+/).filter(Boolean);
    return Alm.items().filter((i) => {
      if (i.activo === 'No') return false;
      if (ui.chip === 'faltan' && !FALTAN.includes(i.estado)) return false;
      if (ui.chip === 'prestados' && !(i.prest > 0)) return false;
      if (ui.chip === 'excedente' && i.estado !== 'EXCEDENTE') return false;
      if (ui.chip === 'equipos' && !RET.includes(i.tipo)) return false;
      const hay = [i.cod, i.desc, i.ubic, i.categoria, i.no_parte, i.fabricante, i.barras, i.aplica].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  function cardItem(i) {
    return `<div class="card tap" data-act="item" data-cod="${esc(i.cod)}"><div class="row">
      <div class="grow"><div class="title">${esc(i.desc)}</div><div class="code">${esc(i.cod)} · ${esc(i.ubic || 'sin ubicación')}</div>
      <div class="row" style="margin-top:8px;gap:6px"><span class="crit ${esc(i.crit)}" title="Criticidad ${esc(i.crit)}">${esc(i.crit)}</span>${tag(i.estado)}${i.prest > 0 ? `<span class="small muted">prestado ${num(i.prest)}</span>` : ''}</div></div>
      <div style="text-align:right"><div class="big num">${num(i.disp)}</div><div class="small muted">${esc(i.unidad)}</div></div></div></div>`;
  }
  function viewCatalogo() {
    main().innerHTML = `<div class="search"><input id="q" type="search" inputmode="search" placeholder="Código, descripción o ubicación" autocomplete="off" value="${esc(ui.q)}" aria-label="Buscar en el catálogo"><button class="btn" data-act="scanq" aria-label="Escanear código">${I.scan}</button></div>
      <div class="chips" id="chips"></div><div id="list"></div><p class="sync" id="sync"></p>`;
    refreshCatalog();
  }
  function refreshCatalog() {
    if (!document.getElementById('list')) return;
    const all = Alm.items().filter((i) => i.activo !== 'No');
    const cnt = { todos: all.length, faltan: all.filter((i) => FALTAN.includes(i.estado)).length, prestados: all.filter((i) => i.prest > 0).length,
      excedente: all.filter((i) => i.estado === 'EXCEDENTE').length, equipos: all.filter((i) => RET.includes(i.tipo)).length };
    const labels = { todos: 'Todos', faltan: 'Faltan', prestados: 'Prestados', excedente: 'Excedente', equipos: 'Herramienta y equipos' };
    document.getElementById('chips').innerHTML = Object.keys(labels).map((k) => `<button class="chip" data-act="chip" data-k="${k}" aria-pressed="${ui.chip === k}">${labels[k]} · ${cnt[k]}</button>`).join('');
    const items = filterItems();
    document.getElementById('list').innerHTML = !S.data ? '<div class="empty">Sin datos todavía. Conéctate para descargar el catálogo.</div>'
      : items.length ? items.map(cardItem).join('') : '<div class="empty">No hay artículos con ese filtro.</div>';
    document.getElementById('sync').textContent = ago() + (S.online ? '' : ' · sin conexión, mostrando la última copia');
  }
  function openItem(cod) {
    const i = Alm.items().find((x) => x.cod === cod);
    if (!i) return;
    const top = Math.max(1, i.max, i.rop, i.disp) * 1.15, pos = (v) => Math.min(100, (v / top) * 100).toFixed(1) + '%';
    const hist = ((S.data && S.data.recent) || []).filter((m) => m.cod === cod).slice(0, 5);
    const sh = sheet(`<div class="row between"><div class="grow"><h2 style="margin:0">${esc(i.desc)}</h2><div class="code">${esc(i.cod)} · ${esc(i.tipo)}</div></div><div>${tag(i.estado)}</div></div>
      ${i.max > 0 || i.min > 0 ? `<div class="gauge" style="margin-top:30px" aria-label="Existencia contra mínimo, reorden y máximo"><b style="width:${pos(i.disp)}"></b><i style="left:${pos(i.min)}" data-l="mín ${num(i.min)}"></i><i class="up" style="left:${pos(i.rop)}" data-l="reorden ${num(i.rop)}"></i><i style="left:${pos(i.max)}" data-l="máx ${num(i.max)}"></i></div>` : '<div style="height:12px"></div>'}
      <div class="card"><dl>
        <dt>Disponible</dt><dd><b class="num">${num(i.disp)} ${esc(i.unidad)}</b>${i.prest > 0 ? ` · prestado ${num(i.prest)}` : ''}</dd>
        <dt>Ubicación</dt><dd>${esc(i.ubic || '–')}</dd><dt>Categoría</dt><dd>${esc(i.categoria || '–')}</dd>
        <dt>Criticidad</dt><dd><span class="crit ${esc(i.crit)}">${esc(i.crit)}</span></dd>
        <dt>En tránsito</dt><dd>${num(i.pend)}</dd><dt>A pedir</dt><dd>${i.sugerido > 0 ? '<b>' + num(i.sugerido) + '</b>' : '–'}</dd>
        <dt>Cobertura</dt><dd>${i.cobertura !== '' && i.cobertura != null ? num(i.cobertura) + ' días' : '–'}</dd><dt>Entrega</dt><dd>${num(i.lead)} días</dd>
        <dt>Proveedor</dt><dd>${esc(i.prov || '–')}</dd><dt>Costo</dt><dd>${money(i.costo)}</dd>
        <dt>No. de parte</dt><dd>${esc(i.no_parte || '–')}</dd><dt>Aplica a</dt><dd>${esc(i.aplica || '–')}</dd>${i.obs ? `<dt>Notas</dt><dd>${esc(i.obs)}</dd>` : ''}</dl>
        ${/^https?:\/\//.test(i.enlace || '') ? `<p><a class="btn sm" href="${esc(i.enlace)}" target="_blank" rel="noopener">Ver imagen o ficha técnica</a></p>` : ''}</div>
      ${hist.length ? '<h3>Últimos movimientos</h3>' + hist.map((m) => `<div class="card small"><b>${esc(m.tipo)}</b> · ${num(m.cant)} ${esc(i.unidad)}<br><span class="muted">${date(m.fecha)} · ${esc(m.entrega || '–')} → ${esc(m.recibe || '–')}</span></div>`).join('') : ''}
      ${canWrite() ? `<div class="row" style="margin-top:6px"><button class="btn primary grow" data-act="mv-item" data-cod="${esc(i.cod)}">Registrar movimiento</button><button class="btn" data-act="edit-item" data-cod="${esc(i.cod)}">Editar</button></div>
        <button class="btn block" style="margin-top:8px" data-act="count-item" data-cod="${esc(i.cod)}">Contar este artículo</button>` : ''}
      <button class="btn block" style="margin-top:8px" data-act="close">Cerrar</button>`);
    return sh;
  }

  /* ---------- mover ---------- */
  function startMove(key, prefill) {
    const d = DEFS[key];
    FORMS.move = { key, def: d, vals: Object.assign({}, key === 'out_prest' ? { compromiso: Alm.addDays(1) } : {}, prefill || {}), errs: {}, op_id: Alm.uid() };
    S.view = 'mover'; Alm.render();
  }
  function typeCard(k) { const d = DEFS[k]; return `<button class="type ${d.cls}" data-act="start" data-k="${k}"><span class="arrow">${d.arrow}</span><b>${esc(d.label)}</b><small>${esc(d.sub)}</small></button>`; }
  function viewMover() {
    if (!canWrite()) { main().innerHTML = '<h2>Mover</h2><div class="card">Tu rol es de solo consulta: puedes ver el catálogo, los préstamos y los faltantes, pero no registrar movimientos.</div>'; return; }
    if (!FORMS.move) {
      main().innerHTML = `<h2>¿Qué vas a hacer?</h2><div class="types">${MAIN_DEFS.map(typeCard).join('')}</div>
        <h3>Ajustes y bajas</h3><div class="types">${MORE_DEFS.map(typeCard).join('')}</div>`;
      return;
    }
    const m = FORMS.move, d = m.def;
    const it = Alm.findItem(fv('move', 'cod'));
    const fields = d.fields.map((n) => {
      if (n === 'cod') return input('move', 'cod', LABEL.cod, { req: 1, ph: 'MAT-00001', attrs: 'data-live="1" autocapitalize="characters"', hint: '<div id="info-cod"></div>' }).replace('</label>', `</label>`)
        .replace('<input', '<div class="row"><input').replace('autocomplete="off">', `autocomplete="off" style="flex:1"><button type="button" class="btn" data-act="scanf" aria-label="Escanear">${I.scan}</button></div>`);
      if (n === 'cant') return `<label class="f"><span>${LABEL.cant} * <b id="unit" class="muted">${it ? '(' + esc(it.unidad) + ')' : ''}</b></span><div class="stepper"><button type="button" class="btn" data-act="step" data-d="-1" aria-label="Menos">−</button><input data-form="move" data-f="cant" type="number" inputmode="decimal" min="0" step="any" value="${esc(fv('move', 'cant'))}" placeholder="0"><button type="button" class="btn" data-act="step" data-d="1" aria-label="Más">+</button></div>${err('move', 'cant')}</label>`;
      if (n === 'oc') return select('move', 'oc', LABEL.oc, ocOptions(it), { req: d.req.includes('oc'), ph: 'Elige la orden de compra' });
      if (n === 'prestamo') return select('move', 'prestamo', LABEL.prestamo, loanOptions(it), { req: 1, ph: 'Elige el préstamo' });
      if (n === 'recibe' || n === 'entrega') return personField('move', n, LABEL[n], d.req.includes(n));
      if (n === 'area') return select('move', 'area', LABEL.area, (S.data.lists || {}).areas || [], {});
      if (n === 'condicion') return select('move', 'condicion', LABEL.condicion, (S.data.lists || {}).condiciones || [], {});
      if (n === 'compromiso') return input('move', 'compromiso', LABEL.compromiso, { type: 'date', req: 1, attrs: `min="${Alm.today()}"` });
      if (n === 'obs') return `<label class="f"><span>${LABEL.obs}${d.req.includes('obs') ? ' *' : ''}</span><textarea data-form="move" data-f="obs">${esc(fv('move', 'obs'))}</textarea>${err('move', 'obs')}</label>`;
      if (n === 'horo') return `<div id="horo-wrap" ${it && it.tipo === 'Equipo pesado' ? '' : 'hidden'}>${input('move', 'horo', LABEL.horo, {})}</div>`;
      if (n === 'costo') return input('move', 'costo', LABEL.costo, { type: 'number', attrs: 'inputmode="decimal" step="any" min="0"' });
      return input('move', n, LABEL[n], { req: d.req.includes(n) });
    }).join('');
    main().innerHTML = `<button class="btn sm" data-act="back" style="margin-bottom:10px">← Cambiar tipo</button><h2>${esc(d.label)}</h2>${peopleList()}${fields}
      <div class="small muted" style="margin:-4px 0 12px">${d.me === 'entrega' ? 'Entrega: ' : 'Recibe: '}${esc(me().nombre)} (tú)</div>
      <button class="btn primary block" data-act="review">Revisar y registrar</button>`;
    updateCodInfo();
  }
  function ocOptions(it) {
    return ((S.data && S.data.pos) || []).filter((p) => !it || p.cod === it.cod || !fv('move', 'cod')).map((p) => [p.folio, `${p.folio} · ${p.cod} · ${p.prov || ''} · pendiente ${num(p.pendiente)}${p.estado === 'Atrasada' ? ' (atrasada)' : ''}`]);
  }
  function loanOptions(it) {
    return ((S.data && S.data.loans) || []).filter((l) => !it || l.cod === it.cod || !fv('move', 'cod')).map((l) => [l.folio, `${l.folio} · ${l.desc} · ${l.recibe} · desde ${date(l.fecha)}${l.estado_prest === 'VENCIDO' ? ' (vencido)' : ''}`]);
  }
  function updateCodInfo() {
    const box = document.getElementById('info-cod');
    if (!box) return;
    const raw = fv('move', 'cod'), it = Alm.findItem(raw);
    if (it) { box.className = 'found'; box.innerHTML = `<b>${esc(it.desc)}</b><br>Disponible ${num(it.disp)} ${esc(it.unidad)}${it.prest > 0 ? ' · prestado ' + num(it.prest) : ''} · ${esc(it.ubic || 'sin ubicación')} · ${tag(it.estado)}`; }
    else if (raw.length >= 3) { box.className = 'found bad'; box.textContent = 'No se encontró ese código en el catálogo.'; }
    else { box.className = ''; box.textContent = ''; }
    const u = document.getElementById('unit'); if (u) u.textContent = it ? '(' + it.unidad + ')' : '';
    const hw = document.getElementById('horo-wrap'); if (hw) hw.hidden = !(it && it.tipo === 'Equipo pesado');
  }
  function refreshDependent() {
    const it = Alm.findItem(fv('move', 'cod'));
    const set = (n, opts, ph) => { const s = document.querySelector(`select[data-f="${n}"]`); if (!s) return; const cur = fv('move', n); s.innerHTML = `<option value="">${ph}</option>` + opts.map(([v, t]) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(t)}</option>`).join(''); };
    set('oc', ocOptions(it), 'Elige la orden de compra'); set('prestamo', loanOptions(it), 'Elige el préstamo');
  }
  function setVal(form, n, v) { FORMS[form].vals[n] = v; const el = document.querySelector(`[data-form="${form}"][data-f="${n}"]`); if (el) el.value = v; }
  function onInput(el) {
    const f = el.dataset.form, n = el.dataset.f;
    FORMS[f].vals[n] = el.value;
    const e = document.querySelector(`[data-err="${f}.${n}"]`); if (e) e.textContent = '';
    if (el.dataset.who) { const b = Alm.parseBadge(el.value), p = b && Alm.person(b), h = document.querySelector(`[data-hint="${f}.${n}"]`); if (h) h.textContent = p ? '✓ ' + p.nombre : ''; }
    if (f === 'move') {
      if (n === 'cod') { updateCodInfo(); refreshDependent(); }
      if (n === 'oc') { const p = ((S.data && S.data.pos) || []).find((x) => x.folio === el.value); if (p) { setVal('move', 'cod', p.cod); if (!fv('move', 'cant')) setVal('move', 'cant', p.pendiente); updateCodInfo(); } }
      if (n === 'prestamo') {
        const l = ((S.data && S.data.loans) || []).find((x) => x.folio === el.value);
        if (l) { setVal('move', 'cod', l.cod); setVal('move', 'cant', Number(l.cant) - Number(l.devuelto || 0)); const p = ((S.data && S.data.people) || []).find((x) => x.nombre === l.recibe); if (p) { setVal('move', 'entrega', p.badge); const h = document.querySelector('[data-hint="move.entrega"]'); if (h) h.textContent = '✓ ' + p.nombre; } updateCodInfo(); }
      }
    }
  }
  function validateMove() {
    const m = FORMS.move, d = m.def, v = m.vals, e = {};
    const it = Alm.findItem(v.cod);
    if (d.req.includes('cod') && !it) e.cod = v.cod ? 'Ese código no está en el catálogo.' : 'Falta el código.';
    if (!(Number(v.cant) > 0)) e.cant = 'La cantidad debe ser mayor que 0.';
    else if (it && d.tipo.startsWith('Salida') && Number(v.cant) > Number(it.disp) && d.tipo !== 'Salida - Ajuste por conteo') e.cant = `Solo hay ${num(it.disp)} ${it.unidad} disponibles.`;
    ['oc', 'remision', 'compromiso', 'obs', 'prestamo'].forEach((n) => { if (d.req.includes(n) && !String(v[n] || '').trim()) e[n] = 'Este dato es obligatorio.'; });
    ['recibe', 'entrega'].forEach((n) => {
      if (!d.fields.includes(n)) return;
      const b = Alm.parseBadge(v[n]);
      if (d.req.includes(n) && !b) e[n] = 'Captura el badge.';
      else if (b && !Alm.person(b)) e[n] = 'Ese badge no está registrado.';
      else if (b && b === me().badge) e[n] = 'No puedes ser tú mismo la otra parte.';
    });
    if (d.tipo === 'Salida - Consumo / insumo' && it && RET.includes(it.tipo)) e.cod = 'Herramienta, llave o equipo debe salir como préstamo.';
    if (d.tipo === 'Salida - Préstamo' && it && !RET.includes(it.tipo)) e.cod = 'Solo herramienta, llaves y equipos se prestan. Un insumo se entrega como consumo.';
    m.errs = e;
    return e;
  }
  function payloadMove() {
    const m = FORMS.move, d = m.def, v = m.vals, it = Alm.findItem(v.cod), B = me().badge;
    const o = { op_id: m.op_id, tipo: d.tipo, cod: it.cod, cant: Number(v.cant), obs: v.obs || '' };
    ['area', 'ot', 'oc', 'remision', 'lote', 'costo', 'compromiso', 'condicion', 'horo'].forEach((n) => { if (d.fields.includes(n) && v[n] !== '' && v[n] != null) o[n] = v[n]; });
    if (d.fields.includes('prestamo')) o.folio_prest = v.prestamo;
    if (d.me === 'entrega') { o.entrega = B; o.recibe = Alm.parseBadge(v.recibe); } else { o.recibe = B; if (d.fields.includes('entrega')) o.entrega = Alm.parseBadge(v.entrega); }
    return o;
  }
  function review() {
    const e = validateMove();
    if (Object.keys(e).length) {
      Object.keys(e).forEach((n) => { const el = document.querySelector(`[data-err="move.${n}"]`); if (el) el.textContent = e[n]; });
      const first = document.querySelector(`[data-err="move.${Object.keys(e)[0]}"]`); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      toast('Revisa los datos marcados.', 'bad'); return;
    }
    const m = FORMS.move, o = payloadMove(), it = Alm.findItem(o.cod), P = (b) => (Alm.person(b) || {}).nombre || b;
    const sh = sheet(`<h2 style="margin-top:0">Confirma el movimiento</h2><div class="card"><dl>
      <dt>Movimiento</dt><dd><b>${esc(o.tipo)}</b></dd><dt>Artículo</dt><dd>${esc(it.desc)}<br><span class="code">${esc(it.cod)}</span></dd>
      <dt>Cantidad</dt><dd><b class="num">${num(o.cant)} ${esc(it.unidad)}</b></dd>
      ${o.entrega ? `<dt>Entrega</dt><dd>${esc(P(o.entrega))}</dd>` : ''}<dt>Recibe</dt><dd>${esc(P(o.recibe))}</dd>
      ${o.oc ? `<dt>OC</dt><dd>${esc(o.oc)}</dd>` : ''}${o.remision ? `<dt>Remisión</dt><dd>${esc(o.remision)}</dd>` : ''}${o.folio_prest ? `<dt>Préstamo</dt><dd>${esc(o.folio_prest)}</dd>` : ''}
      ${o.compromiso ? `<dt>Devolver el</dt><dd>${date(o.compromiso)}</dd>` : ''}${o.obs ? `<dt>Notas</dt><dd>${esc(o.obs)}</dd>` : ''}</dl></div>
      <div class="err" id="cf-err" style="color:var(--bad);font-weight:700;margin-bottom:8px"></div>
      <div class="row"><button class="btn grow" data-act="close">Volver</button><button class="btn primary grow" id="cf-go">Registrar</button></div>`);
    sh.el.querySelector('#cf-go').onclick = async (ev) => {
      const btn = ev.currentTarget; btn.disabled = true; btn.textContent = 'Registrando…';
      const r = await Alm.submit('movement', o, `${o.tipo}: ${o.cant} × ${it.cod}`);
      if (r.status === 'rejected') { sh.el.querySelector('#cf-err').textContent = r.res.error || 'El servidor rechazó el movimiento.'; btn.disabled = false; btn.textContent = 'Registrar'; return; }
      sh.close();
      if (r.status === 'sent' && m.vals.cnt_folio && r.res.folio) Alm.api('count_link', { cnt: m.vals.cnt_folio, mov: r.res.folio }).catch(() => {});
      done(r, it, o);
    };
  }
  function done(r, it, o) {
    const queued = r.status === 'queued';
    FORMS.move = null;
    const sh = sheet(`<div style="text-align:center;padding:10px 0 6px"><div class="big" style="font-size:44px;color:${queued ? 'var(--warn)' : 'var(--ok)'}">${queued ? '⏳' : '✓'}</div>
      <h2>${queued ? 'Guardado en este dispositivo' : 'Registrado'}</h2>
      ${queued ? '<p class="muted">No hay conexión con el servidor. Se enviará solo cuando vuelva; no lo captures otra vez.</p>' : `<p><b>${esc(r.res.folio || '')}</b>${r.res.duplicate ? ' (ya estaba registrado)' : ''}</p><p class="muted">${esc(it.desc)}: ${r.res.saldo != null && r.res.saldo !== '' ? 'quedan ' + num(r.res.saldo) + ' ' + esc(it.unidad) + ' disponibles' : 'movimiento guardado'}</p>`}</div>
      <button class="btn primary block" data-act="again">Otro movimiento</button><button class="btn block" style="margin-top:8px" data-act="to-cat">Ver catálogo</button>`);
    return sh;
  }

  /* ---------- préstamos y faltantes ---------- */
  function viewPrestamos() {
    const loans = ((S.data && S.data.loans) || []).slice().sort((a, b) => (b.estado_prest === 'VENCIDO') - (a.estado_prest === 'VENCIDO') || String(a.compromiso).localeCompare(String(b.compromiso)));
    main().innerHTML = `<h2>Préstamos abiertos <span class="muted">(${loans.length})</span></h2>` + (loans.length ? loans.map((l) => `<div class="card"><div class="row between"><div class="grow"><div class="title">${esc(l.desc)}</div><div class="code">${esc(l.folio)} · ${esc(l.cod)}</div></div>${tag(l.estado_prest)}</div>
      <div class="small" style="margin-top:8px"><b>Lo tiene:</b> ${esc(l.recibe || '–')}${l.area ? ' · ' + esc(l.area) : ''}<br><span class="muted">Salió ${date(l.fecha)} · debe volver ${date(l.compromiso)}${l.dias !== '' && l.dias != null ? ' · ' + num(l.dias) + ' días fuera' : ''}</span></div>
      ${canWrite() ? `<button class="btn sm" style="margin-top:10px" data-act="devolver" data-folio="${esc(l.folio)}">Registrar devolución</button>` : ''}</div>`).join('') : '<div class="empty">No hay préstamos abiertos.</div>') + `<p class="sync">${ago()}</p>`;
  }
  function viewFaltantes() {
    const f = (S.data && S.data.shortages) || [];
    const total = f.reduce((a, x) => a + (Number(x.repos) || 0), 0);
    main().innerHTML = `<h2>Faltantes <span class="muted">(${f.length})</span></h2>
      ${f.length ? `<div class="row between" style="margin-bottom:10px"><div class="small muted">Costo estimado de reposición<br><b class="num" style="font-size:18px;color:var(--ink)">${money(total)}</b></div><button class="btn sm" data-act="copy-short">Copiar lista</button></div>` : ''}` +
      (f.length ? f.map((x) => `<div class="card"><div class="row"><div class="grow"><div class="title">${esc(x.desc)}</div><div class="code">${esc(x.cod)}</div><div class="row" style="margin-top:6px;gap:6px"><span class="crit ${esc(x.crit)}">${esc(x.crit)}</span>${tag(x.estado)}</div></div>
        <div style="text-align:right"><div class="small muted">pedir</div><div class="big num">${num(x.sugerido)}</div><div class="small muted">${esc(x.unidad)}</div></div></div>
        <div class="small muted" style="margin-top:8px">Hay ${num(x.disp)} · en tránsito ${num(x.pend)} · entrega ${num(x.lead)} días · ${money(x.repos)}</div>
        ${x.prov ? `<div class="small" style="margin-top:6px"><b>${esc(x.prov)}</b>${x.contacto ? ' · ' + esc(x.contacto) : ''}</div><div class="row" style="margin-top:6px;gap:8px">${x.tel ? `<a class="btn sm" href="tel:${esc(String(x.tel).replace(/[^\d+]/g, ''))}">Llamar</a>` : ''}${x.correo ? `<a class="btn sm" href="mailto:${esc(x.correo)}">Correo</a>` : ''}</div>` : ''}</div>`).join('') : '<div class="empty">No falta nada por ahora.</div>') + `<p class="sync">${ago()}</p>`;
  }

  /* ---------- más: conteo, alta, historial, pendientes ---------- */
  function viewMas() {
    const bad = nBad(), pend = nPend();
    main().innerHTML = `<h2>Más</h2>
      ${canWrite() ? `<div class="card tap" data-act="count"><b>Conteo físico</b><div class="small muted">Compara lo que hay en el estante contra el sistema</div></div>
      <div class="card tap" data-act="new-item"><b>Dar de alta un artículo</b><div class="small muted">Nuevo repuesto, herramienta, llave o equipo</div></div>` : ''}
      <div class="card tap" data-act="historial"><b>Historial reciente</b><div class="small muted">Últimos movimientos registrados</div></div>
      <div class="card tap" data-act="pendientes"><b>Pendientes de envío ${pend + bad ? `<span class="tag ${bad ? 't-bad' : 't-warn'}">${pend + bad}</span>` : ''}</b><div class="small muted">Lo que se guardó sin conexión${bad ? ' · hay registros rechazados' : ''}</div></div>
      <div class="card tap" data-act="refresh"><b>Actualizar ahora</b><div class="small muted">${ago()}</div></div>
      ${Alm.cfg.API_URL === 'DEMO' ? '<div class="card tap" data-act="demo-reset"><b>Restablecer datos de demostración</b></div>' : ''}
      <div class="card tap" data-act="logout"><b>Cerrar sesión</b><div class="small muted">${esc(me().nombre)} · ${esc(me().rol)}</div></div>
      <p class="sync">Versión ${esc((S.data && S.data.version) || '')}${Alm.cfg.API_URL === 'DEMO' ? ' · modo demostración' : ''}</p>`;
  }
  function openHistorial() {
    const r = (S.data && S.data.recent) || [];
    sheet(`<h2 style="margin-top:0">Historial reciente</h2>${r.length ? r.map((m) => `<div class="card small"><div class="row between"><b>${esc(m.tipo)}</b><span class="code">${esc(m.folio)}</span></div>${esc(m.desc)} · <b>${num(m.cant)}</b><br><span class="muted">${date(m.fecha)} · ${esc(m.entrega || '–')} → ${esc(m.recibe || '–')}</span>${m.valid && m.valid !== 'OK' ? `<div style="color:var(--bad);font-weight:700">⚠ ${esc(m.valid)}</div>` : ''}</div>`).join('') : '<div class="empty">Sin movimientos.</div>'}<button class="btn block" data-act="close">Cerrar</button>`);
  }
  function openPendientes() {
    const q = S.queue;
    sheet(`<h2 style="margin-top:0">Pendientes de envío</h2><p class="small muted">${S.online ? 'Hay conexión: se envían solos.' : 'Sin conexión: se enviarán cuando vuelva.'}</p>
      ${q.length ? q.map((x) => `<div class="card small"><b>${esc(x.label || x.kind)}</b><div class="muted">${new Date(x.at).toLocaleString('es-MX')}</div>${x.status === 'rechazado' ? `<div style="color:var(--bad);font-weight:700">Rechazado: ${esc(x.error)}</div><button class="btn sm" style="margin-top:8px" data-act="discard" data-id="${esc(x.id)}">Descartar</button>` : '<span class="tag t-warn">En espera</span>'}</div>`).join('') : '<div class="empty">No hay nada pendiente.</div>'}
      ${nPend() && S.online ? '<button class="btn primary block" data-act="sync-now">Enviar ahora</button>' : ''}<button class="btn block" style="margin-top:8px" data-act="close">Cerrar</button>`);
  }
  function openCount(cod) {
    FORMS.count = { vals: { cod: cod || '' }, errs: {}, op_id: Alm.uid() };
    const sh = sheet(`<h2 style="margin-top:0">Conteo físico</h2>${peopleList()}
      <label class="f"><span>Artículo *</span><div class="row"><input data-form="count" data-f="cod" value="${esc(cod || '')}" placeholder="MAT-00001" style="flex:1" autocapitalize="characters" autocomplete="off"><button type="button" class="btn" data-act="scanc" aria-label="Escanear">${I.scan}</button></div><div id="info-count"></div>${err('count', 'cod')}</label>
      <label class="f"><span>Lo que contaste *</span><input data-form="count" data-f="conteo" type="number" inputmode="decimal" min="0" step="any" placeholder="0">${err('count', 'conteo')}</label>
      ${personField('count', 'testigo', 'Testigo (badge, opcional)')}
      <label class="f"><span>Observaciones</span><textarea data-form="count" data-f="obs"></textarea></label>
      <div id="count-res"></div><div class="row"><button class="btn grow" data-act="close">Cerrar</button><button class="btn primary grow" id="ct-go">Registrar conteo</button></div>`);
    const info = () => { const it = Alm.findItem(fv('count', 'cod')), b = sh.el.querySelector('#info-count'); b.className = it ? 'found' : ''; b.innerHTML = it ? `<b>${esc(it.desc)}</b><br>${esc(it.ubic || '')}` : ''; };
    sh.el.addEventListener('input', info); info();
    sh.el.querySelector('#ct-go').onclick = async (ev) => {
      const v = FORMS.count.vals, it = Alm.findItem(v.cod), btn = ev.currentTarget;
      const e = {};
      if (!it) e.cod = 'Ese código no está en el catálogo.';
      if (v.conteo === '' || v.conteo == null || Number(v.conteo) < 0) e.conteo = 'Captura lo que contaste.';
      Object.keys(e).forEach((n) => { sh.el.querySelector(`[data-err="count.${n}"]`).textContent = e[n]; });
      if (Object.keys(e).length) return;
      btn.disabled = true; btn.textContent = 'Registrando…';
      const r = await Alm.submit('count', { op_id: FORMS.count.op_id, cod: it.cod, conteo: Number(v.conteo), testigo: Alm.parseBadge(v.testigo), obs: v.obs || '' }, `Conteo ${it.cod}: ${v.conteo}`);
      const out = sh.el.querySelector('#count-res');
      if (r.status === 'sent') {
        const d = Number(r.res.dif), ok = d === 0;
        out.innerHTML = `<div class="found ${ok ? '' : 'bad'}"><b>${esc(r.res.folio)}</b> · ${ok ? 'Cuadra con el sistema.' : `Diferencia de ${d > 0 ? '+' : ''}${num(d)} ${esc(it.unidad)} (el sistema decía ${num(r.res.sistema)}).`}</div>
          ${ok ? '' : `<button class="btn block" style="margin:8px 0" id="ct-adj">Registrar el ajuste</button>`}`;
        const adj = out.querySelector('#ct-adj');
        if (adj) adj.onclick = () => { sh.close(); startMove(d > 0 ? 'adj_in' : 'adj_out', { cod: it.cod, cant: Math.abs(d), obs: `Ajuste por conteo ${r.res.folio}`, cnt_folio: r.res.folio }); };
        btn.textContent = 'Registrado'; btn.disabled = true; FORMS.count.op_id = Alm.uid();
      } else if (r.status === 'queued') { out.innerHTML = '<div class="found">Guardado sin conexión; se enviará solo.</div>'; btn.textContent = 'Guardado'; }
      else { out.innerHTML = `<div class="found bad">${esc((r.res && r.res.error) || 'Rechazado')}</div>`; btn.disabled = false; btn.textContent = 'Registrar conteo'; }
    };
  }
  function openItemForm(cod) {
    const cur = cod ? Alm.items().find((i) => i.cod === cod) : null;
    FORMS.item = { vals: cur ? { descripcion: cur.desc, tipo: cur.tipo, categoria: cur.categoria, unidad: cur.unidad, ubicacion: cur.ubic, crit: cur.crit, costo: cur.costo, min_man: '', max_man: '', barras: cur.barras, enlace: cur.enlace, prov_id: cur.prov_id, activo: cur.activo }
      : { crit: 'C', activo: 'Sí' }, errs: {}, op_id: Alm.uid() };
    const L = (S.data && S.data.lists) || {};
    const sh = sheet(`<h2 style="margin-top:0">${cur ? 'Editar artículo' : 'Nuevo artículo'}</h2>${cur ? `<p class="code">${esc(cur.cod)}</p>` : ''}
      ${input('item', 'descripcion', 'Descripción', { req: 1 })}${select('item', 'tipo', 'Tipo de artículo', L.tiposArt || [], { req: 1 })}${select('item', 'categoria', 'Categoría', L.categorias || [])}
      ${select('item', 'unidad', 'Unidad', L.unidades || [])}${input('item', 'ubicacion', 'Ubicación (pasillo-estante-nivel)')}
      ${select('item', 'prov_id', 'Proveedor principal', ((S.data && S.data.providers) || []).map((p) => [p.id, p.nombre]))}
      ${select('item', 'crit', 'Criticidad', [['A', 'A · crítico'], ['B', 'B · importante'], ['C', 'C · normal']])}
      ${input('item', 'costo', 'Costo unitario', { type: 'number', attrs: 'inputmode="decimal" step="any" min="0"' })}
      ${input('item', 'min_man', 'Mínimo manual (opcional)', { type: 'number', attrs: 'inputmode="decimal" step="any" min="0"' })}${input('item', 'max_man', 'Máximo manual (opcional)', { type: 'number', attrs: 'inputmode="decimal" step="any" min="0"' })}
      ${input('item', 'barras', 'Código de barras (si difiere del código)')}${input('item', 'enlace', 'Enlace a imagen o ficha técnica', { ph: 'https://' })}
      ${cur ? select('item', 'activo', 'Activo', ['Sí', 'No']) : ''}
      <div class="err" id="it-err" style="color:var(--bad);font-weight:700;margin-bottom:8px"></div>
      <div class="row"><button class="btn grow" data-act="close">Cancelar</button><button class="btn primary grow" id="it-go">Guardar</button></div>`);
    sh.el.querySelector('#it-go').onclick = async (ev) => {
      const v = FORMS.item.vals, btn = ev.currentTarget;
      if (!String(v.descripcion || '').trim() || !v.tipo) { sh.el.querySelector('#it-err').textContent = 'Falta la descripción o el tipo.'; return; }
      const p = { op_id: FORMS.item.op_id }; if (cur) p.cod = cur.cod;
      ['descripcion', 'tipo', 'categoria', 'unidad', 'ubicacion', 'prov_id', 'crit', 'costo', 'min_man', 'max_man', 'barras', 'enlace', 'activo'].forEach((k) => { if (v[k] !== undefined && v[k] !== '' && v[k] !== null) p[k] = v[k]; });
      btn.disabled = true; btn.textContent = 'Guardando…';
      const r = await Alm.submit('item', p, (cur ? 'Editar ' : 'Alta: ') + (v.descripcion || ''));
      if (r.status === 'rejected') { sh.el.querySelector('#it-err').textContent = r.res.error || 'Rechazado'; btn.disabled = false; btn.textContent = 'Guardar'; return; }
      sh.close(); toast(r.status === 'queued' ? 'Guardado sin conexión; se enviará solo.' : (cur ? 'Artículo actualizado.' : 'Artículo creado: ' + r.res.cod), 'ok');
    };
  }

  /* ---------- eventos ---------- */
  const ACT = {
    nav(b) { S.view = b.dataset.v; if (S.view === 'mover' && FORMS.move && !FORMS.move.keep) { /* conserva el formulario en curso */ } Alm.render(); },
    chip(b) { ui.chip = b.dataset.k; refreshCatalog(); },
    item(b) { openItem(b.dataset.cod); },
    close() { closeSheets(); },
    refresh() { Alm.refresh(true).then(() => toast('Datos actualizados', 'ok')); },
    start(b) { startMove(b.dataset.k); },
    back() { FORMS.move = null; Alm.render(); },
    again() { closeSheets(); FORMS.move = null; S.view = 'mover'; Alm.render(); },
    'to-cat'() { closeSheets(); S.view = 'catalogo'; Alm.render(); },
    step(b) { const el = document.querySelector('[data-form="move"][data-f="cant"]'); const v = Math.max(0, (Number(el.value) || 0) + Number(b.dataset.d)); el.value = v || ''; onInput(el); },
    review() { review(); },
    'mv-item'(b) { closeSheets(); const it = Alm.findItem(b.dataset.cod); const k = it && RET.includes(it.tipo) ? 'out_prest' : 'out_cons'; startMove(k, { cod: b.dataset.cod }); },
    'edit-item'(b) { closeSheets(); openItemForm(b.dataset.cod); },
    'count-item'(b) { closeSheets(); openCount(b.dataset.cod); },
    scanq() { Alm.scan((v) => { ui.q = v; const q = document.getElementById('q'); if (q) q.value = v; refreshCatalog(); const it = Alm.findItem(v); if (it) openItem(it.cod); }); },
    scanf() { Alm.scan((v) => { setVal('move', 'cod', v); onInput(document.querySelector('[data-form="move"][data-f="cod"]')); }); },
    scanc() { Alm.scan((v) => { setVal('count', 'cod', v); document.querySelector('[data-form="count"][data-f="cod"]').dispatchEvent(new Event('input', { bubbles: true })); }); },
    devolver(b) { const l = ((S.data && S.data.loans) || []).find((x) => x.folio === b.dataset.folio); if (!l) return; const p = ((S.data && S.data.people) || []).find((x) => x.nombre === l.recibe);
      startMove('in_devprest', { prestamo: l.folio, cod: l.cod, cant: Number(l.cant) - Number(l.devuelto || 0), entrega: p ? p.badge : '' }); },
    'copy-short'() { const f = (S.data && S.data.shortages) || []; const t = 'Faltantes ' + Alm.today() + '\n' + f.map((x) => `${x.cod} ${x.desc} — pedir ${x.sugerido} ${x.unidad}${x.prov ? ' (' + x.prov + ')' : ''}`).join('\n');
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Lista copiada', 'ok')).catch(() => toast('No se pudo copiar', 'bad')); },
    count() { openCount(); }, 'new-item'() { openItemForm(); }, historial() { openHistorial(); }, pendientes() { closeSheets(); openPendientes(); },
    discard(b) { Alm.discard(b.dataset.id); closeSheets(); openPendientes(); },
    'sync-now'() { Alm.processQueue().then(() => { closeSheets(); openPendientes(); }); },
    logout() { if (confirm('¿Cerrar sesión?' + (S.queue.length ? ' Hay registros pendientes en este dispositivo.' : ''))) Alm.logout(); },
    'demo-reset'() { window.DemoServer.reset(); Alm.refresh(true).then(() => toast('Demo restablecida', 'ok')); }
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) { e.preventDefault(); ACT[b.dataset.act](b); } });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.id === 'q') { ui.q = el.value; Alm.debounce(refreshCatalog, 120)(); return; }
    if (el.dataset && el.dataset.form && FORMS[el.dataset.form]) onInput(el);
  });
  document.addEventListener('change', (e) => { const el = e.target; if (el.dataset && el.dataset.form && el.tagName === 'SELECT' && FORMS[el.dataset.form]) onInput(el); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'q') { const it = Alm.findItem(e.target.value); if (it) { e.preventDefault(); openItem(it.cod); } }
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.f === 'cod') e.preventDefault();   // los lectores USB envían Enter
  });

  // arranque: abre con la última copia aunque no haya red
  Alm.render();
  if (S.session) { Alm.refresh(true); Alm.processQueue(); }
})();
