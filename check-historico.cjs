// Compatibilidade histórica (opcional). Confere se as versões anteriores continuam no repositório.
// NÃO faz parte da publicação: o site oficial (5.1) é testado por check-v51.cjs e não depende destas pastas.
// Uso: node check-historico.cjs   (sai com 0 mesmo se alguma versão antiga não existir neste clone; só informa)
const fs = require('node:fs');
const path = require('node:path');
const alvo = ['site/index.html', 'v2/site/index.html', 'v2-1/site/index.html', 'v3/site/index.html', 'v4/site/index.html', 'v5/site/index.html', 'v5-1/site/index.html'];
let faltam = 0;
for (const f of alvo) {
  const ok = fs.existsSync(path.join(__dirname, f));
  if (!ok) faltam++;
  console.log((ok ? 'presente ' : 'AUSENTE  ') + f);
}
console.log(faltam ? `\n${faltam} versão(ões) antiga(s) não estão neste repositório (esperado: v2 a v4 ficam só na pasta de trabalho local).` : '\nTodas as versões presentes.');
if (process.argv.includes('--estrito') && faltam) process.exit(1);
