/* VIA OPUS 5.0 — maquete 3D que se constrói com a rolagem (evolução da 4.0).
   Ilustrativa: representa as etapas de uma obra, não um projeto real.
   Novidades: reflexos (mapa de ambiente), céu em gradiente (CSS) atrás do canvas, andaimes,
   brilho noturno, pessoas em escala, vista explodida, girar arrastando, dia/noite e pontos de interesse.
   API: const obra = ViaOpusObra(canvas, { mobile, sky, onFrame });
        obra.set(p) · obra.mode('build'|'night') · obra.rotate(dx) · obra.night(null|0|1) · obra.explode(bool)
        obra.start() · obra.stop() · obra.jump(p) · obra.stage(p) · obra.level(p) */
(function () {
  'use strict';
  const T = window.THREE;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const back = x => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const ST = { projeto: [0, .12], fundacao: [.12, .25], estrutura: [.25, .5], vedacao: [.5, .64], fachada: [.64, .82], entrega: [.82, 1] };

  window.ViaOpusObra = function (canvas, opts = {}) {
    if (!T) return null;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.capture }); }
    catch (e) { return null; }
    if (!renderer.getContext()) return null;
    const mobile = !!opts.mobile;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const scene = new T.Scene();
    const SKY = { dayTop: new T.Color('#e2dbcf'), dayHor: new T.Color('#eee8df'), nightTop: new T.Color('#0f1115'), nightHor: new T.Color('#5b4237') };
    scene.fog = new T.Fog(SKY.dayHor.clone(), 75, 190);
    const camera = new T.PerspectiveCamera(30, 1, .5, 500);

    // ── Mapa de ambiente (reflexos suaves) ──
    const pm = new T.PMREMGenerator(renderer);
    const envScene = new T.Scene();
    const envGeo = new T.SphereGeometry(60, 32, 16), cols = [], ep = envGeo.attributes.position;
    const cTop = new T.Color('#fff6ea'), cHor = new T.Color('#d8cdbf'), cBot = new T.Color('#6f665d'), tmp = new T.Color();
    for (let i = 0; i < ep.count; i++) { const y = ep.getY(i) / 60; tmp.copy(y > 0 ? cHor : cBot).lerp(y > 0 ? cTop : cHor, y > 0 ? y : 1 + y); cols.push(tmp.r, tmp.g, tmp.b); }
    envGeo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    envScene.add(new T.Mesh(envGeo, new T.MeshBasicMaterial({ side: T.BackSide, vertexColors: true })));
    const panel = (w, h, x, y, z, k) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k * .96, k * .9), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
    panel(26, 18, 26, 34, 30, 4); panel(30, 8, -34, 18, 10, 1.4); panel(20, 6, 0, 10, -40, 1.1);
    scene.environment = pm.fromScene(envScene, .035).texture;

    // ── Luzes ──
    const hemi = new T.HemisphereLight('#fff7ec', '#b9ae9f', .55); scene.add(hemi);
    const sun = new T.DirectionalLight('#fff1de', 2.2);
    sun.position.set(26, 42, 30); sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 34, bottom: -30, near: 5, far: 130 });
    sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 4;
    scene.add(sun);

    // ── Materiais ──
    const M = {
      clay: new T.MeshStandardMaterial({ color: '#f3eee6', roughness: .9 }),
      concrete: new T.MeshStandardMaterial({ color: '#c8c1b6', roughness: .95 }),
      slab: new T.MeshStandardMaterial({ color: '#dad4ca', roughness: .9 }),
      stone: new T.MeshStandardMaterial({ color: '#f3eee6', roughness: .78 }),
      dark: new T.MeshStandardMaterial({ color: '#25282b', roughness: .38, metalness: .35 }),
      wood: new T.MeshStandardMaterial({ color: '#8f6143', roughness: .62 }),
      glass: new T.MeshStandardMaterial({ color: '#7f939b', roughness: .04, metalness: .7, transparent: true, opacity: 0, depthWrite: false }),
      rail: new T.MeshStandardMaterial({ color: '#b9c7cc', roughness: .04, metalness: .4, transparent: true, opacity: 0, depthWrite: false }),
      lit: new T.MeshBasicMaterial({ color: '#ffd29a', transparent: true, opacity: 0, toneMapped: false }),
      copper: new T.MeshStandardMaterial({ color: '#b37d5d', roughness: .3, metalness: .8 }),
      crane: new T.MeshStandardMaterial({ color: '#c08a5e', roughness: .45, metalness: .5 }),
      leaf: new T.MeshStandardMaterial({ color: '#8b997b', roughness: .9, flatShading: true }),
      trunk: new T.MeshStandardMaterial({ color: '#6b5a4a', roughness: .9 }),
      ground: new T.MeshStandardMaterial({ color: '#e6dfd4', roughness: 1 }),
      walk: new T.MeshStandardMaterial({ color: '#dbd4c9', roughness: 1 }),
      street: new T.MeshStandardMaterial({ color: '#d4cdc2', roughness: 1 }),
      person: new T.MeshStandardMaterial({ color: '#fbf8f3', roughness: .85 }),
      glow: new T.MeshBasicMaterial({ color: '#ffe2b8', transparent: true, opacity: 0, toneMapped: false }),
      scaff: new T.LineBasicMaterial({ color: '#8d8378', transparent: true, opacity: .9 })
    };
    const envMats = Object.values(M).filter(m => m.isMeshStandardMaterial);
    const STONE_DAY = new T.Color('#f3eee6'), STONE = new T.Color('#d4c3a9');
    const HSKY = new T.Color('#7f8aa3'), HGND = new T.Color('#3b3632'), SUNSET = new T.Color('#ffc9a0'), GDAY = new T.Color('#e6dfd4'), GNIGHT = new T.Color('#7d7670');

    // ── Registro de peças ──
    const items = [], movers = [];
    let F = null; // pavimento atual (para a vista explodida)
    const add = (obj, a, b, kind, extra = {}) => { items.push(Object.assign({ obj, a, b, kind }, extra)); return obj; };
    const reg = (m, y) => { m.userData.y0 = y; m.userData.f = F; m.userData.dy = 0; movers.push(m); };
    const root = new T.Group(); scene.add(root);
    const box = (w, h, d, mat, x, y, z, parent = root) => {
      const g = new T.BoxGeometry(w, h, d); g.translate(0, h / 2, 0);
      const m = new T.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m);
      if (parent === root) reg(m, y);
      return m;
    };

    // ── Terreno ──
    const ground = new T.Mesh(new T.PlaneGeometry(600, 600), M.ground);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const walk = box(70, .12, 4, M.walk, 0, 0, 9.2); walk.castShadow = false;
    const street = box(70, .02, 12, M.street, 0, 0, 17.2); street.castShadow = false;
    const grid = new T.GridHelper(90, 45, 0xb37d5d, 0xb37d5d);
    grid.material.transparent = true; grid.material.opacity = .16; grid.position.y = .015; scene.add(grid);

    const W = 12, D = 10, Z = D / 2, X = W / 2;
    const L = [0, 3.6, 6.6, 9.6, 12.6, 15.6];
    const nF = 5, GAP = 2.6;
    const colX = [-5.8, -1.9, 1.9, 5.8], colZ = [-4.8, 0, 4.8];

    // ── Desenho (linhas cobre) ──
    const linePts = [];
    const edgesOf = (w, h, d, x, y, z) => { const p = new T.EdgesGeometry(new T.BoxGeometry(w, h, d)).attributes.position.array; for (let i = 0; i < p.length; i += 3) linePts.push(p[i] + x, p[i + 1] + y + h / 2, p[i + 2] + z); };
    const line = (a, b) => linePts.push(...a, ...b);
    edgesOf(W, .02, D, 0, 0, 0);
    const dim = (a, b, n) => { line(a, b); line([a[0] - n[0], a[1], a[2] - n[2]], [a[0] + n[0], a[1], a[2] + n[2]]); line([b[0] - n[0], b[1], b[2] - n[2]], [b[0] + n[0], b[1], b[2] + n[2]]); };
    dim([-X, .02, Z + 1.6], [X, .02, Z + 1.6], [0, 0, .5]);
    dim([-X - 1.6, .02, -Z], [-X - 1.6, .02, Z], [.5, 0, 0]);
    dim([X + 1.6, 0, Z], [X + 1.6, L[5], Z], [.5, 0, 0]);
    for (let k = 1; k <= 5; k++) line([X + 1.2, L[k], Z], [X + 2.0, L[k], Z]);
    for (let k = 0; k < nF; k++) edgesOf(W, L[k + 1] - L[k], D, 0, L[k], 0);
    edgesOf(W + .6, .45, D + .8, 0, L[5], .2);
    for (const x of colX) for (const z of colZ) line([x, 0, z], [x, L[5], z]);
    const wireGeo = new T.BufferGeometry(); wireGeo.setAttribute('position', new T.Float32BufferAttribute(linePts, 3));
    const wireMat = new T.LineBasicMaterial({ color: '#a46f4c', transparent: true, opacity: 1 });
    scene.add(new T.LineSegments(wireGeo, wireMat));
    const wireCount = linePts.length / 3;

    // ── Fundação ──
    const pileGeo = new T.CylinderGeometry(.2, .2, 1.4, 12); pileGeo.translate(0, .7, 0);
    let pi = 0;
    for (const x of colX) for (const z of colZ) {
      const m = new T.Mesh(pileGeo, M.concrete); m.position.set(x, 0, z); m.castShadow = true; root.add(m); reg(m, 0);
      const a = lerp(ST.fundacao[0], ST.fundacao[0] + .06, pi / 11); add(m, a, a + .035, 'drop', { h: 9 }); pi++;
    }
    add(box(W + .4, .5, D + .4, M.concrete, 0, 0, 0), ST.fundacao[0] + .07, ST.fundacao[1], 'rise');

    // ── Estrutura ──
    const sA = ST.estrutura[0] + .02, sB = ST.estrutura[1], per = (sB - sA) / nF;
    for (let k = 0; k < nF; k++) {
      F = k;
      const a = sA + per * k, h = L[k + 1] - L[k] - .3, y = L[k] + (k === 0 ? .5 : 0);
      let c = 0;
      for (const x of colX) for (const z of colZ) { add(box(.42, h - (k === 0 ? .5 : 0), .42, M.concrete, x, y, z), a + c * .002, a + per * .55, 'rise'); c++; }
      F = k + 1;
      add(box(W, .3, D, M.slab, 0, L[k + 1] - .3, 0), a + per * .5, a + per * .95, 'drop', { h: 4 });
      F = k;
      if (k >= 1) add(box(4.3, .22, 1.3, M.slab, -3.8, L[k] - .22, Z + .65), a + per * .6, a + per * .95, 'drop', { h: 3 });
    }

    // ── Vedação ──
    const vA = ST.vedacao[0], vB = ST.vedacao[1], vper = (vB - vA) / nF;
    for (let k = 0; k < nF; k++) {
      F = k;
      const a = vA + vper * k, b = a + vper * 1.6, y = L[k] + (k === 0 ? .5 : 0), h = L[k + 1] - L[k] - .3 - (k === 0 ? .5 : 0);
      add(box(W - .2, h, .2, M.clay, 0, y, -Z + .1), a, b, 'rise');
      add(box(.2, h, D - .2, M.clay, -X + .1, y, 0), a, b, 'rise');
      add(box(.2, h, D - .2, M.clay, X - .1, y, 0), a, b, 'rise');
      if (k === 0) {
        add(box(1.6, h, .2, M.clay, -X + .8, y, Z - .1), a, b, 'rise');
        add(box(2.4, h, .2, M.clay, -.9, y, Z - .1), a, b, 'rise');
        add(box(4.9, h - 2.6, .2, M.clay, 3.35, y + 2.6, Z - .1), a, b, 'rise');
      } else {
        add(box(4.3, .9, .2, M.clay, -3.85, y, Z - .1), a, b, 'rise');
        add(box(4.3, .25, .2, M.clay, -3.85, y + h - .25, Z - .1), a, b, 'rise');
        add(box(2.1, h, .2, M.clay, -.65, y, Z - .1), a, b, 'rise');
        add(box(5.4, h, .55, M.stone, 3.3, y, Z + .17), a, b, 'rise');
      }
    }

    // ── Fachada ──
    const fA = ST.fachada[0], fB = ST.fachada[1];
    const lits = [], glowSpots = [];
    for (let k = 1; k < nF; k++) {
      F = k; const y = L[k];
      box(4.3, 1.75, .06, M.glass, -3.85, y + .9, Z - .05).castShadow = false;
      const l1 = box(4.1, 1.6, .02, M.lit, -3.85, y + .95, Z - .3); l1.castShadow = false; lits.push(l1); glowSpots.push([l1, 5.6, 3.2, 1.1]);
      add(box(4.4, .08, .14, M.dark, -3.85, y + .86, Z), fA, fA + .08, 'rise');
      add(box(4.4, .08, .14, M.dark, -3.85, y + 2.62, Z), fA, fA + .08, 'rise');
      for (const x of [-6, -3.85, -1.7]) add(box(.08, 1.8, .14, M.dark, x, y + .86, Z), fA + .01, fA + .09, 'rise');
      box(2.6, 1.4, .06, M.glass, 3.3, y + .95, Z + .47).castShadow = false;
      const l2 = box(2.4, 1.3, .01, M.lit, 3.3, y + 1, Z + .452); l2.castShadow = false; lits.push(l2); glowSpots.push([l2, 3.8, 2.6, .9]);
      add(box(2.8, .1, .2, M.dark, 3.3, y + .85, Z + .5), fA + .02, fA + .1, 'rise');
      add(box(2.8, .1, .2, M.dark, 3.3, y + 2.35, Z + .5), fA + .02, fA + .1, 'rise');
      box(4.2, 1.0, .05, M.rail, -3.8, y, Z + 1.27).castShadow = false;
      add(box(4.25, .05, .08, M.dark, -3.8, y + 1.0, Z + 1.27), fA + .04, fA + .12, 'rise');
      // ripas de madeira (por pavimento, para a vista explodida)
      for (let i = 0; i < 9; i++) add(box(.1, L[k + 1] - L[k], .16, M.wood, -1.45 + i * .2, y, Z + .1), fA + .05 + (k - 1) * .012 + i * .006, fA + .11 + (k - 1) * .012 + i * .006, 'rise');
    }
    F = 0;
    box(1.9, 2.6, .06, M.glass, -3.65, .5, Z - .05).castShadow = false;
    const le = box(1.7, 2.4, .02, M.lit, -3.65, .55, Z - .4); le.castShadow = false; lits.push(le); glowSpots.push([le, 3.2, 3.6, 1.2]);
    for (let i = 0; i < 9; i++) add(box(4.6, .24, .08, M.wood, 3.35, .55 + i * .28, Z + .02), fA + .02 + i * .006, fA + .07 + i * .006, 'rise');
    add(box(3.2, .18, 1.6, M.dark, -3.65, 3.1, Z + .8), fA + .06, fA + .14, 'drop', { h: 2 });
    F = 5;
    add(box(W + .6, .45, D + .8, M.dark, 0, L[5], .2), fA + .1, fB - .02, 'drop', { h: 3 });
    add(box(W - .6, .6, .15, M.copper, 0, L[5] + .45, Z + .45), fB - .06, fB, 'rise');
    F = null;
    const glassOn = [fA + .02, fA + .1];

    // ── Andaimes (sobem com a vedação, saem antes da entrega) ──
    const scPts = [], sx0 = -6.8, sx1 = 6.8, sz = Z + 2.1, sTop = L[5] + 1.2, bay = 2.27, lift = 2;
    for (let x = sx0; x <= sx1 + .01; x += bay) { scPts.push(x, 0, sz, x, sTop, sz, x, 0, sz + 1, x, sTop, sz + 1); }
    for (let y = lift; y <= sTop + .01; y += lift) { scPts.push(sx0, y, sz, sx1, y, sz, sx0, y, sz + 1, sx1, y, sz + 1); for (let x = sx0; x <= sx1 + .01; x += bay) scPts.push(x, y, sz, x, y, sz + 1); }
    let flip = 0;
    for (let y = 0; y < sTop - .5; y += lift) for (let x = sx0; x < sx1 - .5; x += bay) { const a = (flip++ % 2) === 0; scPts.push(x, y + (a ? 0 : lift), sz + 1, x + bay, y + (a ? lift : 0), sz + 1); }
    const scaff = new T.Group(); root.add(scaff);
    const scGeo = new T.BufferGeometry(); scGeo.setAttribute('position', new T.Float32BufferAttribute(scPts, 3));
    scaff.add(new T.LineSegments(scGeo, M.scaff));
    for (let y = lift; y <= sTop; y += lift) { const pl = box(sx1 - sx0, .06, .9, M.slab, 0, y, sz + .5, scaff); pl.castShadow = true; }

    // ── Entrega: paisagismo, pessoas, luzes ──
    const eA = ST.entrega[0];
    const tree = (x, z, s, d) => {
      const g = new T.Group(); g.position.set(x, 0, z); root.add(g);
      const tr = new T.Mesh(new T.CylinderGeometry(.12 * s, .16 * s, 2.2 * s, 8), M.trunk); tr.position.y = 1.1 * s; tr.castShadow = true; g.add(tr);
      const f = new T.Mesh(new T.IcosahedronGeometry(1.5 * s, 1), M.leaf); f.position.y = 2.9 * s; f.scale.set(1, .9, 1); f.castShadow = true; g.add(f);
      const f2 = new T.Mesh(new T.IcosahedronGeometry(1.05 * s, 1), M.leaf); f2.position.set(.7 * s, 3.6 * s, .2 * s); f2.castShadow = true; g.add(f2);
      add(g, eA + d, eA + d + .06, 'pop');
    };
    tree(-8.6, 8.4, 1.2, .01); tree(8.8, 8.6, 1.35, .03); tree(-9.4, -1.5, 1.1, .05); tree(9.6, -3, 1.0, .06); tree(-16, 9, 1.4, .07); tree(17, 9.4, 1.2, .08); tree(-22, 2, 1.3, .09); tree(23, 0, 1.25, .1);
    for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(.42, 0), M.leaf); b.position.set(-5.4 + i * .75, .35, Z + 1.9); b.castShadow = true; root.add(b); add(b, eA + .02 + i * .006, eA + .07 + i * .006, 'pop'); }
    add(box(4.8, .5, .9, M.dark, -3.5, 0, Z + 1.9), eA, eA + .04, 'rise');
    const person = (x, z, s = 1, d = 0) => {
      const g = new T.Group(); g.position.set(x, 0, z); root.add(g);
      const body = new T.Mesh(new T.CylinderGeometry(.17 * s, .24 * s, 1.45 * s, 10), M.person); body.position.y = .72 * s; body.castShadow = true; g.add(body);
      const head = new T.Mesh(new T.SphereGeometry(.13 * s, 12, 8), M.person); head.position.y = 1.62 * s; head.castShadow = true; g.add(head);
      add(g, eA + .05 + d, eA + .1 + d, 'pop');
    };
    person(-2.1, Z + 3.5, 1, 0); person(-1.5, Z + 3.8, .96, .01); person(4.6, Z + 5.6, 1.02, .02); person(9.8, 9.9, .98, .03); person(-11, 10.2, 1, .04);
    const posts = [];
    for (let i = 0; i < 5; i++) { const x = -6 + i * 3; add(box(.14, .55, .14, M.dark, x, 0, Z + 3.2), eA + .03, eA + .06, 'rise'); const s = box(.15, .1, .15, M.glow, x, .55, Z + 3.2); s.castShadow = false; posts.push(s); }
    const lamp = (x, z, d) => { add(box(.12, 4.2, .12, M.dark, x, 0, z), eA + d, eA + d + .05, 'rise'); add(box(.9, .1, .3, M.dark, x + .4, 4.2, z), eA + d + .04, eA + d + .06, 'rise'); const g = box(.6, .06, .22, M.glow, x + .5, 4.14, z); g.castShadow = false; return g; };
    const lamps = [lamp(-13, 11.6, .02), lamp(0, 11.6, .04), lamp(13, 11.6, .06)];

    // brilho (bloom falso) e poças de luz no chão
    const gc = document.createElement('canvas'); gc.width = gc.height = 128;
    const gx = gc.getContext('2d'), grd = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.35, 'rgba(255,255,255,.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    gx.fillStyle = grd; gx.fillRect(0, 0, 128, 128);
    const glowTex = new T.CanvasTexture(gc);
    const sprites = [];
    const sprite = (x, y, z, sx, sy, k, color = '#ffc488') => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      s.position.set(x, y, z); s.scale.set(sx, sy, 1); s.userData.k = k; s.renderOrder = 5; scene.add(s); sprites.push(s); return s;
    };
    const pool = (x, z, r, k) => {
      const m = new T.Mesh(new T.PlaneGeometry(r, r), new T.MeshBasicMaterial({ map: glowTex, color: '#ffbf80', blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, .03, z); m.userData.k = k; scene.add(m); sprites.push(m);
    };
    glowSpots.forEach(([m, sx, sy, k]) => { const s = sprite(m.position.x, m.position.y + 1, m.position.z + .9, sx, sy, k * .55); s.userData.host = m; });
    posts.forEach(p => { sprite(p.position.x, .6, p.position.z, 1.1, 1.1, .9); pool(p.position.x, p.position.z, 3.2, .45); });
    lamps.forEach(g => { sprite(g.position.x, 4, g.position.z, 2.2, 2.2, .9); pool(g.position.x, g.position.z, 9, .38); });

    // ── Grua ──
    const crane = new T.Group(); crane.position.set(-11.5, 0, -7.5); scene.add(crane);
    const mastH = 21, cranePts = [];
    const lattice = (x0, y0, z0, x1, y1, z1, size, step) => {
      const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), n = Math.max(1, Math.round(len / step));
      const dir = [(x1 - x0) / len, (y1 - y0) / len, (z1 - z0) / len], up = Math.abs(dir[1]) > .9 ? [1, 0, 0] : [0, 1, 0];
      const u = [up[1] * dir[2] - up[2] * dir[1], up[2] * dir[0] - up[0] * dir[2], up[0] * dir[1] - up[1] * dir[0]];
      const v = [dir[1] * u[2] - dir[2] * u[1], dir[2] * u[0] - dir[0] * u[2], dir[0] * u[1] - dir[1] * u[0]];
      const s = size / 2, corner = (t, i) => { const cu = [-s, s, s, -s][i], cv = [-s, -s, s, s][i]; return [x0 + dir[0] * len * t + u[0] * cu + v[0] * cv, y0 + dir[1] * len * t + u[1] * cu + v[1] * cv, z0 + dir[2] * len * t + u[2] * cu + v[2] * cv]; };
      for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n; for (let i = 0; i < 4; i++) { const a = corner(t0, i), b = corner(t1, i), c = corner(t0, (i + 1) % 4), d = corner(t1, (i + 1) % 4); cranePts.push(...a, ...b, ...a, ...c, ...(k % 2 ? a : c), ...(k % 2 ? d : b)); } }
    };
    lattice(0, 0, 0, 0, mastH, 0, 1.1, 1.1);
    for (const [x, z] of [[-.55, -.55], [.55, -.55], [.55, .55], [-.55, .55]]) box(.09, mastH, .09, M.crane, x, 0, z, crane).receiveShadow = false;
    const top = new T.Group(); top.position.y = mastH; crane.add(top);
    const jib0 = cranePts.length;
    lattice(.6, .2, 0, 24, .2, 0, .9, 1.4); lattice(-.6, .2, 0, -8, .2, 0, .9, 1.4); lattice(0, 0, 0, 0, 3.4, 0, .8, .85);
    const craneLine = new T.LineBasicMaterial({ color: '#a8734c' });
    const mg = new T.BufferGeometry(); mg.setAttribute('position', new T.Float32BufferAttribute(cranePts.slice(0, jib0), 3)); crane.add(new T.LineSegments(mg, craneLine));
    const jg = new T.BufferGeometry(); jg.setAttribute('position', new T.Float32BufferAttribute(cranePts.slice(jib0), 3)); top.add(new T.LineSegments(jg, craneLine));
    box(24, .12, .9, M.crane, 12.3, .14, 0, top).receiveShadow = false;
    box(7.4, .12, .9, M.crane, -4.3, .14, 0, top);
    box(2.2, 1.8, 1.6, M.concrete, -7, -1.5, 0, top);
    box(1.4, 1.3, 1.3, M.dark, 1.2, -1.3, .9, top);
    const tie = new T.BufferGeometry(); tie.setAttribute('position', new T.Float32BufferAttribute([0, 3.4, 0, 22, .3, 0, 0, 3.4, 0, -7.6, .3, 0], 3)); top.add(new T.LineSegments(tie, craneLine));
    const trolley = new T.Group(); top.add(trolley);
    box(.8, .3, .9, M.dark, 0, -.2, 0, trolley);
    const cable = new T.Mesh(new T.CylinderGeometry(.025, .025, 1, 4), M.dark); trolley.add(cable);
    const hook = new T.Group(); trolley.add(hook);
    box(.5, .5, .5, M.copper, 0, -.5, 0, hook);
    const load = box(3.2, .25, 1.4, M.slab, 0, -2.4, 0, hook);

    // ── Pontos de interesse e rótulos de pavimento (projetados para a tela) ──
    const anchors = {
      ripado: new T.Vector3(-.65, 11.2, Z + .3), vidro: new T.Vector3(-3.85, 8.2, Z + .1), pedra: new T.Vector3(3.3, 5.4, Z + .55), coroamento: new T.Vector3(3.2, 16.3, Z + .6)
    };
    const anchorF = { ripado: 3, vidro: 2, pedra: 1, coroamento: 5 };
    const floorPts = [0, 1, 2, 3, 4, 5].map(k => new T.Vector3(-X - .4, (k < 5 ? L[k] + 1.6 : L[5] + .25), Z));

    // ── Estado ──
    let progress = 0, target = 0, time = 0, intro = 0, running = false, raf = 0, last = 0, snap = false, dtNow = 0;
    let mx = 0, my = 0, smx = 0, smy = 0;
    let mode = 'build', modeK = 0, nightOv = null, nCur = 0, ex = 0, exT = 0, userAz = 0, userAzT = 0, orbit = 0;
    const tgt = new T.Vector3(), v = new T.Vector3();
    const skyEl = opts.sky || null;
    const cTopNow = new T.Color(), cHorNow = new T.Color();
    let lastSky = -1;

    function apply(p) {
      for (const it of items) {
        const t = seg(p, it.a, it.b), o = it.obj;
        o.visible = t > 0.001;
        if (!o.visible) continue;
        if (it.kind === 'rise') o.scale.y = Math.max(.001, easeOut(t));
        else if (it.kind === 'drop') o.userData.dy = it.h * (1 - easeOut(t));
        else if (it.kind === 'pop') o.scale.setScalar(Math.max(.001, back(t)));
      }
      const exE = ease(ex);
      for (const m of movers) m.position.y = m.userData.y0 + (m.userData.dy || 0) + (m.userData.f != null ? m.userData.f * GAP * exE : 0);
      M.stone.color.copy(STONE_DAY).lerp(STONE, seg(p, fA, fA + .08));
      const auto = ease(seg(p, ST.entrega[0] + .02, 1));
      const nT = mode === 'night' ? 1 : (nightOv != null && p > .9 ? nightOv : auto);
      if (snap) nCur = nT; else nCur += (nT - nCur) * Math.min(1, dtNow * 3); if (Math.abs(nT - nCur) < .001) nCur = nT;
      const n = nCur;
      M.glass.opacity = .64 * seg(p, glassOn[0], glassOn[1]) * (1 - .6 * n); M.rail.opacity = .4 * seg(p, fA + .04, fA + .12);
      wireMat.opacity = (1 - seg(p, ST.vedacao[0] + .04, ST.fachada[0] + .04)) * intro;
      wireGeo.setDrawRange(0, Math.floor(wireCount * Math.min(intro, 1)) & ~1);
      grid.material.opacity = .16 * (1 - .75 * seg(p, ST.entrega[0], ST.entrega[0] + .1));
      // andaime
      const scIn = seg(p, ST.vedacao[0] - .02, ST.vedacao[1]), scOut = seg(p, ST.fachada[1] - .05, ST.fachada[1] + .02);
      const ss = easeOut(scIn) * (1 - ease(scOut));
      scaff.visible = ss > .002; scaff.scale.set(1, Math.max(.001, ss), 1); M.scaff.opacity = .9 * (1 - scOut);
      // grua
      const cs = easeOut(seg(p, ST.estrutura[0] - .04, ST.estrutura[0] + .03)) * (1 - ease(seg(p, ST.entrega[0], ST.entrega[0] + .07)));
      crane.visible = cs > .002; crane.scale.set(1, Math.max(.001, cs), 1);
      const lp = seg(p, ST.estrutura[0], ST.fachada[0]); load.visible = lp > 0 && lp < 1;
      // céu e luz
      cTopNow.copy(SKY.dayTop).lerp(SKY.nightTop, n); cHorNow.copy(SKY.dayHor).lerp(SKY.nightHor, n);
      scene.fog.color.copy(cHorNow);
      if (skyEl && Math.abs(n - lastSky) > .002) { lastSky = n; skyEl.style.setProperty('--sky-top', '#' + cTopNow.getHexString()); skyEl.style.setProperty('--sky-hor', '#' + cHorNow.getHexString()); }
      sun.intensity = lerp(2.2, .3, n); sun.color.set('#fff1de').lerp(SUNSET, n);
      hemi.intensity = lerp(.55, .5, n); hemi.color.set('#fff7ec').lerp(HSKY, n); hemi.groundColor.set('#b9ae9f').lerp(HGND, n);
      M.ground.color.copy(GDAY).lerp(GNIGHT, n); M.street.color.set('#d4cdc2').lerp(GNIGHT, n * .9);
      envMats.forEach(m => { m.envMapIntensity = lerp(1, .22, n); });
      M.lit.opacity = n; M.glow.opacity = n;
      sprites.forEach(s => { s.material.opacity = n * s.userData.k * (s.userData.host ? (s.userData.host.material === M.lit ? 1 : .45) : 1); if (s.userData.host) s.position.y = s.userData.host.position.y + 1; });
      renderer.toneMappingExposure = lerp(1, 1.18, n);
      return n;
    }
    lits.forEach((l, i) => { if ([2, 5, 6].includes(i)) l.material = M.lit.clone(); });
    const dimmed = lits.filter(l => l.material !== M.lit);

    function camera_(p, t, dt) {
      const e = ease(p), aspect = camera.aspect;
      const cr = Math.sin(Math.PI * seg(p, ST.estrutura[0] - .05, ST.entrega[0] + .05));
      const exE = ease(ex);
      // build
      let az = lerp(.95, -.5, e) + Math.sin(t * .12) * .03 + smx * .06 + userAz;
      let el = lerp(.42, .2, e) + smy * .03 + exE * .06;
      let r = lerp(66, 52, e) + cr * 8 + exE * 24;
      let ty = lerp(6, 8.4, e) + cr * 1.5 + exE * 9;
      // noite (contato): órbita lenta
      orbit += dt * .06;
      const azN = -.35 + Math.sin(orbit) * .55, elN = .16, rN = 54, tyN = 8.2;
      az = lerp(az, azN, modeK); el = lerp(el, elN, modeK); r = lerp(r, rN, modeK); ty = lerp(ty, tyN, modeK);
      if (aspect < 1) r *= lerp(1.95, 1.1, clamp((aspect - .45) / .55));
      camera.position.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r + 5, Math.cos(az) * Math.cos(el) * r);
      tgt.set(lerp(-1.5, 0, p), ty, 0);
      camera.lookAt(tgt);
    }

    const out = { anchors: {}, floors: [], p: 0, night: 0, explode: 0, front: true };
    function project(vec, fOff) {
      v.copy(vec); v.y += fOff;
      v.project(camera);
      return { x: (v.x + 1) / 2 * canvas.clientWidth, y: (1 - v.y) / 2 * canvas.clientHeight, on: v.z < 1 };
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; time += dt; dtNow = dt;
      if (snap) { modeK = mode === 'night' ? 1 : 0; ex = exT; userAz = userAzT; }
      intro = Math.min(1, intro + dt / 2.6);
      progress += (target - progress) * Math.min(1, dt * 7);
      smx += (mx - smx) * Math.min(1, dt * 3); smy += (my - smy) * Math.min(1, dt * 3);
      modeK += ((mode === 'night' ? 1 : 0) - modeK) * Math.min(1, dt * 2.2);
      ex += (exT - ex) * Math.min(1, dt * 2.6);
      if (progress < .88) { userAzT = 0; exT = 0; }
      userAz += (userAzT - userAz) * Math.min(1, dt * 6);
      top.rotation.y = -.35 + Math.sin(time * .22) * .55;
      trolley.position.x = 12 + Math.sin(time * .31) * 7;
      const drop = 6 + Math.sin(time * .4) * 3; cable.scale.y = drop; cable.position.y = -drop / 2; hook.position.y = -drop;
      dimmed.forEach(l => { l.material.opacity = M.lit.opacity * .45; });
      const n = apply(progress);
      camera_(progress, time, dt);
      renderer.render(scene, camera);
      snap = false;
      if (opts.onFrame) {
        const exE = ease(ex);
        out.p = progress; out.night = n; out.explode = exE; out.mode = mode;
        out.front = camera.position.z / Math.max(1, Math.hypot(camera.position.x, camera.position.z)) > .55;
        for (const k in anchors) out.anchors[k] = project(anchors[k], anchorF[k] * GAP * exE);
        out.floors = floorPts.map((pt, k) => project(pt, k * GAP * exE));
        opts.onFrame(out);
      }
    }

    function resize() {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      const shift = w / h > 1.2 ? Math.round(w * (opts.shift ?? .17)) : 0;
      if (shift) camera.setViewOffset(w, h, -shift, 0, w, h); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    resize();
    addEventListener('resize', resize);
    if (!mobile) addEventListener('pointermove', e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });

    return {
      set(p) { target = clamp(p); },
      jump(p) { target = progress = clamp(p); intro = 1; snap = true; },
      snap() { snap = true; },
      mode(m) { if (m === mode) return; mode = m; if (m === 'night') { if (progress < .97) { target = progress = 1; intro = 1; } exT = 0; userAzT = 0; } },
      rotate(dx) { userAzT = clamp(userAzT - dx * .006, -2.6, 2.6); },
      night(v) { nightOv = v; },
      explode(on) { exT = on ? 1 : 0; },
      start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } },
      stop() { running = false; cancelAnimationFrame(raf); },
      renderOnce() { if (snap) { modeK = mode === 'night' ? 1 : 0; ex = exT; userAz = userAzT; } const n = apply(progress); camera_(progress, time, 0); renderer.render(scene, camera); snap = false; return n; },
      resize,
      stage(p) { return Object.keys(ST).findIndex(k => p >= ST[k][0] && p < ST[k][1] + (k === 'entrega' ? .001 : 0)); },
      level(p) { const t = seg(p, sA, sB); return L[Math.min(5, Math.floor(t * nF + (t > 0 ? .5 : 0)))] ?? 0; },
      get progress() { return progress; },
      stages: ST
    };
  };
})();
