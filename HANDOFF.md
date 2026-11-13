# HANDOFF: VIA OPUS (site oficial)

Atualizado em 13/11/2026.

## Situação atual
- **Site oficial:** https://viaopusconstrutora.com.br, versão **5.1** (diretório `v5-1/`, publicado a partir de `v5-1/site/`).
- **Repositório:** https://github.com/danderoger/via-opus-site · branch de produção `main`. A publicação entrou pelo pull request #1 (commit de merge `c7dc757`).
- **Identificação da versão publicada:** `https://viaopusconstrutora.com.br/versao.json` (versão e commit) e rodapé "Versão 5.1".
- A 5.0 (`v5/`) está preservada, sem alterações.

## Infraestrutura
- **Hospedagem:** GitHub Pages (gratuito), publicado por GitHub Actions (`.github/workflows/publicar.yml`): a cada push na `main`, reconstrói `v5-1/site`, roda `check-v51.cjs` e publica. Pull requests só constroem e testam e anexam uma prévia para baixar.
- **Domínio:** `viaopusconstrutora.com.br`, registrado em 12/11/2026 no Registro.br (titular: Dia A Dia Construcoes e Engenharia LTDA; contato: DRSLO29). Vence em 12/11/2027.
- **DNS:** servidores do próprio Registro.br (`a.auto.dns.br`, `b.auto.dns.br`), DNSSEC ativo, zona em **modo avançado** (ativado em 13/11/2026; só volta ao modo básico depois de 2 horas).
- **Configuração anterior do DNS (para recuperação):** apenas os padrões do Registro.br: MX nulo (`0 .`) e TXT SPF `v=spf1 -all`. Nenhum e-mail estava configurado; esses dois registros foram mantidos.
- **Registros adicionados:** ver `DEPLOY.md` (A e AAAA da raiz para o GitHub Pages; CNAME do `www` para `danderoger.github.io`).
- **HTTPS e redirecionamentos (verificados em 13/11/2026):** certificado emitido pelo GitHub Pages (Let's Encrypt), "Enforce HTTPS" ativado; `http://` redireciona para `https://`, e `www.viaopusconstrutora.com.br` redireciona para o domínio sem www. O aviso de "conexão não segura" do Chrome aparecia só enquanto o certificado ainda não tinha sido emitido (verificação de DNS do GitHub pendente).
- **Custo:** nenhum para a hospedagem. Cloudflare não foi usado: o domínio fica no DNS do Registro.br e não foi necessário migrar nameservers nem mexer no DNSSEC.

## Como atualizar
Veja `DEPLOY.md`. Resumo: editar `v5-1/content/*.json` / `v5-1/assets` / `v5-1/src`, rodar `node scripts/build-v51.mjs && node check-v51.cjs`, abrir pull request (ou commit na `main` para mudanças pequenas aprovadas). O Actions publica em 1 a 2 minutos. Rollback: reverter o commit ou reexecutar uma execução anterior do workflow.

## Acesso usado nesta publicação
Foi autorizado o GitHub CLI (permissões `repo` e `workflow`) na conta `danderoger` para enviar o código. Pode ser revogado em GitHub > Settings > Applications > Authorized OAuth Apps.

## Pendências
- Cadastrar o site no Google Search Console e enviar `sitemap.xml` (verificação por TXT no DNS, feita pelo titular).
- E-mail profissional (`@viaopusconstrutora.com.br`) ainda não existe; ao configurar, acrescentar MX/SPF/DKIM/DMARC sem apagar nada sem entender.
- Dados institucionais a incluir pelo Dande quando prontos: CNPJ/credenciais no site (`credenciais` em `site.json`), fotos reais, depoimentos reais, Instagram.
- Versões antigas (`site/`, `v2/`, `v2-1/`, `v3/`, `v4/`) existem só na pasta de trabalho local; não estão neste repositório. O build da 5.1 não depende delas (`check-historico.cjs` apenas informa).

## Regras
WhatsApp sempre da Rafaela (556185189004) com "Origem: site VIA OPUS · …"; sem formulário, rastreamento ou cookies; avisos de imagens/maquete ilustrativas mantidos; não inventar obras, certificações, depoimentos ou contatos; os "mais de 30 anos" são da carreira de Fernando Taveira; não alterar o sistema financeiro Obra em Dia (outro projeto).
