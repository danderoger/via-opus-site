#!/usr/bin/env node
// VIA OPUS 5.1 — gera v5-1/site/ (base 5.0 + tijolos e concreto da 4.0).
// Uso: node scripts/build-v51.mjs   (não altera nenhuma versão anterior)
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V5 = path.join(ROOT, 'v5-1');
const OUT = path.join(V5, 'site');
const FONTS = path.join(V5, 'fonts'); // fontes versionadas dentro de v5-1/fonts (sem depender de versões antigas)

// Política de segurança embutida (compatível com os recursos locais do site; sem script/estilo inline).
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";

const e = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (t, vals = {}) => String(t).replace(/\{(\w+)\}/g, (_, k) => vals[k] ?? '');
const n2 = i => String(i + 1).padStart(2, '0');
const readJSON = async f => JSON.parse((await fs.readFile(f, 'utf8')).replace(/^\uFEFF/, ''));

const WA = '<svg class="ico-wa" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M12 3.2a8.8 8.8 0 0 0-7.55 13.33L3.2 20.8l4.4-1.15A8.8 8.8 0 1 0 12 3.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.1 7.9c.2-.4.45-.4.75-.4h.35c.18 0 .38.02.52.4l.62 1.5c.08.2.05.4-.08.56l-.5.6c-.12.15-.14.3-.04.48.5.9 1.2 1.6 2.2 2.1.2.1.36.1.5-.06l.7-.8c.15-.17.33-.2.53-.1l1.5.72c.2.1.3.2.3.38 0 .55-.28 1.1-.74 1.46-.5.4-1.15.5-1.8.3-2.7-.84-4.5-2.7-5.3-4.9-.2-.66-.02-1.3.39-1.84z" fill="currentColor"/></svg>';
const ARROW = '<svg class="ico-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const ICONS = [
  '<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" focusable="false"><path class="draw" pathLength="1" d="M8 12h32v20H22l-8 7v-7H8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path class="draw" pathLength="1" d="M15 20h18M15 25h12" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  '<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" focusable="false"><path class="draw" pathLength="1" d="M24 42s-12-12.5-12-21a12 12 0 0 1 24 0c0 8.5-12 21-12 21z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle class="draw" pathLength="1" cx="24" cy="21" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  '<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" focusable="false"><path class="draw" pathLength="1" d="M13 6h16l8 8v28H13z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path class="draw" pathLength="1" d="M29 6v8h8M18 22h14M18 28h14M18 34h9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'
];

async function fontsCss() {
  const face = async (fam, file, weight, style) => `@font-face{font-family:"${fam}";src:url(data:font/woff2;base64,${(await fs.readFile(path.join(FONTS, file))).toString('base64')}) format("woff2");font-weight:${weight};font-style:${style};font-display:swap}`;
  return [
    await face('Source Serif 4', 'source-serif-4-latin-opsz-normal.woff2', '200 900', 'normal'),
    await face('Source Serif 4', 'source-serif-4-latin-opsz-italic.woff2', '200 900', 'italic'),
    await face('Instrument Sans', 'instrument-sans-latin-wght-normal.woff2', '400 700', 'normal')
  ].join('\n') + '\n';
}

async function main() {
  const [site, port] = await Promise.all([readJSON(path.join(V5, 'content/site.json')), readJSON(path.join(V5, 'content/portfolio.json'))]);
  const assetVersion = String(process.env.VIA_OPUS_COMMIT || Date.now()).slice(0,12).replace(/[^a-z0-9.-]/gi, '');
  const has = rel => existsSync(path.join(V5, rel));
  const missing = [];
  const need = key => { for (const w of [768, 1280, 1536]) if (!has(`assets/${key}-${w}.webp`)) missing.push(`${key}-${w}.webp`); };
  [site.transformacao.antes, site.transformacao.depois, ...port.projetos.map(p => p.imagem)].forEach(need);
  for (const f of [`${site.canteiro.poster}-1920.webp`, `${site.canteiro.poster}-900.webp`]) if (!has('assets/' + f)) missing.push(f);
  if (missing.length) throw new Error('Imagens ausentes em v5-1/assets/: ' + missing.join(', '));

  const c = site.contato;
  const waHref = (msg, origem, vals = {}) => `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(msg + '\n\n' + fill(c.origem, { origem: fill(site.origens[origem], vals) }))}`;
  const waA = (origem, label, cls, extra = '') => `<a class="${cls}" href="${e(waHref(c.mensagemGeral, origem))}" target="_blank" rel="noopener noreferrer"${extra}>${WA}<span>${e(label)}</span></a>`;
  const portalA = cls => `<a class="${cls}" href="${e(site.portal.url)}" target="_blank" rel="noopener noreferrer" aria-label="Acessar o sistema Obra em Dia"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>${e(site.portal.rotulo)}</span></a>`;
  const img = (key, alt, sizes, { loading = 'lazy', cls = '' } = {}) =>
    `<img${cls ? ` class="${cls}"` : ''} src="assets/${key}-1280.webp" srcset="assets/${key}-768.webp 768w, assets/${key}-1280.webp 1280w, assets/${key}-1536.webp 1536w" sizes="${sizes}" width="1536" height="1024" alt="${e(alt)}" loading="${loading}" decoding="async">`;
  const traco = key => has(`assets/${key}-traco-1536.webp`) ? `<img class="traco" src="assets/${key}-traco-1536.webp" width="1536" height="1024" alt="" loading="lazy" decoding="async">` : '';
  const level = (pav, cota) => `<div class="level" data-reveal aria-hidden="true"><span>${e(pav)}</span><i></i><span>${e(cota)}</span></div>`;

  const L = port.rotulos, k = site.canteiro, x = k.explorar;
  const navHref = destino => destino === 'obras' ? 'portfolio.html' : `#${e(destino)}`;
  const nav = site.navegacao.map(i => `<a href="${navHref(i.destino)}"><span>${e(i.rotulo)}</span></a>`).join('\n        ');
  const mnav = site.navegacao.map((i, j) => `<li><a href="${navHref(i.destino)}"><small>${n2(j)}</small>${e(i.rotulo)}</a></li>`).join('\n          ');
  const elev = site.pavimentos.map(f => `<li><a href="${navHref(f.destino)}"><b>${e(f.sigla)}</b><span>${e(f.rotulo)}</span></a></li>`).join('');
  const etapas = k.etapas.map((s, i) => `<li><span class="ce-n">${n2(i)}</span><span class="ce-t">${e(s.titulo)}</span><span class="ce-d">${e(s.descricao)}</span></li>`).join('');
  const pontos = k.pontos.map(pt => `<div class="hs" data-hs="${e(pt.id)}"><button type="button" class="hs-b" aria-expanded="false" aria-controls="hs-${e(pt.id)}"><span class="sr">${e(pt.titulo)}</span><i aria-hidden="true"></i></button><div class="hs-tip" id="hs-${e(pt.id)}" role="note"><b>${e(pt.titulo)}</b><span>${e(pt.texto)}</span></div></div>`).join('');
  const andares = k.andares.map((a, i) => `<span class="fl" data-fl="${i}">${e(a)}</span>`).join('');

  const obras = port.projetos.map((p, i) => `
      <article class="pf pf--${i + 1}" id="estudo-${e(p.id)}">
        <a class="pf-media build bricky" href="assets/${e(p.imagem)}-1536.webp" data-open="${i}" data-cursor="Ver" aria-label="${e(L.ver)}: ${e(p.titulo + (p.subtitulo ? ` (${p.subtitulo})` : ''))}">
          <span class="pf-skew">
            <span class="grid-bg" aria-hidden="true"></span>
            ${traco(p.imagem)}
            <span class="foto">${img(p.imagem, p.alt, '(min-width: 1000px) 58vw, 100vw')}</span>
            <span class="scan" aria-hidden="true"></span>
            ${has(`assets/${p.imagem}-traco-1536.webp`) ? `<span class="xray" aria-hidden="true"><img src="assets/${e(p.imagem)}-traco-1536.webp" width="1536" height="1024" alt="" loading="lazy" decoding="async"></span>` : ''}
          </span>
        </a>
        <div class="pf-cap">
          <span class="pf-num" aria-hidden="true">${n2(i)}</span>
          <div class="pf-txt">
            <p class="pf-area">${e(p.area)} <span class="tag-ia">${e(L.ia)}</span></p>
            <h3 class="pf-t">${e(p.titulo)}${p.subtitulo ? ` <small>${e(p.subtitulo)}</small>` : ''}</h3>
            <p class="pf-d">${e(p.descricao)}</p>
          </div>
          <button type="button" class="link-arrow" data-open="${i}"><span>${e(L.ver)}</span>${ARROW}</button>
        </div>
      </article>`).join('');
  const portfolioChoices = port.projetos.map((p, i) => `
    <button class="portfolio-choice" type="button" data-portfolio-select="${i}" aria-label="Abrir estudo: ${e(p.titulo)}">
      <span class="portfolio-choice-image"><img src="assets/${e(p.imagem)}-768.webp" width="768" height="512" alt="" decoding="async"></span>
      <span class="portfolio-choice-meta">
        <span class="portfolio-choice-num">${n2(i)}</span>
        <span class="portfolio-choice-text"><small>${e(p.area)}</small><strong>${e(p.titulo)}</strong></span>
        <span class="portfolio-choice-arrow" aria-hidden="true">↗</span>
      </span>
    </button>`).join('');

  const portfolioPageCards = port.projetos.map((p, i) => `
    <a class="portfolio-choice" href="#estudo-${e(p.id)}" aria-label="Ver o estudo: ${e(p.titulo)}">
      <span class="portfolio-choice-image"><img src="assets/${e(p.imagem)}-768.webp" width="768" height="512" alt="" loading="eager" decoding="async"></span>
      <span class="portfolio-choice-meta">
        <span class="portfolio-choice-num">${n2(i)}</span>
        <span class="portfolio-choice-text"><small>${e(p.area)}</small><strong>${e(p.titulo)}</strong></span>
        <span class="portfolio-choice-arrow" aria-hidden="true">${ARROW}</span>
      </span>
    </a>`).join('');
  const portfolioPageDetails = port.projetos.map((p, i) => `
    <article class="port-detail" id="estudo-${e(p.id)}">
      <div class="port-detail-image"><img src="assets/${e(p.imagem)}-1280.webp" width="1280" height="853" alt="${e(p.alt)}" loading="lazy" decoding="async"></div>
      <div class="port-detail-copy">
        <p class="portfolio-index-kicker">${n2(i)} · ${e(p.area)} · ESTUDO ILUSTRATIVO</p>
        <h2>${e(p.titulo)}</h2>
        ${p.subtitulo ? `<p class="port-detail-sub">${e(p.subtitulo)}</p>` : ''}
        <p class="port-detail-desc">${e(p.descricao)}</p>
        <a class="port-detail-action" href="assets/${e(p.imagem)}-1536.webp" target="_blank" rel="noopener noreferrer">Ampliar imagem ${ARROW}</a>
        <a class="port-detail-action" href="${e(waHref(fill(c.mensagemEstudo, { titulo: p.titulo, area: p.area }), 'estudo', { titulo: p.titulo }))}" target="_blank" rel="noopener noreferrer">Conversar sobre este estudo ${ARROW}</a>
        <a class="port-detail-back" href="#todos">Ver todos os projetos</a>
      </div>
    </article>`).join('');

  const obrasData = port.projetos.map(p => ({
    id: p.id, area: p.area, titulo: p.titulo, subtitulo: p.subtitulo || '', descricao: p.descricao, alt: p.alt, imagem: p.imagem, ficha: p.ficha || null,
    traco: has(`assets/${p.imagem}-traco-1536.webp`) ? `assets/${p.imagem}-traco-1536.webp` : '',
    wa: waHref(fill(c.mensagemEstudo, { titulo: p.titulo, area: p.area }), 'estudo', { titulo: p.titulo })
  }));

  const t = site.transformacao, pr = site.processo, h = site.historia, o = site.orcamento;
  const passos = pr.etapas.map((s, i) => `
        <li class="ps" data-ps="${i}">
          <span class="ps-dot" aria-hidden="true"></span>
          <span class="ps-ico" aria-hidden="true">${ICONS[i % ICONS.length]}</span>
          <span class="ps-n" aria-hidden="true">${n2(i)}</span>
          <h3>${e(s.titulo)}</h3>
          <p>${e(s.descricao)}</p>
        </li>`).join('');
  const founders = h.fundadores.map(f => `
        <article class="founder" data-reveal>
          <p class="f-num" data-fill aria-label="${e(f.numero + f.sufixo + ' ' + f.rotuloNumero)}"><span aria-hidden="true">${Number(f.numero)}${e(f.sufixo)}</span></p>
          <p class="f-numlabel" aria-hidden="true">${e(f.rotuloNumero)}</p>
          <h3 class="f-name">${e(f.nome)}</h3>
          <p class="f-role">${e(f.funcao)}</p>
          <p class="f-story">${e(f.historia)}</p>
        </article>`).join('');
  const chips = list => list.map(z => `<li>${e(z)}</li>`).join('');
  const brief = o.briefPerguntas.map(q => `
          <div class="bq" role="group" aria-labelledby="bq-${e(q.id)}" data-q="${e(q.id)}" data-label="${e(q.rotulo)}">
            <p class="bq-t" id="bq-${e(q.id)}">${e(q.pergunta)}</p>
            <div class="bq-opts">${q.opcoes.map(op => `<button type="button" class="chip" aria-pressed="false">${e(op)}</button>`).join('')}</div>
          </div>`).join('');
  const creds = site.credenciais.filter(z => String(z.valor || '').trim());
  const credHtml = creds.length ? `<dl class="ft-creds">${creds.map(z => `<div><dt>${e(z.rotulo)}</dt><dd>${e(z.valor)}</dd></div>`).join('')}</dl>` : '';

  const base = (site.meta.url || '').trim();
  if (site.meta.indexar && !base) throw new Error('Para indexar, preencha "meta.url" em v5-1/content/site.json.');
  const abs = rel => base ? new URL(rel, base).href : rel;
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'GeneralContractor',
    name: 'VIA OPUS — Engenharia & Construções', alternateName: 'VIA OPUS', description: site.meta.descricao,
    telephone: '+' + c.whatsapp,
    areaServed: [{ '@type': 'AdministrativeArea', name: 'Distrito Federal' }, { '@type': 'AdministrativeArea', name: 'Goiás' }],
    founder: h.fundadores.map(f => ({ '@type': 'Person', name: f.nome, ...(/arquitet/i.test(f.funcao) ? { jobTitle: 'Arquiteta' } : {}) })),
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'orçamentos', telephone: '+' + c.whatsapp, availableLanguage: 'pt-BR' }],
    ...(creds.find(z => z.rotulo === 'CNPJ') ? { taxID: creds.find(z => z.rotulo === 'CNPJ').valor.trim() } : {}),
    ...(base ? { url: base, logo: new URL('assets/via-opus-640.webp', base).href, image: new URL(site.meta.imagemCompartilhar, base).href } : {})
  }).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="${site.meta.indexar ? 'index,follow' : 'noindex,nofollow'}">
<meta name="theme-color" content="#ece6dc">
<meta name="view-transition" content="same-origin">
<meta name="description" content="${e(site.meta.descricao)}">
<title>${e(site.meta.titulo)}</title>
${base ? `<link rel="canonical" href="${e(base)}">\n<meta property="og:url" content="${e(base)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="VIA OPUS">
<meta property="og:title" content="${e(site.meta.titulo)}">
<meta property="og:description" content="${e(site.meta.descricao)}">
<meta property="og:image" content="${e(abs(site.meta.imagemCompartilhar))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="generator" content="VIA OPUS ${e(site.meta.versaoNumero || '5.1')}">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<link rel="icon" href="favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" href="assets/favicon-48.png" type="image/png" sizes="48x48">
<link rel="icon" href="assets/via-opus-icone-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="stylesheet" href="fonts.css?v=${assetVersion}">
<link rel="stylesheet" href="styles.css?v=${assetVersion}">
<script src="boot.js?v=${assetVersion}"></script>
<script src="assets/js/three.min.js" defer></script>
<script src="obra3d.js?v=${assetVersion}" defer></script>
<script src="app.js?v=${assetVersion}" defer></script>
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
<div class="sky" aria-hidden="true"></div>
<canvas class="stage3d" aria-hidden="true"></canvas>

<div class="loader" aria-hidden="true">
  <div class="loader-in">
    <svg class="loader-draw" viewBox="0 0 120 150" width="120" height="150" fill="none" stroke="currentColor" stroke-width="1.2">
      <path pathLength="1" d="M10 140h100"/><path pathLength="1" d="M22 140V18h76v122"/><path pathLength="1" d="M18 18h84M22 42h76M22 66h76M22 90h76M22 114h76"/>
      <path pathLength="1" d="M30 24h22v12H30zM30 48h22v12H30zM30 72h22v12H30zM30 96h22v12H30zM70 24h20v12H70zM70 48h20v12H70zM70 72h20v12H70zM70 96h20v12H70zM34 118h16v22H34zM66 120h26v20H66z"/>
      <path pathLength="1" d="M58 42v72M61 42v72M64 42v72"/>
    </svg>
    <p><span>${e(site.carregando)}</span> <b data-pct>0</b>%</p>
  </div>
</div>
<div class="progress" aria-hidden="true"><i></i></div>
<div class="cursor" aria-hidden="true"><span></span></div>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>

<header class="hd">
  <div class="hd-in">
    <a class="hd-brand" href="#canteiro" aria-label="VIA OPUS — Engenharia &amp; Construções. Ir para o início">
      <img class="hd-mono" src="assets/via-opus-monograma-240.webp" width="240" height="123" alt="">
      <img class="hd-word" src="assets/via-opus-nome-480.webp" width="480" height="58" alt="">
    </a>
    <nav class="hd-nav" aria-label="Navegação principal">
        ${nav}
    </nav>
    <a class="hd-portfolio" href="portfolio.html" aria-haspopup="dialog" aria-controls="portfolio-index">Portfólio</a>
    ${portalA('hd-access')}
    ${waA('cabecalho', 'Orçamento', 'hd-cta')}
    <details class="mm">
      <summary aria-label="Abrir menu"><span class="mm-l">Menu</span><i aria-hidden="true"></i></summary>
      <nav class="mm-panel" aria-label="Navegação (celular)">
        <ol>
          ${mnav}
        </ol>
        ${portalA('mm-access')}
        ${waA('cabecalho', o.botao, 'btn btn-copper mm-wa')}
        <p class="mm-foot">${e(k.regiao)}</p>
      </nav>
    </details>
  </div>
</header>

<nav class="elev" aria-label="Pavimentos">
  <p class="elev-now" aria-hidden="true"><small>PAV.</small><b data-floor-now>T</b></p>
  <ol>${elev}</ol>
</nav>

<main id="conteudo">

<section id="canteiro" class="cant" data-theme="light" aria-labelledby="cant-t">
  <div class="cant-sticky">
    <picture class="cant-poster">
      <source media="(max-aspect-ratio: 1/1)" srcset="assets/${e(k.poster)}-900.webp">
      <img src="assets/${e(k.poster)}-1920.webp" width="1920" height="1080" alt="${e(k.posterAlt)}" decoding="async">
    </picture>
    <div class="cant-drag" aria-hidden="true"></div>
    <div class="cant-ui">
      <div class="cant-hero wrap">
        <p class="kicker"><span class="kline" aria-hidden="true"></span>${e(k.chamada)}</p>
        <h1 class="cant-t" id="cant-t" data-vf><span class="ln"><span>${e(k.linha1)}</span></span> <span class="ln"><em>${e(k.linha2)}</em></span></h1>
        <p class="cant-desc">${e(k.descricao)}</p>
        <p class="cant-actions">
          ${waA('abertura', k.botao, 'btn btn-ink', ' data-magnetic')}
          <span class="cant-dica" aria-hidden="true"><i></i>${e(k.dica)}</span>
        </p>
      </div>
      <div class="cant-stage wrap" aria-hidden="true">
        <p class="st-k">${e(k.etapaRotulo)} <b data-st-n>01</b><small>/${String(k.etapas.length).padStart(2, '0')}</small></p>
        <p class="st-t" data-st-t>${e(k.etapas[0].titulo)}</p>
        <p class="st-d" data-st-d>${e(k.etapas[0].descricao)}</p>
      </div>
      <div class="cant-final wrap">
        <p class="cant-final-t">${e(k.finalTitulo)}</p>
        <a class="btn btn-copper" href="${e(waHref(c.mensagemGeral, 'canteiro'))}" target="_blank" rel="noopener noreferrer" data-magnetic>${WA}<span>${e(k.finalBotao)}</span></a>
        <div class="explore" role="group" aria-label="${e(x.titulo)}">
          <p class="explore-t">${e(x.titulo)}</p>
          <div class="explore-b">
            <button type="button" class="xb" data-x="night" aria-pressed="true" data-on="${e(x.noite)}" data-off="${e(x.dia)}"><i aria-hidden="true"></i><span>${e(x.noite)}</span></button>
            <button type="button" class="xb" data-x="explode" aria-pressed="false" data-on="${e(x.montar)}" data-off="${e(x.explodir)}"><i aria-hidden="true"></i><span>${e(x.explodir)}</span></button>
          </div>
          <p class="explore-h" aria-hidden="true"><i></i>${e(x.girar)}</p>
        </div>
      </div>
      <p class="cant-cota" aria-hidden="true"><small>${e(k.cotaRotulo)}</small><b data-cota>+00,00</b><small>m</small></p>
      <div class="cant-bar wrap">
        <ol class="cant-etapas">${etapas}</ol>
        <span class="cant-line" aria-hidden="true"><i></i></span>
      </div>
      <p class="cant-selo" title="${e(k.aviso)}">${e(k.selo)}</p>
      <div class="hud" aria-label="${e(k.pontosRotulo)}">${pontos}</div>
      <div class="floors" aria-hidden="true">${andares}</div>
    </div>
  </div>
  <p class="sr">${e(k.aviso)}</p>
</section>

<section id="obras" class="obras" data-theme="light" aria-labelledby="obras-t">
  <div class="wrap">
    ${level('PAV. 01 — ' + site.portfolio.chamada, '+03,60')}
    <header class="obras-head">
      <h2 class="sec-t" id="obras-t" data-split data-vf>${e(site.portfolio.titulo1)} <em>${e(site.portfolio.titulo2)}</em></h2>
      <div data-reveal>
        <p class="sec-lede">${e(site.portfolio.descricao)}</p>
        <p class="aviso">${e(site.portfolio.aviso)}</p>
      </div>
    </header>
    <div class="gal">${obras}
    </div>
  </div>
</section>

<section id="transformacao" class="tf" data-theme="dark" aria-labelledby="tf-t">
  <div class="wrap">
    ${level('PAV. 02 — ' + t.chamada, '+06,60')}
    <div class="tf-head">
      <h2 class="sec-t" id="tf-t" data-split>${e(t.titulo1)} <em>${e(t.titulo2)}</em></h2>
      <p class="tf-desc" data-reveal>${e(t.descricao)}</p>
    </div>
  </div>
  <div class="tf-stage">
    <div class="ba" data-ba data-cursor="${e(t.dica)}">
      ${img(t.depois, t.altDepois, '100vw', { cls: 'ba-img' })}
      <div class="ba-antes">${img(t.antes, t.altAntes, '100vw', { cls: 'ba-img' })}</div>
      <span class="ba-tag ba-tag-a" aria-hidden="true">${e(t.rotuloAntes)}</span>
      <span class="ba-tag ba-tag-d" aria-hidden="true">${e(t.rotuloDepois)}</span>
      <span class="ba-line" aria-hidden="true"><span class="ba-knob"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span></span>
      <input class="ba-range" type="range" min="0" max="100" value="50" step="1" aria-label="${e(t.controle)}">
    </div>
  </div>
</section>

<section id="processo" class="proc" data-theme="light" aria-labelledby="proc-t">
  <div class="wrap">
    ${level('PAV. 03 — ' + pr.chamada, '+09,60')}
    <header class="proc-head">
      <h2 class="sec-t" id="proc-t" data-split>${e(pr.titulo1)} <em>${e(pr.titulo2)}</em></h2>
      <p class="sec-lede" data-reveal>${e(pr.descricao)}</p>
    </header>
    <div class="path" data-path>
      <svg class="path-svg" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path class="path-bg" d="M0 80C80 80 120 80 200 80C300 80 320 20 400 20C480 20 500 80 600 80C700 80 720 140 800 140C880 140 900 80 1000 80C1080 80 1120 80 1200 80"/>
        <path class="path-fg" d="M0 80C80 80 120 80 200 80C300 80 320 20 400 20C480 20 500 80 600 80C700 80 720 140 800 140C880 140 900 80 1000 80C1080 80 1120 80 1200 80"/>
      </svg>
      <span class="path-v" aria-hidden="true"><i></i></span>
      <ol class="path-list">${passos}
      </ol>
    </div>
  </div>
</section>

<section id="historia" class="hist" data-theme="light" aria-labelledby="hist-t">
  <div class="wrap">
    ${level('PAV. 04 — ' + h.chamada, '+12,60')}
    <header class="hist-head">
      <h2 class="sec-t hist-t" id="hist-t" data-split data-vf><span>${e(h.titulo1)}</span> <em>${e(h.titulo2)}</em></h2>
      <p class="hist-intro" data-reveal>${e(h.intro)}</p>
    </header>
    <div class="founders">${founders}
    </div>
    <div class="hist-foot">
      <blockquote class="hist-quote" data-reveal><p>${e(h.conclusao)}</p></blockquote>
      <div class="hist-side" data-reveal>
        <p class="hist-together">${e(h.juntos)}</p>
        <div class="tags">
          <div><p class="tags-t" id="tg-r">${e(h.regioesRotulo)}</p><ul aria-labelledby="tg-r">${chips(h.regioes)}</ul></div>
          <div><p class="tags-t" id="tg-p">${e(h.publicosRotulo)}</p><ul aria-labelledby="tg-p">${chips(h.publicos)}</ul></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="contato" class="ct" data-theme="dark" aria-labelledby="ct-t">
  <picture class="ct-poster" aria-hidden="true">
    <source media="(max-aspect-ratio: 1/1)" srcset="assets/${e(k.poster)}-900.webp">
    <img src="assets/${e(k.poster)}-1920.webp" width="1920" height="1080" alt="" loading="lazy" decoding="async">
  </picture>
  <div class="wrap">
    ${level('COBERTURA — ' + o.chamada.replace(/^Cobertura · /, ''), '+15,60')}
    <div class="ct-grid">
      <div class="ct-main">
        <h2 class="ct-t" id="ct-t" data-split><span>${e(o.titulo1)}</span> <em>${e(o.titulo2)}</em></h2>
        <p class="ct-desc" data-reveal>${e(o.descricao)}</p>
        <div class="ct-card glass" data-reveal>
          <p class="ct-k">${e(o.cartaoTitulo)}</p>
          <p class="ct-name">${e(c.nome)} <span>${e(c.funcao)}</span></p>
          <p class="ct-num"><span class="sr">WhatsApp: </span>${e(c.whatsappExibir)}</p>
          ${waA('cartao', o.botao, 'btn btn-copper', ' data-magnetic')}
        </div>
        <p class="ct-aviso">${e(o.aviso)}</p>
      </div>
      <div class="ct-brief glass" data-brief hidden>
        <p class="ct-k">${e(o.briefTitulo)}</p>
        <p class="brief-intro">${e(o.briefIntro)}</p>${brief}
        <div class="bq bq-extra">
          <label class="bq-t" for="brief-extra">${e(o.briefExtraRotulo)}</label>
          <textarea id="brief-extra" rows="2" maxlength="400" placeholder="${e(o.briefExtraDica)}" data-obs="${e(o.briefObsRotulo)}"></textarea>
        </div>
        <div class="brief-prev">
          <p class="bq-t">${e(o.briefPrevia)}</p>
          <p class="brief-msg" aria-live="polite" data-empty="${e(o.briefVazio)}">${e(o.briefVazio)}</p>
        </div>
        <a class="btn btn-copper brief-send" href="${e(waHref(c.mensagemGeral, 'montada'))}" target="_blank" rel="noopener noreferrer" aria-disabled="true">${WA}<span>${e(o.briefBotao)}</span></a>
      </div>
    </div>
    <p class="ct-legenda">${e(o.legendaNoite)}</p>
  </div>
</section>

</main>

<footer class="ft" data-theme="dark">
  <div class="wrap">
    <img class="ft-logo" src="assets/via-opus-960.webp" srcset="assets/via-opus-640.webp 640w, assets/via-opus-960.webp 960w" sizes="(min-width: 900px) 420px, 70vw" width="960" height="526" alt="Logomarca VIA OPUS — Engenharia &amp; Construções" loading="lazy" decoding="async">
    <div class="ft-cols">
      <div><p>${e(site.rodape.regiao)}<br>WhatsApp ${e(c.whatsappExibir)} · ${e(c.nome)}</p>${credHtml}</div>
      <p class="ft-end"><a class="link-arrow" href="#canteiro"><span>${e(site.rodape.voltar)}</span>${ARROW}</a><span class="ft-ver">${e(site.meta.versao)}</span></p>
    </div>
    <p class="ft-credit"><span>${e(site.rodape.credito.prefixo)}</span> <b>${e(site.rodape.credito.nome)}</b></p>
  </div>
</footer>

${waA('fixo', 'Orçamento', 'wa-float')}

<dialog class="portfolio-index" id="portfolio-index" aria-labelledby="portfolio-index-title">
  <div class="portfolio-index-inner">
    <header class="portfolio-index-head">
      <div>
        <p class="portfolio-index-kicker">VIA OPUS · PORTFÓLIO</p>
        <h2 id="portfolio-index-title">Escolha um estudo</h2>
        <p class="portfolio-index-sub">Conheça as quatro opções. Selecione uma imagem para ver o estudo completo.</p>
      </div>
      <button class="portfolio-index-close" type="button" data-portfolio-close aria-label="Fechar portfólio">×</button>
    </header>
    <div class="portfolio-index-grid">${portfolioChoices}</div>
    <p class="portfolio-index-note">${e(site.portfolio.aviso)}</p>
  </div>
</dialog>

<dialog class="study" id="study" aria-labelledby="study-t">
  <div class="study-media">
    <div class="study-stage">
      <img class="study-traco" alt="" hidden>
      <img class="study-foto" alt="">
    </div>
    <button type="button" class="study-toggle" aria-pressed="false" data-a="${e(L.verTraco)}" data-b="${e(L.verObra)}">${e(L.verTraco)}</button>
  </div>
  <div class="study-info">
    <p class="kicker"><span class="kline" aria-hidden="true"></span><span data-s-area></span></p>
    <h2 class="study-t" id="study-t"></h2>
    <p class="study-d" data-s-desc></p>
    <dl class="ficha">
      <div><dt>${e(L.natureza)}</dt><dd>${e(L.naturezaValor)}</dd></div>
      <div><dt>${e(L.origem)}</dt><dd>${e(L.origemValor)}</dd></div>
    </dl>
    <div class="ficha-obra" data-s-ficha hidden>
      <p class="ficha-t">${e(L.ficha)} <span class="ficha-ex" data-s-ex hidden>exemplo</span></p>
      <dl class="ficha ficha--2">${Object.entries(L.fichaRotulos).map(([key, r]) => `<div><dt>${e(r)}</dt><dd data-f="${key}"></dd></div>`).join('')}</dl>
      <p class="ficha-n" data-s-note hidden>${e(L.fichaExemplo)}</p>
    </div>
    <a class="btn btn-copper study-wa" href="#contato" target="_blank" rel="noopener noreferrer">${WA}<span>${e(L.botaoEstudo)}</span></a>
    <div class="study-nav">
      <button type="button" class="link-arrow link-arrow--back" data-s-prev><span>${e(L.anterior)}</span>${ARROW}</button>
      <span class="study-count" data-s-count aria-live="polite"></span>
      <button type="button" class="link-arrow" data-s-next><span>${e(L.proximo)}</span>${ARROW}</button>
    </div>
  </div>
  <button type="button" class="study-close" data-s-close aria-label="${e(L.fechar)}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.5"/></svg></button>
</dialog>

<script type="application/json" id="obras-data">${JSON.stringify(obrasData).replace(/</g, '\\u003c')}</script>
</body>
</html>
`;

  const portfolioPageHtml = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portfólio — VIA OPUS Engenharia & Construções</title>
<meta name="description" content="Conheça os estudos de arquitetura, construção e reforma da VIA OPUS. Visualize todos os projetos e explore os detalhes.">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${e(site.meta.url)}portfolio.html">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<link rel="icon" href="favicon.ico">
<link rel="stylesheet" href="fonts.css?v=${assetVersion}">
<link rel="stylesheet" href="styles.css?v=${assetVersion}">
</head>
<body class="port-page-body">
<main id="todos" class="port-page">
  <section class="port-page-overview" aria-labelledby="portfolio-page-title">
    <header class="port-page-header">
      <a class="port-page-logo" href="./" aria-label="Voltar ao site VIA OPUS"><img src="assets/via-opus-nome-480.webp" width="480" height="58" alt="VIA OPUS"></a>
      <nav aria-label="Navegação"><a href="./">← Voltar ao site</a><a href="${e(site.portal.url)}" target="_blank" rel="noopener noreferrer">Área do Cliente</a></nav>
    </header>
    <div class="port-page-intro">
      <p class="portfolio-index-kicker">VIA OPUS · ENGENHARIA & CONSTRUÇÕES</p>
      <h1 id="portfolio-page-title">Nosso <em>portfólio.</em></h1>
      <p>Explore os quatro estudos disponíveis. Selecione uma opção para visualizar os detalhes.</p>
    </div>
    <div class="portfolio-index-grid port-page-grid">${portfolioPageCards}</div>
    <p class="portfolio-index-note">${e(site.portfolio.aviso)}</p>
  </section>
  <section class="port-page-details" aria-label="Detalhes dos estudos">${portfolioPageDetails}</section>
  <footer class="port-page-footer"><span>VIA OPUS · Engenharia & Construções</span><a href="./">Voltar ao início do site ↑</a></footer>
</main>
</body>
</html>`;

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(path.join(OUT, 'assets', 'js'), { recursive: true });
  await fs.mkdir(path.join(OUT, 'fonts'), { recursive: true });
  await fs.writeFile(path.join(OUT, 'index.html'), html);
  await fs.writeFile(path.join(OUT, 'portfolio.html'), portfolioPageHtml);
  for (const f of ['styles.css', 'app.js', 'boot.js', 'obra3d.js']) await fs.copyFile(path.join(V5, 'src', f), path.join(OUT, f));
  await fs.copyFile(path.join(V5, 'src/vendor/three.min.js'), path.join(OUT, 'assets/js/three.min.js'));
  await fs.copyFile(path.join(V5, 'src/vendor/THREE-LICENSE.txt'), path.join(OUT, 'assets/js/THREE-LICENSE.txt'));
  for (const f of await fs.readdir(path.join(V5, 'assets'))) await fs.copyFile(path.join(V5, 'assets', f), path.join(OUT, 'assets', f));
  for (const f of (await fs.readdir(FONTS)).filter(f => f.endsWith('.txt'))) await fs.copyFile(path.join(FONTS, f), path.join(OUT, 'fonts', f));
  await fs.writeFile(path.join(OUT, 'fonts.css'), await fontsCss());
  await fs.copyFile(path.join(V5, 'assets', 'favicon.ico'), path.join(OUT, 'favicon.ico'));
  await fs.copyFile(path.join(V5, 'src', 'erro.css'), path.join(OUT, 'erro.css'));
  const home = base || './';
  await fs.writeFile(path.join(OUT, '404.html'), `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<title>Página não encontrada — VIA OPUS</title>
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="stylesheet" href="/fonts.css">
<link rel="stylesheet" href="/erro.css">
</head>
<body>
<main>
<p class="k">Erro 404</p>
<h1>Esta página não foi encontrada.</h1>
<p>O endereço pode ter mudado ou não existir. Volte ao início para ver o portfólio e pedir seu orçamento.</p>
<a href="${e(home)}">Voltar ao site da VIA OPUS</a>
</main>
</body>
</html>
`);
  await fs.writeFile(path.join(OUT, '.nojekyll'), '');
  // Identificação da versão publicada (o fluxo de publicação preenche o commit via VIA_OPUS_COMMIT).
  await fs.writeFile(path.join(OUT, 'versao.json'), JSON.stringify({
    site: 'VIA OPUS — Engenharia & Construções', versao: site.meta.versaoNumero || '5.1', rotulo: site.meta.versao,
    commit: process.env.VIA_OPUS_COMMIT || null, publicadoEm: process.env.VIA_OPUS_DATA || null
  }, null, 2) + '\n');
  if (site.meta.indexar) {
    await fs.writeFile(path.join(OUT, 'CNAME'), new URL(base).host + '\n');
    await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap.xml', base).href}\n`);
    await fs.writeFile(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${new URL('./', base).href}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`);
  } else {
    await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nDisallow: /\n`);
  }
  console.log('VIA OPUS 5.1 gerada em v5-1/site/');
}

main().catch(err => { console.error('Erro: ' + err.message); process.exit(1); });
