# via-opus-site

Site institucional da **VIA OPUS — Engenharia & Construções**: https://viaopusconstrutora.com.br

- Versão em produção: **5.1** (`v5-1/`). A 5.0 (`v5/`) fica preservada para consulta.
- Publicação automática pelo GitHub Actions a cada commit na `main`.
- Como atualizar, testar, publicar e voltar atrás: [DEPLOY.md](DEPLOY.md). Situação atual e continuidade: [HANDOFF.md](HANDOFF.md).

## Comandos
```
node scripts/build-v51.mjs   # gera v5-1/site a partir de v5-1/content, src, assets e fonts
node check-v51.cjs           # testes de publicação
node serve-v51.cjs           # prévia local em http://127.0.0.1:4196/
node check-historico.cjs     # informa quais versões antigas existem (opcional)
```
