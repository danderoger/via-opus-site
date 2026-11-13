# DEPLOY: como publicar e atualizar o site VIA OPUS

Site oficial: **https://viaopusconstrutora.com.br** (versão 5.1)
Repositório: `danderoger/via-opus-site` · branch de produção: `main`

## Visão geral
- **Hospedagem:** GitHub Pages (plano gratuito), publicada por GitHub Actions (`.github/workflows/publicar.yml`).
- **O que vai ao ar:** somente `v5-1/site/`, gerado por `scripts/build-v51.mjs` a partir de `v5-1/content/`, `v5-1/src/`, `v5-1/assets/` e `v5-1/fonts/`. O build usa só arquivos que estão neste repositório (não depende de `v2-1` ou outras pastas locais).
- **DNS:** fica no próprio Registro.br (nameservers `a.auto.dns.br` e `b.auto.dns.br`, DNSSEC ativo). Nada foi migrado de provedor.
- **Custo:** zero (GitHub Pages gratuito; o domínio é pago à parte no Registro.br).

## Fluxo normal de atualização
1. Edite os textos em `v5-1/content/site.json` e `v5-1/content/portfolio.json` (imagens em `v5-1/assets/`, estilo em `v5-1/src/styles.css`, comportamento em `v5-1/src/app.js`, maquete 3D em `v5-1/src/obra3d.js`).
2. Rode localmente: `node scripts/build-v51.mjs && node check-v51.cjs` (precisa só de Node 20+; sem `npm install`).
3. Para ver no computador: `node serve-v51.cjs` (http://127.0.0.1:4196/) ou abra `v5-1/site/index.html`.
4. Mudanças pequenas e aprovadas: commit direto na `main`. Mudanças importantes: crie um branch, abra um **pull request**; o Actions constrói e testa e anexa a **prévia para baixar** (artefato `previa-via-opus-site`). Ao aprovar e fazer o merge, o site é publicado.
5. A publicação leva cerca de 1 a 2 minutos. Acompanhe em **Actions** no GitHub.
6. Confira `https://viaopusconstrutora.com.br/versao.json`: mostra a versão e o **commit** publicado.

Os testes do Actions barram a publicação se falharem (WhatsApp da Rafaela, origem do clique, avisos de IA/maquete, recursos só locais, sem formulário/coleta, CSP, SEO, sitemap, etc.).

## Rollback (voltar a uma versão anterior)
- Pelo GitHub: abra o commit problemático e clique em **Revert**, abrindo um PR ou fazendo commit na `main`. O Actions republica em ~2 minutos.
- Ou em **Actions > Publicar VIA OPUS 5.1**, abra uma execução antiga que tenha dado certo e use **Re-run all jobs** (publica novamente aquele commit).

## Configuração do GitHub Pages
- Settings > Pages > **Source: GitHub Actions**.
- Custom domain: `viaopusconstrutora.com.br`; **Enforce HTTPS** ligado (o certificado é emitido automaticamente depois que o DNS aponta para o GitHub).
- O `www` redireciona automaticamente para o domínio principal.

## DNS (Registro.br > DNS do Registro.br)
| Nome | Tipo | Valor |
|---|---|---|
| (raiz) | A | 185.199.108.153 · 185.199.109.153 · 185.199.110.153 · 185.199.111.153 |
| (raiz) | AAAA | 2606:50c0:8000::153 · 2606:50c0:8001::153 · 2606:50c0:8002::153 · 2606:50c0:8003::153 |
| www | CNAME | danderoger.github.io |

Não apague registros `MX`, `TXT` (SPF, DKIM, DMARC) ou outros que existam para e-mail. Antes de mudar o DNS, registre a configuração atual (ver `HANDOFF.md`).

## Verificação depois de publicar
- `https://viaopusconstrutora.com.br/` abre a 5.1 (rodapé "Versão 5.1" e `/versao.json`).
- `https://www.viaopusconstrutora.com.br/` redireciona para o domínio principal; `http://` redireciona para `https://`.
- `/robots.txt` e `/sitemap.xml` respondem.
- Os 7 botões de WhatsApp apontam para `556185189004`.

## Google
Depois de publicado, cadastre `https://viaopusconstrutora.com.br/` no Google Search Console (verificação por DNS TXT, feita pelo dono do domínio) e envie `sitemap.xml`. A indexação efetiva depende do Google.

## Regras que continuam valendo
WhatsApp sempre da Rafaela com "Origem: site VIA OPUS · …"; sem formulário, rastreamento ou cookies; imagens de IA e maquete identificadas como ilustrativas; não inventar obras, depoimentos, certificações ou contatos; os "mais de 30 anos" são da carreira de Fernando Taveira; versões anteriores (`v5/` e as antigas) não são alteradas.
