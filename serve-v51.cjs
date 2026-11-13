// Prévia local da versão 5.1. Sem editor, sem arquivos do projeto, sem credenciais: só o site gerado.
// /  -> versão 5.1   /v5/ -> versão 5.0   /atual/ -> versão anterior
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const roots = {v21:path.join(__dirname,'v5-1/site'),v2:path.join(__dirname,'v5/site'),current:path.join(__dirname,'site')};
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf','.xml':'application/xml'};
const port = Number(process.env.PORT) || 4196;
const headers = {'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; font-src 'self' data:; connect-src 'none'; form-action 'none'; frame-ancestors 'self'"};
const server = http.createServer((req,res) => {
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400);return res.end('Endereço inválido.'); }
  if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end('Método não permitido.');}
  let root=roots.v21, relative=pathname;
  for(const [prefix,key] of [['/atual','current'],['/v5','v2']]) {
    if(pathname===prefix) {res.writeHead(302,{Location:prefix+'/'});return res.end();}
    if(pathname.startsWith(prefix+'/')) {root=roots[key];relative=pathname.slice(prefix.length);}
  }
  if(relative==='/admin' || relative.startsWith('/admin/')) {res.writeHead(404);return res.end('Editor disponível pelo aplicativo original.');}
  const file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));
  if(!file.startsWith(root+path.sep)) {res.writeHead(403);return res.end('Acesso negado.');}
  fs.realpath(file,(error,realFile)=>{
    if(error) {res.writeHead(404,headers);return res.end('Página não encontrada.');}
    // Um arquivo vinculado não pode expor nada fora da pasta pública escolhida.
    const realRoot=fs.realpathSync(root);
    if(!realFile.startsWith(realRoot+path.sep)) {res.writeHead(403,headers);return res.end('Acesso negado.');}
    fs.readFile(realFile,(error,data)=>{
      if(error) {res.writeHead(404,headers);return res.end('Página não encontrada.');}
      res.writeHead(200,{...headers,'Content-Type':types[path.extname(realFile)]||'application/octet-stream'});
      res.end(req.method==='HEAD'?undefined:data);
    });
  });
});
server.listen(port,'127.0.0.1',()=>{
  console.log(`Versão 5.1: http://127.0.0.1:${port}/`);
  console.log(`Versão 5.0: http://127.0.0.1:${port}/v5/   |   Versão anterior: http://127.0.0.1:${port}/atual/`);
  console.log('Deixe esta janela aberta enquanto navega. Para encerrar, pressione Ctrl+C.');
  if(process.argv.includes('--open')) spawn('rundll32.exe',['url.dll,FileProtocolHandler',`http://127.0.0.1:${port}/`],{windowsHide:true,stdio:'ignore'}).unref();
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`A prévia já pode estar aberta: http://127.0.0.1:${port}/`:error.message);process.exitCode=1;});
