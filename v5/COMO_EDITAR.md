# VIA OPUS 5.0: como ver e editar

A 5.0 fica toda na pasta `v5/` e **não altera** `site/`, `v2/`, `v2-1/`, `v3/` nem `v4/`.

## Ver no computador
Dê dois cliques em **VER VERSAO 5.0.cmd**. O endereço `http://127.0.0.1:4195/` mostra a 5.0 e `/v4/` mostra a 4.0, para comparar.
Também dá para abrir `v5/site/index.html` com dois cliques (as fontes vão embutidas) ou o arquivo `previa-via-opus-5-0.html`, que tem tudo num arquivo só.

## Conceito: "Obra viva"
- **A maquete atravessa a página**: o palco 3D fica fixo atrás do site. As seções sólidas passam por cima dele como cortinas, e ele reaparece à noite no orçamento.
- **Canteiro**: a obra se constrói com a rolagem: projeto, fundação, estrutura com grua, vedação com **andaimes**, fachada e entrega. A maquete tem reflexos, pessoas em escala, postes e janelas com brilho ao anoitecer.
- **Explore a maquete** (no fim do canteiro):
  - arraste para **girar**;
  - alterne **dia / noite**;
  - abra a **vista explodida**, com os pavimentos separados e identificados;
  - toque nos **pontos de interesse** (ripado, vidro, pedra, coroamento).
- **Portfólio**: galeria editorial. Cada imagem nasce do traço técnico, tem o "raio-x" sob o cursor, inclina levemente e entorta de leve conforme a velocidade da rolagem. Ao abrir um estudo, a foto se transforma na tela cheia (View Transitions).
- **Antes e depois**: o comparador de arrastar.
- **Como funciona**: uma linha que se desenha ligando os 3 passos.
- **Nossa história**: números que giram como odômetro, e títulos que reagem ao cursor (fonte variável).
- **Rolagem suave** com inércia no computador.

## Editar textos
- `v5/content/site.json`: todos os textos, incluindo `canteiro.etapas`, `canteiro.pontos` (pontos de interesse), `canteiro.andares` e `canteiro.explorar`.
- `v5/content/portfolio.json`: os 4 estudos.
Depois rode `node scripts/build-v5.mjs` (ou abra o .cmd de novo) e confira com `node check-v5.cjs`.

## Maquete 3D
O código fica em `v5/src/obra3d.js` e usa a biblioteca Three.js local (`v5/src/vendor/three.min.js`, licença MIT). Sem WebGL, sem JavaScript ou com "reduzir movimento" ligado, o site mostra a imagem pronta da maquete e a lista das etapas.

## Regras mantidas
WhatsApp sempre da Rafaela, com a origem do clique · sem formulário, coleta ou cookies · imagens de IA e maquete identificadas · ACADEMIA ULTRA como conceito ilustrativo · fichas como "exemplo" · registros só aparecem quando preenchidos · `meta.indexar` em `false` até publicar.
