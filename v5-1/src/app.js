/* VIA OPUS 5.1 — interações (base 5.0 + tijolos e concreto da 4.0). Nada é enviado por este site: os botões apenas abrem o WhatsApp. */
(() => {
  'use strict';
  const d = document, root = d.documentElement, $ = (s, c = d) => c.querySelector(s), $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const H = () => innerHeight;
  const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  /* ── maquete 3D (canvas fixo que atravessa a página) ── */
  const cant = $('#canteiro'), ui = $('.cant-ui'), contato = $('#contato');
  const hud = $('.hud'), floorsBox = $('.floors'), hsEls = $$('.hs'), flEls = $$('.fl');
  const mobile = matchMedia('(max-width: 899px)').matches || matchMedia('(pointer: coarse)').matches;
  let obra = null, night = 0, frameP = 0;
  function onFrame(s) {
    frameP = s.p; night = s.night;
    cant.classList.toggle('is-dusk', s.night > .5 && s.mode !== 'night');
    // pontos de interesse
    const show = s.mode === 'build' && s.p > .86 && s.explode < .2 && s.front && cantActive;
    hud.classList.toggle('on', show);
    if (show || hud.classList.contains('on')) for (const el of hsEls) {
      const a = s.anchors[el.dataset.hs]; if (!a) continue;
      el.style.transform = `translate3d(${a.x.toFixed(1)}px,${a.y.toFixed(1)}px,0)`;
      el.classList.toggle('left', a.x > innerWidth * .7);
    }
    // pavimentos na vista explodida
    const fon = s.explode > .35 && s.mode === 'build' && cantActive;
    floorsBox.classList.toggle('on', fon);
    if (fon) flEls.forEach((el, i) => { const f = s.floors[i]; el.style.transform = `translate3d(calc(${f.x.toFixed(1)}px - 100% - 30px),calc(${f.y.toFixed(1)}px - 50%),0)`; });
  }
  if (!reduced && typeof window.ViaOpusObra === 'function') {
    root.classList.add('has-3d'); // o canvas precisa estar visível para medir o tamanho
    try { obra = window.ViaOpusObra($('.stage3d'), { mobile, sky: $('.sky'), onFrame }); } catch (err) { obra = null; }
  }
  if (obra) requestAnimationFrame(() => obra.resize());
  else { root.classList.remove('has-3d'); cant.dataset.theme = 'dark'; }

  /* ── carregando ── */
  const pctEl = $('[data-pct]');
  let ready = false;
  const finish = () => { if (ready) return; ready = true; pctEl.textContent = 100; setTimeout(() => root.classList.add('is-ready'), 200); };
  if (reduced) finish();
  else {
    const t0 = performance.now(), min = 1700;
    let loaded = d.readyState === 'complete';
    addEventListener('load', () => { loaded = true; }, { once: true });
    const tick = t => { if (ready) return; const k = clamp((t - t0) / min); pctEl.textContent = Math.round((loaded ? k : Math.min(k, .9)) * 100); if (k >= 1 && loaded) finish(); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    setTimeout(finish, 4500);
  }

  /* ── canteiro: etapas, cota, explorar ── */
  const etapasLi = $$('.cant-etapas li'), stN = $('[data-st-n]'), stT = $('[data-st-t]'), stD = $('[data-st-d]'), cota = $('[data-cota]'), cline = $('.cant-line i');
  const etapas = etapasLi.map(li => ({ t: $('.ce-t', li).textContent, d: $('.ce-d', li).textContent }));
  let stage = 0, swapT = 0, cantActive = false;
  const fmtCota = v => '+' + v.toFixed(2).padStart(5, '0').replace('.', ',');
  function setStage(i) {
    if (i === stage || i < 0) return;
    stage = i; stN.textContent = String(i + 1).padStart(2, '0');
    stT.classList.add('swap'); stD.classList.add('swap'); clearTimeout(swapT);
    swapT = setTimeout(() => { stT.textContent = etapas[i].t; stD.textContent = etapas[i].d; stT.classList.remove('swap'); stD.classList.remove('swap'); }, 260);
    etapasLi.forEach((li, k) => li.classList.toggle('on', k <= i));
  }
  if (etapasLi[0]) etapasLi[0].classList.add('on');
  function cantUpdate() {
    if (!obra) return;
    const r = cant.getBoundingClientRect(), h = H();
    cantActive = r.top <= 1 && r.bottom >= h - 1;
    const p = clamp(-r.top / Math.max(1, cant.offsetHeight - h));
    obra.set(p);
    ui.style.setProperty('--ho', (1 - clamp(p / .05)).toFixed(3));
    ui.style.setProperty('--hy', (-clamp(p / .06) * 80).toFixed(1) + 'px');
    ui.style.setProperty('--bo', clamp(p / .05).toFixed(3));
    const so = clamp((p - .035) / .03) * (1 - clamp((p - .86) / .03));
    ui.style.setProperty('--so', so.toFixed(3));
    ui.style.setProperty('--sy', ((1 - clamp((p - .035) / .03)) * 20).toFixed(1) + 'px');
    const fo = clamp((p - .9) / .035);
    ui.style.setProperty('--fo', fo.toFixed(3));
    ui.style.setProperty('--fy', ((1 - fo) * 24).toFixed(1) + 'px');
    ui.style.setProperty('--fv', fo > .01 ? 'visible' : 'hidden');
    cant.classList.toggle('can-explore', fo > .5);
    setStage(obra.stage(p));
    cota.textContent = fmtCota(obra.level(p));
    cline.style.setProperty('--p', p.toFixed(4));
  }
  // explorar: dia/noite, vista explodida, girar arrastando
  const xbNight = $('[data-x="night"]'), xbEx = $('[data-x="explode"]');
  const label = (b, on) => { b.setAttribute('aria-pressed', String(on)); $('span', b).textContent = on ? b.dataset.on : b.dataset.off; };
  if (obra) {
    let isNight = true, isEx = false;
    xbNight.addEventListener('click', () => { isNight = !isNight; obra.night(isNight ? 1 : 0); label(xbNight, isNight); });
    xbEx.addEventListener('click', () => { isEx = !isEx; obra.explode(isEx); label(xbEx, isEx); });
    const drag = $('.cant-drag');
    let dx0 = null;
    drag.addEventListener('pointerdown', ev => { dx0 = ev.clientX; drag.setPointerCapture(ev.pointerId); });
    drag.addEventListener('pointermove', ev => { if (dx0 == null) return; obra.rotate(ev.clientX - dx0); dx0 = ev.clientX; });
    const up = () => { dx0 = null; };
    drag.addEventListener('pointerup', up); drag.addEventListener('pointercancel', up);
    // pontos de interesse
    hsEls.forEach(el => $('.hs-b', el).addEventListener('click', ev => {
      ev.stopPropagation();
      const open = !el.classList.contains('open');
      hsEls.forEach(o => { o.classList.remove('open'); $('.hs-b', o).setAttribute('aria-expanded', 'false'); });
      el.classList.toggle('open', open); $('.hs-b', el).setAttribute('aria-expanded', String(open));
    }));
    d.addEventListener('click', () => hsEls.forEach(o => { o.classList.remove('open'); $('.hs-b', o).setAttribute('aria-expanded', 'false'); }));
    // liga a renderização só quando a maquete aparece (canteiro ou contato)
    const vis = new Set();
    const ioS = new IntersectionObserver(entries => {
      entries.forEach(en => en.isIntersecting ? vis.add(en.target) : vis.delete(en.target));
      if (vis.size) obra.start(); else obra.stop();
    }, { rootMargin: '80px' });
    ioS.observe(cant); ioS.observe(contato);
  } else { $('.explore').hidden = true; }

  /* ── textos: palavra por palavra + fonte variável ── */
  const wrapWords = el => {
    let n = 0;
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 3) {
          const parts = ch.textContent.split(/(\s+)/);
          const frag = d.createDocumentFragment();
          parts.forEach(pt => {
            if (!pt) return;
            if (/^\s+$/.test(pt)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span'); w.className = 'w';
            const wi = d.createElement('span'); wi.className = 'wi'; wi.textContent = pt; wi.style.setProperty('--wi', n++);
            w.appendChild(wi); frag.appendChild(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
  };
  const wrapChars = el => {
    const walk = node => [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = d.createDocumentFragment();
        for (const c of ch.textContent) { if (/\s/.test(c)) { frag.appendChild(d.createTextNode(c)); continue; } const s = d.createElement('span'); s.className = 'ch'; s.textContent = c; frag.appendChild(s); }
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) walk(ch);
    });
    walk(el);
  };
  if (!reduced) $$('[data-split]').forEach(el => { const label = el.textContent.replace(/\s+/g, ' ').trim(); el.setAttribute('aria-label', label); wrapWords(el); $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true')); });
  const vfEls = fine && !reduced ? $$('[data-vf]') : [];
  vfEls.forEach(el => { if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim()); wrapChars(el); $$('.ch', el).forEach(c => c.setAttribute('aria-hidden', 'true')); });
  if (vfEls.length) {
    let px = -999, py = -999, pend = false;
    const upd = () => {
      pend = false;
      vfEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        $$('.ch', el).forEach(c => { const b = c.getBoundingClientRect(); const dd = Math.hypot(b.left + b.width / 2 - px, b.top + b.height / 2 - py); c.style.setProperty('--wg', Math.round(300 + 380 * Math.max(0, 1 - dd / 240))); });
      });
    };
    addEventListener('pointermove', ev => { px = ev.clientX; py = ev.clientY; if (!pend) { pend = true; requestAnimationFrame(upd); } }, { passive: true });
  }

  /* ── revelações ── */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const t = en.target;
    if (t.matches('[data-reveal],[data-split]')) t.classList.add('is-in');
    if (t.matches('.build')) { t.classList.add('is-built'); if (t.matches('.bricky') && !reduced) setTimeout(() => lay(t), 1100); }
    if (t.matches('[data-ba]')) baIntro(t);
    io.unobserve(t);
  }), { threshold: .25, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal],[data-split],.build').forEach(el => io.observe(el));

  /* ── tijolo por tijolo: a foto é assentada sobre o traço ── */
  async function lay(el) {
    const box = $('.pf-skew', el) || el, img = $('.foto img', el);
    if (!img.complete || !img.naturalWidth) await new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
    const src = img.currentSrc || img.src, W = box.clientWidth, Hh = box.clientHeight;
    if (!W || !Hh || !img.naturalWidth) { el.classList.add('is-laid'); return; }
    // mesmo enquadramento do object-fit: cover
    const sc = Math.max(W / img.naturalWidth, Hh / img.naturalHeight), bw = img.naturalWidth * sc, bh = img.naturalHeight * sc, ox = (W - bw) / 2, oy = (Hh - bh) / 2;
    const rows = W < 600 ? 7 : 9, th = Hh / rows, tw = th * 2.3;
    const layer = d.createElement('span'); layer.className = 'brick-layer';
    layer.style.setProperty('--src', `url("${src}")`);
    let max = 0;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? -tw / 2 : 0, fromBottom = rows - 1 - r;
      for (let x = off, c = 0; x < W; x += tw, c++) {
        const b = d.createElement('span'), st = b.style; b.className = 'brick';
        st.left = x + 'px'; st.top = r * th + 'px'; st.width = tw + 'px'; st.height = th + 'px';
        st.backgroundImage = 'var(--src)'; st.backgroundSize = `${bw}px ${bh}px`; st.backgroundPosition = `${ox - x}px ${oy - r * th}px`;
        const delay = fromBottom * 115 + c * 26 + Math.random() * 70; st.animationDelay = delay.toFixed(0) + 'ms'; max = Math.max(max, delay);
        layer.appendChild(b);
      }
    }
    const xr = $('.xray', box); box.insertBefore(layer, xr || null);
    setTimeout(() => el.classList.add('is-laid'), max + 800);
    setTimeout(() => layer.remove(), max + 1800);
  }

  /* ── galeria: raio-x, inclinação e distorção pela velocidade ── */
  const pfMedia = $$('.pf-media'), gal = $('.gal');
  if (fine && !reduced) pfMedia.forEach(m => {
    m.addEventListener('pointermove', ev => {
      const r = m.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      m.style.setProperty('--mx', (ev.clientX - r.left) + 'px'); m.style.setProperty('--my', (ev.clientY - r.top + r.height * .05) + 'px');
      m.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg'); m.style.setProperty('--rx', ((.5 - y) * 5).toFixed(2) + 'deg');
    });
    m.addEventListener('pointerleave', () => { m.style.setProperty('--ry', '0deg'); m.style.setProperty('--rx', '0deg'); });
  });
  let vel = 0, skew = 0, lastSc = scrollY;

  /* ── antes e depois ── */
  const ba = $('[data-ba]');
  let baTouched = false;
  if (ba) {
    const range = $('.ba-range', ba);
    const set = p => { p = clamp(p, 0, 100); ba.style.setProperty('--pos', p + '%'); range.value = Math.round(p); };
    const fromEvent = ev => { const r = ba.getBoundingClientRect(); return (ev.clientX - r.left) / r.width * 100; };
    let dragging = false, sx = 0, sy = 0, decided = false;
    ba.addEventListener('pointerdown', ev => { baTouched = true; dragging = true; decided = ev.pointerType === 'mouse'; sx = ev.clientX; sy = ev.clientY; if (decided) { ba.setPointerCapture(ev.pointerId); ba.classList.add('is-drag'); set(fromEvent(ev)); } });
    ba.addEventListener('pointermove', ev => {
      if (!dragging) return;
      if (!decided) { const dx = Math.abs(ev.clientX - sx), dy = Math.abs(ev.clientY - sy); if (dx < 6 && dy < 6) return; if (dy > dx) { dragging = false; return; } decided = true; ba.setPointerCapture(ev.pointerId); ba.classList.add('is-drag'); }
      set(fromEvent(ev));
    });
    const end = ev => { if (dragging && !decided && ev.type === 'pointerup') set(fromEvent(ev)); dragging = false; ba.classList.remove('is-drag'); };
    ba.addEventListener('pointerup', end); ba.addEventListener('pointercancel', end);
    range.addEventListener('input', () => { baTouched = true; set(+range.value); });
  }
  function baIntro(el) {
    if (reduced || baTouched) return;
    const keys = [[0, 50], [700, 84], [1700, 16], [2600, 50]], t0 = performance.now() + 350;
    const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    const step = t => {
      if (baTouched) return;
      const e = t - t0; if (e < 0) return requestAnimationFrame(step);
      const i = keys.findIndex(k => k[0] > e);
      if (i === -1) { el.style.setProperty('--pos', '50%'); return; }
      const [ta, va] = keys[i - 1], [tb, vb] = keys[i];
      el.style.setProperty('--pos', (va + (vb - va) * ease((e - ta) / (tb - ta))) + '%');
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── números que enchem de concreto ── */
  const fills = $$('[data-fill]');
  if (!reduced) fills.forEach(f => f.style.setProperty('--fill', 0));

  /* ── processo: linha que se desenha ── */
  const pathBox = $('[data-path]'), pathFg = $('.path-fg'), pathV = $('.path-v'), passos = $$('.ps');
  let stops = [1 / 6, .5, 5 / 6];
  if (pathFg && pathFg.getTotalLength) {
    try { const len = pathFg.getTotalLength(); stops = [200, 600, 1000].map(xx => { let best = 0, bd = 1e9; for (let s = 0; s <= 240; s++) { const pt = pathFg.getPointAtLength(len * s / 240); const dd = Math.abs(pt.x - xx); if (dd < bd) { bd = dd; best = s / 240; } } return best; }); pathFg.setAttribute('pathLength', '1'); } catch (err) { /* mantém aproximação */ }
  }
  if (reduced) passos.forEach(s => s.classList.add('on'));
  else if (pathBox) { pathBox.style.setProperty('--p', 0); }

  /* ── cabeçalho, elevador, progresso, rolagem ── */
  const hd = $('.hd'), bar = $('.progress i'), float = $('.wa-float'), elev = $('.elev'), floorNow = $('[data-floor-now]');
  const floorLinks = $$('.elev a'), floorSecs = floorLinks.map(a => $(a.getAttribute('href')));
  const navLinks = $$('.hd-nav a'), navSecs = navLinks.map(a => $(a.getAttribute('href')));
  const themed = $$('[data-theme]');
  let lastY = scrollY, ticking = false;
  const isDark = s => s && (s.dataset.theme === 'dark' || (s === cant && cant.classList.contains('is-dusk')));

  function onScroll() {
    ticking = false;
    const y = scrollY, h = H();
    cantUpdate();
    if (obra) { const cr = contato.getBoundingClientRect(); obra.mode(cr.top < h * .9 ? 'night' : 'build'); }
    hd.classList.toggle('is-solid', y > 40);
    if (!$('.mm[open]') && y > h * .9 && y > lastY + 4) hd.classList.add('is-hidden');
    if (y < lastY - 4) hd.classList.remove('is-hidden');
    lastY = y;
    const under = themed.find(s => { const r = s.getBoundingClientRect(); return r.top <= 50 && r.bottom > 50; });
    hd.classList.toggle('on-dark', isDark(under));
    const mid = themed.find(s => { const r = s.getBoundingClientRect(); return r.top <= h / 2 && r.bottom > h / 2; });
    if (elev) elev.classList.toggle('on-dark', isDark(mid));
    let cur = 0; floorSecs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < h * .5) cur = i; });
    floorLinks.forEach((a, i) => i === cur ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current'));
    if (floorNow && floorLinks[cur]) floorNow.textContent = $('b', floorLinks[cur]).textContent;
    navLinks.forEach((a, i) => { const r = navSecs[i] && navSecs[i].getBoundingClientRect(); a.classList.toggle('is-on', !!r && r.top < h * .5 && r.bottom > h * .5); });
    const max = root.scrollHeight - h;
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    const cr2 = contato.getBoundingClientRect(), kr = cant.getBoundingClientRect();
    float.classList.toggle('is-on', kr.bottom < h * .6 && cr2.top > h * .6);
    if (reduced) return;
    if (ba) { const r = ba.getBoundingClientRect(), p = clamp((h - r.top) / (h * .75)); ba.style.setProperty('--sc', (.9 + .1 * p).toFixed(4)); ba.style.setProperty('--br', (18 * (1 - p) + 4).toFixed(1) + 'px'); }
    fills.forEach(f => { const r = f.getBoundingClientRect(); f.style.setProperty('--fill', (clamp((h * .92 - r.top) / (h * .5)) * 100).toFixed(1)); });
    if (pathBox) {
      const r = pathBox.getBoundingClientRect(), p = clamp((h * .72 - r.top) / (r.height * .8));
      pathBox.style.setProperty('--p', p.toFixed(4));
      const desk = innerWidth >= 1000;
      passos.forEach((s, i) => s.classList.toggle('on', desk ? p >= stops[i] - .01 : p * r.height >= s.offsetTop + 10));
    }
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  addEventListener('load', req);
  onScroll();

  // distorção leve da galeria pela velocidade da rolagem
  if (!reduced && gal) {
    const loopSkew = () => {
      const y = scrollY; vel = y - lastSc; lastSc = y;
      skew += (clamp(vel * .06, -3, 3) - skew) * .12;
      if (Math.abs(skew) > .01) gal.style.setProperty('--skew', skew.toFixed(3) + 'deg'); else gal.style.removeProperty('--skew');
      requestAnimationFrame(loopSkew);
    };
    requestAnimationFrame(loopSkew);
  }

  /* ── rolagem suave com inércia (computador) ── */
  if (fine && !reduced) {
    let ty = scrollY, sy = scrollY, smoothing = false;
    const maxY = () => root.scrollHeight - innerHeight;
    const step = () => {
      sy += (ty - sy) * .11;
      if (Math.abs(ty - sy) < .5) { sy = ty; smoothing = false; }
      scrollTo({ top: sy, behavior: 'instant' });
      if (smoothing) requestAnimationFrame(step);
    };
    addEventListener('wheel', ev => {
      if (ev.ctrlKey || ev.defaultPrevented || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;
      if (ev.target.closest && ev.target.closest('dialog,textarea,.mm-panel')) return;
      if (d.body.style.overflow === 'hidden') return;
      ev.preventDefault();
      const k = ev.deltaMode === 1 ? 32 : ev.deltaMode === 2 ? innerHeight : 1;
      if (!smoothing) { sy = scrollY; ty = scrollY; }
      ty = clamp(ty + ev.deltaY * k, 0, maxY());
      if (!smoothing) { smoothing = true; requestAnimationFrame(step); }
    }, { passive: false });
    addEventListener('scroll', () => { if (!smoothing) { ty = sy = scrollY; } }, { passive: true });
    d.addEventListener('click', ev => { const a = ev.target.closest && ev.target.closest('a[href^="#"]'); if (a) smoothing = false; });
  }

  /* ── menu do celular ── */
  const mm = $('.mm');
  if (mm) {
    $$('a', mm).forEach(a => a.addEventListener('click', () => mm.removeAttribute('open')));
    mm.addEventListener('toggle', () => { d.body.style.overflow = mm.open ? 'hidden' : ''; if (mm.open) hd.classList.remove('is-hidden'); });
  }

  /* ── cursor e botões magnéticos ── */
  if (fine && !reduced) {
    const cur = $('.cursor'), lab = $('span', cur);
    let cx = -100, cy = -100, tx = -100, tyy = -100;
    addEventListener('pointermove', ev => { tx = ev.clientX; tyy = ev.clientY; }, { passive: true });
    const loop = () => { cx += (tx - cx) * .2; cy += (tyy - cy) * .2; cur.style.setProperty('--cx', cx + 'px'); cur.style.setProperty('--cy', cy + 'px'); requestAnimationFrame(loop); };
    loop();
    d.addEventListener('pointerover', ev => {
      const t = ev.target.closest('[data-cursor]');
      if (t) { lab.textContent = t.dataset.cursor; cur.classList.add('is-label'); } else cur.classList.remove('is-label');
      cur.classList.toggle('is-hidden', !!ev.target.closest('a:not([data-cursor]),button,input,textarea,summary,.cant-drag'));
    });
    d.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    $$('[data-magnetic]').forEach(b => {
      b.addEventListener('pointermove', ev => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(ev.clientX - r.left - r.width / 2) * .18}px,${(ev.clientY - r.top - r.height / 2) * .28}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ── estudo (diálogo) com View Transitions ── */
  const dlg = $('#study'), data = JSON.parse($('#obras-data').textContent || '[]');
  const cards = $$('.pf');
  let idx = 0, fromImg = null;
  if (dlg && typeof dlg.showModal === 'function') {
    const foto = $('.study-foto', dlg), tr = $('.study-traco', dlg), tog = $('.study-toggle', dlg);
    const fill = i => {
      idx = (i + data.length) % data.length;
      const o = data[idx], ci = cards[idx] && $('.foto img', cards[idx]);
      dlg.classList.remove('show-traco'); tog.setAttribute('aria-pressed', 'false'); tog.textContent = tog.dataset.a;
      foto.src = ci ? (ci.currentSrc || ci.src) : `assets/${o.imagem}-1536.webp`; foto.alt = o.alt;
      tr.hidden = !o.traco; tog.hidden = !o.traco; if (o.traco) tr.src = o.traco;
      $('[data-s-area]', dlg).textContent = o.area;
      $('#study-t').textContent = o.titulo + (o.subtitulo ? ` (${o.subtitulo})` : '');
      $('[data-s-desc]', dlg).textContent = o.descricao;
      const f = $('[data-s-ficha]', dlg);
      f.hidden = !o.ficha;
      if (o.ficha) { $$('[data-f]', f).forEach(dd => { dd.textContent = o.ficha[dd.dataset.f] || '—'; }); $('[data-s-ex]', f).hidden = !o.ficha.exemplo; $('[data-s-note]', f).hidden = !o.ficha.exemplo; }
      $('.study-wa', dlg).href = o.wa;
      $('[data-s-count]', dlg).textContent = `${String(idx + 1).padStart(2, '0')} / ${String(data.length).padStart(2, '0')}`;
    };
    const vt = typeof d.startViewTransition === 'function' && !reduced;
    const open = i => {
      fromImg = cards[i] && $('.foto img', cards[i]);
      if (!vt || !fromImg) { fill(i); dlg.showModal(); d.body.style.overflow = 'hidden'; return; }
      fromImg.style.viewTransitionName = 'study-photo';
      const tvt = d.startViewTransition(() => { fromImg.style.viewTransitionName = ''; fill(i); foto.style.viewTransitionName = 'study-photo'; dlg.showModal(); d.body.style.overflow = 'hidden'; });
      tvt.finished.finally(() => { foto.style.viewTransitionName = ''; });
    };
    const close = () => {
      const target = cards[idx] && $('.foto img', cards[idx]);
      if (!vt || !target || !dlg.open) { dlg.close(); return; }
      foto.style.viewTransitionName = 'study-photo';
      const tvt = d.startViewTransition(() => { foto.style.viewTransitionName = ''; dlg.close(); target.style.viewTransitionName = 'study-photo'; });
      tvt.finished.finally(() => { target.style.viewTransitionName = ''; });
    };
    $$('[data-open]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); open(+b.dataset.open); }));
    dlg.addEventListener('close', () => { d.body.style.overflow = ''; });
    dlg.addEventListener('cancel', ev => { ev.preventDefault(); close(); });
    $('[data-s-close]', dlg).addEventListener('click', close);
    $('[data-s-prev]', dlg).addEventListener('click', () => fill(idx - 1));
    $('[data-s-next]', dlg).addEventListener('click', () => fill(idx + 1));
    dlg.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight') fill(idx + 1); if (ev.key === 'ArrowLeft') fill(idx - 1); });
    dlg.addEventListener('click', ev => { if (ev.target === dlg) close(); });
    tog.addEventListener('click', () => { const on = !dlg.classList.contains('show-traco'); dlg.classList.toggle('show-traco', on); tog.setAttribute('aria-pressed', String(on)); tog.textContent = on ? tog.dataset.b : tog.dataset.a; });
  }

  /* ── monte sua mensagem ── */
  const brief = $('[data-brief]');
  if (brief) {
    brief.hidden = false;
    const send = $('.brief-send', brief), out = $('.brief-msg', brief), extra = $('#brief-extra');
    const base = new URL(send.href), text = base.searchParams.get('text') || '';
    const [intro, origem] = text.split('\n\n');
    const update = () => {
      const lines = $$('.bq[data-q]', brief).map(g => { const on = $('.chip[aria-pressed="true"]', g); return on ? `${g.dataset.label}: ${on.textContent}` : null; }).filter(Boolean);
      const obs = extra.value.trim(); if (obs) lines.push(`${extra.dataset.obs}: ${obs}`);
      if (!lines.length) { out.textContent = out.dataset.empty; send.setAttribute('aria-disabled', 'true'); return; }
      const msg = `${intro}\n\n${lines.join('\n')}`;
      out.textContent = msg;
      send.href = `${base.origin}${base.pathname}?text=${encodeURIComponent(`${msg}\n\n${origem}`)}`;
      send.removeAttribute('aria-disabled');
    };
    $$('.chip', brief).forEach(ch => ch.addEventListener('click', () => { const was = ch.getAttribute('aria-pressed') === 'true'; $$('.chip', ch.parentElement).forEach(c => c.setAttribute('aria-pressed', 'false')); ch.setAttribute('aria-pressed', String(!was)); update(); }));
    extra.addEventListener('input', update);
    update();
  }
  void raf2; void frameP; void night;
})();
