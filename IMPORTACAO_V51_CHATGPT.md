# Importação das prévias VIA OPUS 5.0 e 5.1

Responsável: ChatGPT. Destino corrigido expressamente por Dande: `danderoger/via-opus-site`, substituindo a referência a `dia-a-dia` no LEIA_PRIMEIRO original. Fonte: `VIA-OPUS-5-1-para-ChatGPT-GitHub.zip`.

Base examinada: `90fd97d43f176720a8f5a230a9969b0fc5509ffd`. A main continha somente README.md. Esse arquivo foi preservado integralmente. Nenhum arquivo do ZIP colide com os caminhos existentes. O pacote original foi mantido sem mudanças de conteúdo ou design.

Como NOTA_CLAUDE_PARA_CHATGPT.md não existia, foi criado com as notas 5.0 e 5.1, nessa ordem. As referências históricas do pacote a versões antigas não comprovam que elas estejam neste repositório: site/, v2/, v2-1/, v3/ e v4/ estão ausentes na base examinada.

## Verificações

- `node check-v5.cjs`: código de saída 1, exclusivamente pela ausência de cinco versões anteriores.
- `node check-v51.cjs`: código de saída 1, exclusivamente pela ausência das mesmas cinco versões anteriores.
- Nenhuma falha nos demais critérios desses verificadores: recursos locais, WhatsApp, avisos de imagens ilustrativas, privacidade e estrutura da página.
- A reconstrução não foi executada: scripts/build-v51.mjs depende de fontes externas ao pacote, em v2-1/site/fonts. Os arquivos prontos v5-1/site/fonts.css e v5/site/fonts.css já contêm as fontes embutidas.
- Não foi realizada inspeção visual em navegador; a validação estática não comprova animações, responsividade ou desempenho.

## Revisar e continuar

Abrir v5-1/site/index.html para a prévia principal e v5/site/index.html para comparação. A recuperação das fontes e dos arquivos históricos permitirá executar os verificadores e a reconstrução completos, sem inventar versões anteriores nem remover testes.

Seguindo LEIA_PRIMEIRO_CHATGPT.md, esta entrega é somente no GitHub: não publica em Cloudflare, não altera domínio e mantém noindex. Nenhuma alteração no sistema financeiro, na planilha ou no repositório dia-a-dia.
