// Checagem de PUBLICAÇÃO da VIA OPUS 5.1 (v5-1/site). Uso: node check-v51.cjs
// Não depende de versões antigas. A compatibilidade histórica fica em check-historico.cjs.
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'v5-1/site');
const site = JSON.parse(fs.readFileSync(path.join(__dirname, 'v5-1/content/site.json'), 'utf8'));
const port = JSON.parse(fs.readFileSync(path.join(__dirname, 'v5-1/content/portfolio.json'), 'utf8'));
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8') + fs.readFileSync(path.join(dir, 'boot.js'), 'utf8') + fs.readFileSync(path.join(dir, 'obra3d.js'), 'utf8');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const dec = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

// Login no sistema: apenas os dois controles previstos podem usar o endereço externo.
const acesso = site.sistema.url ? new URL(site.sistema.url) : null;
const tipoLogin = acesso ? 'a' : 'button';
ok(/href="#contato"[\s\S]*class="login-cta hd-login"[\s\S]*<\/nav>\s*<a class="hd-cta"/.test(html), 'Login deve ficar entre Contato e Orçamento');
ok(js.includes('.hd-nav a[href^="#"]'), 'Rolagem deve selecionar somente âncoras internas');
const controlesLogin = [...html.matchAll(/<(a|button) class="login-cta (hd-login|btn mm-login)"[^>]*>/g)];
ok(controlesLogin.length === 2, 'Esperado um controle de login no cabeçalho e outro no menu do celular');
for (const classe of ['hd-login', 'btn mm-login']) {
  const controle = controlesLogin.find(m => m[2] === classe);
  ok(controle?.[1] === tipoLogin, 'Controle de login incorreto: ' + classe);
  if (!controle) continue;
  if (acesso) {
    ok(acesso.protocol === 'https:' && !acesso.username && !acesso.password && !acesso.search && !acesso.hash, 'Endereço de login inválido');
    ok(dec(controle[0].match(/\bhref="([^"]*)"/)?.[1] ?? '') === acesso.href, 'Destino de login incorreto: ' + classe);
    ok(controle[0].includes('rel="noreferrer"'), 'Login deve omitir o referenciador');
  } else {
    ok(controle[0].endsWith(' type="button" disabled>'), 'Login sem endereço deve ficar desativado: ' + classe);
  }
}

// recursos locais
const refs = new Set();
const htmlRecursos = acesso
  ? html.replace(/<a class="login-cta (?:hd-login|btn mm-login)" href="([^"]+)" rel="noreferrer">/g,
    (tag, href) => dec(href) === acesso.href ? '' : tag)
  : html;
for (const m of htmlRecursos.matchAll(/\b(?:src|href)="([^"#][^"]*)"/g)) refs.add(dec(m[1]));
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

// SEO e indexação
const robots = fs.readFileSync(path.join(dir, 'robots.txt'), 'utf8');
if (!site.meta.indexar) {
  ok(html.includes('content="noindex,nofollow"'), 'Prévia deveria ter noindex');
  ok(/Disallow: \//.test(robots), 'robots.txt deveria bloquear');
} else {
  ok(site.meta.url === 'https://viaopusconstrutora.com.br/', 'meta.url deve ser https://viaopusconstrutora.com.br/');
  ok(!/noindex|nofollow/i.test(html), 'Página oficial não pode ter noindex/nofollow');
  ok(html.includes('<meta name="robots" content="index,follow">'), 'Meta robots index,follow ausente');
  ok(html.includes(`<link rel="canonical" href="${site.meta.url}">`), 'URL canônica incorreta');
  ok(html.includes(`<meta property="og:url" content="${site.meta.url}">`), 'og:url incorreto');
  ok(html.includes(`<meta property="og:image" content="${site.meta.url}assets/via-opus-compartilhar-1200x630.jpg">`), 'og:image deve ser URL absoluta');
  ok(fs.existsSync(path.join(dir, 'assets/via-opus-compartilhar-1200x630.jpg')), 'Imagem de compartilhamento ausente');
  ok(/<title>[^<]{10,}<\/title>/.test(html) && /<meta name="description" content="[^"]{80,}"/.test(html), 'Título/descrição ausentes ou curtos');
  ok(!/Disallow: \//.test(robots) && /Allow: \//.test(robots), 'robots.txt deveria permitir');
  ok(robots.includes(`Sitemap: ${site.meta.url}sitemap.xml`), 'robots.txt sem Sitemap');
  ok(fs.existsSync(path.join(dir, 'sitemap.xml')) && fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8').includes(`<loc>${site.meta.url}</loc>`), 'sitemap.xml ausente ou incorreto');
  ok(!/Prévia/i.test(html), 'A página oficial ainda se identifica como prévia');
  ok(/"url":"https:\/\/viaopusconstrutora\.com\.br\/"/.test(html), 'JSON-LD sem a URL oficial');
}
ok(html.includes('<meta http-equiv="Content-Security-Policy"') && !/unsafe-inline|unsafe-eval/.test(html), 'CSP ausente ou permissiva');
ok(/<meta name="generator" content="VIA OPUS 5\.1">/.test(html), 'Identificação da versão ausente');
ok(fs.existsSync(path.join(dir, 'favicon.ico')) && fs.existsSync(path.join(dir, 'assets/apple-touch-icon.png')), 'Favicon/ícone ausente');
ok(fs.existsSync(path.join(dir, '404.html')) && fs.existsSync(path.join(dir, '.nojekyll')), '404.html ou .nojekyll ausente');
{ const v = JSON.parse(fs.readFileSync(path.join(dir, 'versao.json'), 'utf8')); ok(v.versao === '5.1', 'versao.json incorreto'); }
ok(!/localhost|127\.0\.0\.1|\\Users\\|C:\\/.test(html + css + js), 'Referência a ambiente local');
ok(html.includes('"@type":"GeneralContractor"'), 'JSON-LD ausente');

ok(site.canteiro.pontos.every(pt => html.includes(`data-hs="${pt.id}"`)), 'Ponto de interesse ausente');
ok(html.includes('class="stage3d"') && html.includes('class="sky"'), 'Palco 3D fixo ausente');
ok(html.includes(site.orcamento.legendaNoite), 'Legenda da maquete noturna ausente');
ok((html.match(/class="pf-media build bricky"/g) || []).length === port.projetos.length, 'Portfólio sem o efeito de tijolos');
ok((html.match(/data-fill/g) || []).length === 2, 'Números sem o efeito de concreto');
if (fails.length) { console.error('FALHOU:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`PASS: versão 5.1, ${port.projetos.length} estudos, ${was.length} botões de WhatsApp (todos para a Rafaela, com origem), maquete 3D viva (andaimes, vista explodida, dia/noite, pontos de interesse) com modo alternativo, galeria traço→foto assentada tijolo por tijolo, números enchendo de concreto, antes/depois, IA identificada, recursos locais, sem formulário/coleta, compatível com CSP.`);
