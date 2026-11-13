// Gera um único arquivo HTML portátil da 5.0 (abre com dois cliques, sem servidor).
// Uso: node package-v3-preview.cjs [saida.html]
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, 'v5/site');
const out = process.argv[2] || path.join(__dirname, 'previa-via-opus-5-0.html');
const mime = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const cache = new Map();
const data = rel => {
  if (!cache.has(rel)) cache.set(rel, `data:${mime[path.extname(rel)]};base64,${fs.readFileSync(path.join(dir, rel)).toString('base64')}`);
  return cache.get(rel);
};
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
let css = fs.readFileSync(path.join(dir, 'styles.css'), 'utf8').replace(/url\((fonts\/[^)]+|assets\/[^)]+)\)/g, (_, r) => `url(${data(r)})`);
const js = fs.readFileSync(path.join(dir, 'app.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const three = fs.readFileSync(path.join(dir, 'assets/js/three.min.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const obra = fs.readFileSync(path.join(dir, 'obra3d.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
html = html
  .replace(/<link rel="preload"[^>]*>\n/g, '')
  .replace('<link rel="stylesheet" href="fonts.css">', () => `<style>${fs.readFileSync(path.join(dir, 'fonts.css'), 'utf8')}</style>`)
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>${css}</style>`)
  .replace('<script src="boot.js"></script>', () => `<script>${fs.readFileSync(path.join(dir, 'boot.js'), 'utf8')}</script>`)
  .replace('<script src="assets/js/three.min.js" defer></script>', '')
  .replace('<script src="obra3d.js" defer></script>', '')
  .replace('<script src="app.js" defer></script>', '')
  .replace('</body>', () => `<script>${three}</script>\n<script>${obra}</script>\n<script>${js}</script>\n</body>`)
  .replace(/srcset="(assets\/[^"\s]+\.webp)"/g, (m, rel) => `srcset="${data(rel)}"`)
  .replace(/<script type="application\/json" id="obras-data">([\s\S]*?)<\/script>/, (m, j) => m.replace(j, j.replace(/assets\/[\w-]+\.webp/g, rel => data(rel))))
  // uma resolução por imagem (1280) para manter o arquivo leve
  .replace(/ srcset="assets\/([\w-]+)-768\.webp 768w[^"]*"/g, '')
  .replace(/ srcset="assets\/via-opus-640\.webp[^"]*"/g, '')
  .replace(/(src|href)="(assets\/[^"]+\.(?:webp|jpg))"/g, (m, attr, rel) => {
    if (attr === 'href' && /-1536\.webp$/.test(rel)) return `href="#obras"`;
    if (/-1536\.webp$/.test(rel) && !/traco/.test(rel)) rel = rel.replace('-1536', '-1280');
    return `${attr}="${data(rel)}"`;
  })
  .replace(/<meta property="og:image" content="[^"]*">\n/, '');
fs.writeFileSync(out, html);
console.log(`Prévia portátil: ${out} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
