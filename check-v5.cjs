// Checagem da VIA OPUS 4.0 (v5/site). Uso: node check-v4.cjs
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'v5/site');
const site = JSON.parse(fs.readFileSync(path.join(__dirname, 'v5/content/site.json'), 'utf8'));
const port = JSON.parse(fs.readFileSync(path.join(__dirname, 'v5/content/portfolio.json'), 'utf8'));
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8') + fs.readFileSync(path.join(dir, 'boot.js'), 'utf8') + fs.readFileSync(path.join(dir, 'obra3d.js'), 'utf8');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const dec = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

// recursos locais
const refs = new Set();
for (const m of html.matchAll(/\b(?:src|href)="([^"#][^"]*)"/g)) refs.add(dec(m[1]));
for (const m of html.matchAll(/srcset="([^"]+)"/g)) m[1].split(',').forEach(x => refs.add(x.trim().split(/\s+/)[0]));
for (const m of css.matchAll(/url\(([^)]+)\)/g)) refs.add(m[1].replace(/["']/g, ''));
const own = (site.meta.url || '').trim();
for (const r of refs) {
  if (/^https:\/\/wa\.me\//.test(r)) continue;
  if (own && r.startsWith(own)) continue;
  if (/^(https?:)?\/\//.test(r) || /^data:/.test(r)) { fails.push('Recurso externo: ' + r); continue; }
  if (/^#/.test(r)) continue;
  ok(fs.existsSync(path.join(dir, r.split('?')[0])), 'Arquivo ausente: ' + r);
}
for (const m of JSON.parse(html.match(/<script type="application\/json" id="obras-data">([\s\S]*?)<\/script>/)[1])) {
  ok(fs.existsSync(path.join(dir, `assets/${m.imagem}-1536.webp`)), 'Imagem do estudo ausente: ' + m.imagem);
  if (m.traco) ok(fs.existsSync(path.join(dir, m.traco)), 'Traço ausente: ' + m.traco);
  ok(m.wa.startsWith('https://wa.me/' + site.contato.whatsapp + '?text='), 'WhatsApp do estudo fora da Rafaela: ' + m.id);
  ok(decodeURIComponent(m.wa.split('text=')[1]).includes('Origem: site VIA OPUS'), 'Estudo sem origem: ' + m.id);
}

// WhatsApp
const was = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m => dec(m[1]));
ok(was.length >= 7, `Poucos botões de WhatsApp (${was.length})`);
for (const w of was) {
  ok(w.startsWith(`https://wa.me/${site.contato.whatsapp}?text=`), 'WhatsApp para outro número: ' + w);
  ok(decodeURIComponent(w.split('text=')[1]).includes('Origem: site VIA OPUS ·'), 'WhatsApp sem origem: ' + w);
}
ok(site.contato.whatsapp === '556185189004', 'Número da Rafaela alterado');

// privacidade e segurança (CSP: sem script/estilo inline)
ok(!/<form\b/i.test(html), 'Há <form> na página');
ok(!/\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|sendBeacon/.test(js), 'Script coleta ou envia dados');
ok(!/\sstyle="/.test(html), 'Atributo style inline (bloqueado pela CSP)');
ok(![...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].some(m => !/type="application\/(ld\+)?json"/.test(m[1])), 'Script inline executável (bloqueado pela CSP)');

// IA identificada
ok(html.includes(site.rodape.avisoIA), 'Aviso de IA do rodapé ausente');
ok(html.includes(site.canteiro.selo) && html.includes(site.canteiro.aviso), 'Aviso da maquete 3D ilustrativa ausente');
ok(fs.existsSync(path.join(dir, 'assets/js/three.min.js')) && fs.existsSync(path.join(dir, 'obra3d.js')), 'Arquivos da maquete 3D ausentes');
ok(/fallback|has-3d/.test(fs.readFileSync(path.join(dir, 'styles.css'), 'utf8')), 'Sem modo alternativo para quando não há 3D');
ok(!/\beval\(|new Function\(/.test(fs.readFileSync(path.join(dir, 'obra3d.js'), 'utf8')), 'obra3d.js usa eval');
ok((html.match(/class="tag-ia"/g) || []).length === port.projetos.length, 'Estudo sem selo de IA');
ok(html.includes(port.rotulos.origemValor), 'Origem IA no estudo ausente');
ok(html.includes(site.portfolio.aviso), 'Aviso do portfólio ausente');

// conteúdo combinado
ok(!/Áreas de atuação/i.test(html), '“Áreas de atuação” voltou para a página');
ok(html.includes('Rafaela Lacerda') && html.includes('anos em projetos e obras') && /aria-hidden="true">10\+<\/span>/.test(html), 'Rafaela: 10+ anos ausente');
ok(html.includes('Fernando Taveira') && html.includes('anos na construção civil') && /aria-hidden="true">30\+<\/span>/.test(html), 'Fernando: 30+ anos ausente');
ok(html.includes('ACADEMIA ULTRA') && html.includes('conceito ilustrativo'), 'ACADEMIA ULTRA sem “conceito ilustrativo”');
ok(html.includes('data-ba') && html.includes('ba-range'), 'Comparador antes/depois ausente');
ok(!/ba-badge|Ilustração · IA<\/span>\s*<\/div>\s*<span class="ba-tag/.test(html), 'Selo de IA no comparador (combinado: sem selo)');

// SEO
if (!site.meta.indexar) {
  ok(html.includes('content="noindex,nofollow"'), 'Prévia deveria ter noindex');
  ok(/Disallow: \//.test(fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8')), 'robots.txt deveria bloquear');
}
ok(html.includes('"@type":"GeneralContractor"'), 'JSON-LD ausente');

// versões anteriores intactas
for (const f of ['site/index.html', 'v2/site/index.html', 'v2-1/site/index.html', 'v3/site/index.html', 'v4/site/index.html']) ok(fs.existsSync(path.join(__dirname, f)), 'Versão anterior ausente: ' + f);

ok(site.canteiro.pontos.every(pt => html.includes(`data-hs="${pt.id}"`)), 'Ponto de interesse ausente');
ok(html.includes('class="stage3d"') && html.includes('class="sky"'), 'Palco 3D fixo ausente');
ok(html.includes(site.orcamento.legendaNoite), 'Legenda da maquete noturna ausente');
if (fails.length) { console.error('FALHOU:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`PASS: versão 5.0, ${port.projetos.length} estudos, ${was.length} botões de WhatsApp (todos para a Rafaela, com origem), maquete 3D viva (andaimes, vista explodida, dia/noite, pontos de interesse) com modo alternativo, galeria traço→foto, antes/depois, IA identificada, recursos locais, sem formulário/coleta, compatível com CSP.`);
