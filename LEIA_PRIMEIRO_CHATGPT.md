# VIA OPUS 5.0 e 5.1: instruções para o ChatGPT subir no GitHub

Pacote preparado pela Claude em 12/11/2026, a pedido do Dande Roger. O Dande **aprovou o envio ao GitHub** (repositório `dia-a-dia`, conta `danderoger`) e pediu que você faça o upload.

## O que este pacote contém
Só arquivos **novos**, com os mesmos caminhos da pasta de trabalho `via-opus` (a raiz do projeto, onde já existem `site/`, `v2/`, `v2-1/`, `v3/` e `v4/`):

- `v5/` : versão 5.0 (maquete 3D "Obra viva": andaimes, reflexos, vista explodida, dia/noite)
- `v5-1/` : versão 5.1 (base da 5.0 com os dois efeitos da 4.0: foto assentada tijolo por tijolo e números que se enchem de concreto)
- `scripts/build-v5.mjs`, `scripts/build-v51.mjs`
- `check-v5.cjs`, `check-v51.cjs`
- `serve-v5.cjs`, `serve-v51.cjs`
- `package-v5-preview.cjs`, `package-v51-preview.cjs`
- `VER VERSAO 5.0.cmd`, `VER VERSAO 5.1.cmd`

## Passo a passo
1. Extraia o zip **na raiz do projeto**, sem sobrescrever nada. Todos os arquivos acima são novos. Se algum já existir, **pare e avise o Dande** em vez de substituir.
2. Confirme que as versões anteriores continuam intactas (`site/`, `v2/`, `v2-1/`, `v3/`, `v4/`). Este pacote não toca nelas.
3. Rode os testes (só usam Node, sem `npm install`):
   - `node check-v5.cjs` e `node check-v51.cjs`: devem terminar em PASS.
   - Para reconstruir a partir do conteúdo: `node scripts/build-v51.mjs`.
4. Acrescente ao final do `NOTA_CLAUDE_PARA_CHATGPT.md` da raiz o texto de `v5/NOTA_PARA_CHATGPT.md` e depois o de `v5-1/NOTA_PARA_CHATGPT.md` (seções "5.0" e "5.1"), mantendo o que já está lá.
5. Faça o commit incluindo as pastas `v5/` e `v5-1/` e os arquivos soltos listados acima. Sugestão de mensagem: `Adiciona versões 5.0 e 5.1 (prévias) do site VIA OPUS`. Se preferir, use um branch (`versao-5-1`) e abra um pull request. Siga o fluxo que o Dande já usa com você.
6. Devolva ao Dande o **link do commit ou do pull request**.

## Para ver o resultado
- Dois cliques em `v5-1/site/index.html` (as fontes vão embutidas, funciona sem servidor).
- Ou `VER VERSAO 5.1.cmd`: abre em `http://127.0.0.1:4196/`; a 5.0 fica em `/v5/`.

## Regras que não devem mudar
- **Não publique em hospedagem, domínio ou produção.** A 5.0 e a 5.1 são prévias para o Dande escolher qual segue. `meta.indexar` está `false` em ambas: mantenha assim.
- Todo botão de WhatsApp vai para a Rafaela, **(61) 8518-9004** (`556185189004`), com "Origem: site VIA OPUS · …".
- Sem formulário, coleta de dados, cookies ou storage.
- Imagens geradas por IA e a maquete 3D estão identificadas como ilustrativas. ACADEMIA ULTRA é conceito ilustrativo.
- Não inventar obras, depoimentos, certificações, contatos ou credenciais. Os "mais de 30 anos" são da carreira do Fernando Taveira, não da empresa.
- Não altere conteúdo ou design sem pedido do Dande. Para editar textos: `v5-1/content/site.json` e `portfolio.json`, depois `node scripts/build-v51.mjs`.
