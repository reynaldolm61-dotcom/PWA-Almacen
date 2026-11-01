/* Servidor de DEMOSTRACIÓN dentro del navegador. Habla el mismo protocolo que Apps Script,
   para probar la app sin conectarla al libro. PIN de todos los usuarios de demo: 1234.
   Los datos se guardan en este navegador (localStorage) y se borran con "Restablecer demo". */
(function () {
  const KEY = 'alm.demo.db.v1';
  const TIPOS = ['Entrada - Proveedor', 'Entrada - Devolución de material no usado', 'Entrada - Devolución de préstamo', 'Entrada - Ajuste por conteo',
    'Entrada - Inventario inicial', 'Salida - Consumo / insumo', 'Salida - Préstamo', 'Salida - Baja / merma', 'Salida - Ajuste por conteo', 'Salida - Devolución a proveedor'];
  const EF = { // [disponible, prestado]
    'Entrada - Proveedor': [1, 0], 'Entrada - Devolución de material no usado': [1, 0], 'Entrada - Devolución de préstamo': [1, -1],
    'Entrada - Ajuste por conteo': [1, 0], 'Entrada - Inventario inicial': [1, 0], 'Salida - Consumo / insumo': [-1, 0], 'Salida - Préstamo': [-1, 1],
    'Salida - Baja / merma': [-1, 0], 'Salida - Ajuste por conteo': [-1, 0], 'Salida - Devolución a proveedor': [-1, 0] };
  const RET = ['Herramienta', 'Llave', 'Equipo pesado'];
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };

  function seed() {
    const it = (cod, desc, tipo, categoria, ubic, unidad, crit, disp, prest, min, rop, max, costo, prov) =>
      ({ cod, desc, tipo, categoria, fabricante: '', no_parte: '', aplica: '', unidad, ubic, prov_id: prov || '', prov: prov ? 'Proveedor Ejemplo, S.A.' : '', costo,
         barras: '', enlace: '', activo: 'Sí', obs: '', crit, disp, prest, min, rop, max, pend: 0, sugerido: 0, cobertura: '', lead: 7 });
    const items = [
      it('MAT-00001', 'Sello de pistón hidráulico (juego)', 'Repuesto', 'Sellos y empaques', 'A-01-1', 'juego', 'A', 3, 0, 2, 3, 4, 850, 'PRV-0001'),
      it('MAT-00002', 'Montacargas eléctrico unidad 1', 'Equipo pesado', 'Montacargas', 'Patio', 'pza', 'A', 0, 1, 0, 0, 0, 250000),
      it('MAT-00003', 'Filtro de aceite hidráulico', 'Consumible', 'Filtros', 'B-02-1', 'pza', 'B', 2, 0, 2, 3, 8, 120, 'PRV-0001'),
      it('MAT-00004', 'Válvula proporcional', 'Repuesto', 'Hidráulico', 'A-03-2', 'pza', 'A', 0, 0, 2, 2, 2, 18000, 'PRV-0001'),
      it('MAT-00005', 'Llave de cuarto eléctrico', 'Llave', 'Llaves de acceso', 'Tablero de llaves', 'pza', 'C', 0, 1, 0, 0, 0, 0),
      it('MAT-00006', 'Guante de nitrilo (caja)', 'Consumible', 'Limpieza y consumibles', 'C-01-4', 'caja', 'C', 12, 0, 4, 6, 20, 90),
      it('MAT-00007', 'Manguera hidráulica 3/8" (metro)', 'Repuesto', 'Mangueras y conexiones', 'A-02-3', 'm', 'B', 6, 0, 8, 12, 24, 210, 'PRV-0001'),
      it('MAT-00008', 'Grasa para rodamientos (cartucho)', 'Consumible', 'Lubricantes y fluidos', 'B-04-2', 'pza', 'C', 40, 0, 4, 6, 20, 75),
      it('MAT-00009', 'Torquímetro 10-60 N·m', 'Herramienta', 'Herramienta de medición', 'Pañol 2', 'pza', 'B', 1, 0, 0, 0, 0, 3200),
      it('MAT-00010', 'Plataforma elevadora articulada 1', 'Equipo pesado', 'Plataformas elevadoras', 'Patio', 'pza', 'A', 1, 0, 0, 0, 0, 480000)];
    const people = [
      { badge: '100001', nombre: 'Almacenista Ejemplo', rol: 'Almacenista', area: 'Almacén' }, { badge: '100002', nombre: 'Laura Mendoza', rol: 'Supervisor', area: 'Almacén' },
      { badge: '20000001', nombre: 'Técnico Ejemplo', rol: 'Técnico', area: 'Mantenimiento' }, { badge: '20000002', nombre: 'Carlos Ruiz', rol: 'Técnico', area: 'Mantenimiento' },
      { badge: '20000003', nombre: 'Ana Torres', rol: 'Producción', area: 'Producción' }];
    const movs = [
      { folio: 'MOV-00001', fecha: addDays(-3), tipo: 'Salida - Préstamo', cod: 'MAT-00005', desc: 'Llave de cuarto eléctrico', cant: 1, entrega: 'Almacenista Ejemplo', recibe: 'Carlos Ruiz', area: 'Mantenimiento', ot: '', compromiso: addDays(-1), estado_prest: 'VENCIDO', dias: 3, devuelto: 0, valid: 'OK', condicion: 'Buena' },
      { folio: 'MOV-00002', fecha: addDays(-1), tipo: 'Salida - Préstamo', cod: 'MAT-00002', desc: 'Montacargas eléctrico unidad 1', cant: 1, entrega: 'Almacenista Ejemplo', recibe: 'Técnico Ejemplo', area: 'Logística', ot: '', compromiso: addDays(2), estado_prest: 'En préstamo', dias: 1, devuelto: 0, valid: 'OK', condicion: 'Buena' }];
    const pos = [{ folio: 'OC-00001', cod: 'MAT-00004', desc: 'Válvula proporcional', prov: 'Proveedor Ejemplo, S.A.', pendiente: 1, promesa: addDays(-2), estado: 'Atrasada' },
                 { folio: 'OC-00002', cod: 'MAT-00003', desc: 'Filtro de aceite hidráulico', prov: 'Proveedor Ejemplo, S.A.', pendiente: 6, promesa: addDays(4), estado: 'Abierta' }];
    return { items, people, movs, pos, seq: 3, cnt: 1, itemSeq: 11 };
  }
  function load() { try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) { /* sin almacenamiento */ } return seed(); }
  let db = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* sin almacenamiento */ } };
  const err = (m, code) => ({ ok: false, error: m, code: code || 'ERROR' });
  const person = (b) => db.people.find((p) => p.badge === String(b));

  function estado(i) {
    const pend = db.pos.filter((p) => p.cod === i.cod).reduce((a, p) => a + p.pendiente, 0);
    i.pend = pend;
    let e;
    if (i.disp <= 0 && i.prest > 0) e = 'EN PRÉSTAMO';
    else if (i.disp <= 0) e = i.rop > 0 ? 'SIN EXISTENCIA' : 'Sin stock (sin demanda)';
    else if (i.disp < i.min) e = 'BAJO MÍNIMO';
    else if (i.disp <= i.rop && i.rop > 0) e = 'REORDENAR';
    else if (i.max > 0 && i.disp > i.max) e = 'EXCEDENTE';
    else e = 'OK';
    i.estado = e;
    const flag = ['SIN EXISTENCIA', 'BAJO MÍNIMO', 'REORDENAR'].includes(e);
    i.sugerido = flag ? (i.disp + pend > i.rop ? 0 : Math.max(1, i.max - i.disp - pend)) : 0;
  }
  function boot(u) {
    db.items.forEach(estado);
    const w = { A: 3, B: 2, C: 1 }, s = { 'SIN EXISTENCIA': 3, 'BAJO MÍNIMO': 2, 'REORDENAR': 1 };
    const shortages = db.items.filter((i) => s[i.estado]).sort((a, b) => w[b.crit] - w[a.crit] || s[b.estado] - s[a.estado])
      .map((i, n) => ({ n: n + 1, cod: i.cod, desc: i.desc, crit: i.crit, estado: i.estado, disp: i.disp, pend: i.pend, sugerido: i.sugerido, unidad: i.unidad,
                        prov: i.prov, contacto: i.prov ? 'Contacto Ejemplo' : '', tel: i.prov ? '000 000 0000' : '', correo: i.prov ? 'ventas@ejemplo.com' : '', lead: i.lead, repos: i.sugerido * i.costo }));
    return { ok: true, version: 'demo', today: iso(new Date()), user: { badge: u.badge, nombre: u.nombre, rol: u.rol, area: u.area, canWrite: ['Almacenista', 'Supervisor'].includes(u.rol) },
      items: db.items, people: db.people.map((p) => ({ badge: p.badge, nombre: p.nombre, rol: p.rol })), pos: db.pos.filter((p) => p.pendiente > 0),
      providers: [{ id: 'PRV-0001', nombre: 'Proveedor Ejemplo, S.A.' }], loans: db.movs.filter((m) => m.estado_prest === 'En préstamo' || m.estado_prest === 'VENCIDO'),
      shortages, recent: db.movs.slice(-40).reverse(),
      lists: { tipos: TIPOS, areas: ['Mantenimiento', 'Producción', 'Calidad', 'Logística', 'Ingeniería', 'Seguridad e higiene', 'Almacén', 'Compras', 'Otros'],
               condiciones: ['Buena', 'Con desgaste', 'Dañado', 'Incompleto', 'No aplica'], categorias: ['Hidráulico', 'Neumático', 'Eléctrico', 'Filtros', 'Sellos y empaques', 'Mangueras y conexiones', 'Lubricantes y fluidos', 'Herramienta manual', 'Llaves de acceso', 'Montacargas', 'Plataformas elevadoras', 'Otros'],
               unidades: ['pza', 'par', 'juego', 'kit', 'm', 'L', 'kg', 'ml', 'caja', 'rollo', 'galón'], tiposArt: ['Repuesto', 'Consumible', 'Herramienta', 'Llave', 'Equipo pesado'] } };
  }
  function movement(u, o) {
    if (!['Almacenista', 'Supervisor'].includes(u.rol)) return err('Tu rol es de solo consulta.', 'FORBIDDEN');
    if (db.movs.some((m) => m.op_id === o.op_id)) return { ok: true, duplicate: true, folio: db.movs.find((m) => m.op_id === o.op_id).folio };
    const i = db.items.find((x) => x.cod === o.cod);
    if (!TIPOS.includes(o.tipo)) return err('Tipo de movimiento no válido.');
    if (!i) return err('Código sin dar de alta en el catálogo', 'VALIDATION');
    if (!(Number(o.cant) > 0)) return err('Cantidad inválida', 'VALIDATION');
    const need2 = ['Entrada - Devolución de material no usado', 'Entrada - Devolución de préstamo', 'Salida - Consumo / insumo', 'Salida - Préstamo'].includes(o.tipo);
    if (!o.recibe || (need2 && !o.entrega)) return err('Falta quién recibe o quién entrega', 'VALIDATION');
    if ((o.recibe && !person(o.recibe)) || (o.entrega && !person(o.entrega))) return err('Badge no registrado en Personal', 'VALIDATION');
    if (need2 && o.entrega === o.recibe) return err('Entrega y recibe son la misma persona', 'VALIDATION');
    if (o.tipo === TIPOS[0] && (!o.oc || !o.remision)) return err('Entrada de proveedor sin folio OC o remisión', 'VALIDATION');
    if (o.tipo === TIPOS[6] && !o.compromiso) return err('Préstamo sin fecha compromiso de devolución', 'VALIDATION');
    if (o.tipo === TIPOS[5] && RET.includes(i.tipo)) return err('Herramienta, llave o equipo debe salir como préstamo', 'VALIDATION');
    let loan = null;
    if (o.tipo === TIPOS[2]) {
      loan = db.movs.find((m) => m.folio === o.folio_prest);
      if (!o.folio_prest) return err('Devolución sin folio de préstamo', 'VALIDATION');
      if (!loan) return err('Folio de préstamo inexistente', 'VALIDATION');
      if (loan.cod !== o.cod) return err('El folio de préstamo es de otro código', 'VALIDATION');
      if (Number(o.cant) > loan.cant - (loan.devuelto || 0)) return err('La devolución excede lo prestado', 'VALIDATION');
    }
    const [ed, ep] = EF[o.tipo];
    if (i.disp + ed * Number(o.cant) < 0) return err('Saldo negativo: la salida supera la existencia', 'VALIDATION');
    i.disp += ed * Number(o.cant); i.prest += ep * Number(o.cant);
    if (loan) { loan.devuelto = (loan.devuelto || 0) + Number(o.cant); if (loan.devuelto >= loan.cant) loan.estado_prest = 'Devuelto'; }
    if (o.tipo === TIPOS[0]) { const p = db.pos.find((x) => x.folio === o.oc); if (p) p.pendiente = Math.max(0, p.pendiente - Number(o.cant)); }
    const folio = 'MOV-' + String(db.seq++).padStart(5, '0');
    const nm = (b) => (person(b) ? person(b).nombre : '');
    db.movs.push({ folio, fecha: iso(new Date()), tipo: o.tipo, cod: o.cod, desc: i.desc, cant: Number(o.cant), entrega: nm(o.entrega), recibe: nm(o.recibe), area: o.area || '', ot: o.ot || '',
      compromiso: o.compromiso || '', estado_prest: o.tipo === TIPOS[6] ? 'En préstamo' : '', dias: 0, devuelto: 0, valid: 'OK', condicion: o.condicion || '', op_id: o.op_id });
    estado(i); save();
    return { ok: true, folio, saldo: i.disp };
  }
  function handle(b) {
    if (b.action === 'login') {
      const p = person(b.badge);
      if (!p || String(b.pin) !== '1234') return err('Badge o PIN incorrecto.', 'BADLOGIN');
      return { ok: true, token: 'demo.' + p.badge, user: { badge: p.badge, nombre: p.nombre, rol: p.rol, area: p.area, canWrite: ['Almacenista', 'Supervisor'].includes(p.rol) } };
    }
    const u = person(String(b.token || '').split('.')[1]);
    if (!u) return err('Sesión vencida. Entra de nuevo.', 'AUTH');
    if (b.action === 'bootstrap') return boot(u);
    if (b.action === 'movement') return movement(u, b.op || {});
    if (b.action === 'count') {
      const i = db.items.find((x) => x.cod === (b.op || {}).cod);
      if (!i) return err('Código no dado de alta en el catálogo.', 'VALIDATION');
      const dif = Number(b.op.conteo) - i.disp;
      return { ok: true, folio: 'CNT-' + String(db.cnt++).padStart(5, '0'), sistema: i.disp, dif, resultado: dif === 0 ? 'Cuadra' : 'DIFERENCIA SIN AJUSTAR', desc: i.desc };
    }
    if (b.action === 'count_link') return { ok: true };
    if (b.action === 'item_save') {
      const x = b.item || {};
      if (x.cod) { const i = db.items.find((q) => q.cod === x.cod); if (!i) return err('El código no existe en el catálogo.'); Object.assign(i, x); estado(i); save(); return { ok: true, cod: i.cod }; }
      if (!x.descripcion) return err('La descripción es obligatoria.');
      if (db.items.some((q) => q.desc.toLowerCase() === String(x.descripcion).toLowerCase())) return err('Ya existe un artículo con esa descripción.', 'VALIDATION');
      const n = { cod: 'MAT-' + String(db.itemSeq++).padStart(5, '0'), desc: x.descripcion, tipo: x.tipo || 'Repuesto', categoria: x.categoria || '', fabricante: '', no_parte: '', aplica: '', unidad: x.unidad || 'pza',
        ubic: x.ubicacion || '', prov_id: '', prov: '', costo: Number(x.costo) || 0, barras: x.barras || '', enlace: x.enlace || '', activo: 'Sí', obs: '', crit: x.crit || 'C', disp: 0, prest: 0,
        min: Number(x.min_man) || 0, rop: Number(x.min_man) || 0, max: Number(x.max_man) || 0, pend: 0, sugerido: 0, cobertura: '', lead: 7 };
      db.items.push(n); estado(n); save(); return { ok: true, cod: n.cod };
    }
    return err('Acción desconocida.');
  }
  window.DemoServer = {
    handle: (b) => new Promise((res, rej) => setTimeout(() => {
      if (!navigator.onLine) return rej(new TypeError('offline'));
      try { res(JSON.parse(JSON.stringify(handle(b)))); } catch (e) { rej(e); }
    }, 220)),
    reset: () => { db = seed(); save(); }
  };
})();
