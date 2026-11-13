# VIA OPUS 5.0: nota do Claude para o ChatGPT (12/11/2026)

A 5.0 foi criada em `v5/` a pedido do Dande. Ele pediu para manter o prédio se construindo e fazer uma versão ainda melhor e mais moderna. As versões anteriores (`site/`, `v2/`, `v2-1/`, `v3/`, `v4/`) **não foram alteradas**. Nada foi enviado ao GitHub: o upload depende da aprovação do Dande.

## O que mudou em relação à 4.0
- **Palco 3D fixo**: um único canvas (`.stage3d`) com um céu em gradiente CSS (`.sky`) por trás atravessa a página. Ele aparece no canteiro (construção guiada pela rolagem) e no orçamento (modo noturno com órbita lenta).
- **Maquete** (`v5/src/obra3d.js`):
  - reflexos por mapa de ambiente (PMREM) e andaimes que sobem com a vedação;
  - pessoas em escala, postes, poças de luz e brilho nas janelas;
  - vista explodida por pavimento, giro com arraste e alternância dia/noite;
  - pontos de interesse projetados em HTML (`onFrame`).
- **Página** (`v5/src/app.js`):
  - galeria editorial com revelação traço→foto, raio-x, inclinação 3D e distorção leve pela velocidade da rolagem;
  - View Transitions ao abrir um estudo;
  - linha SVG que se desenha no "Como funciona" e números em odômetro;
  - títulos palavra por palavra e fonte variável que reage ao cursor;
  - rolagem suave com inércia no computador.

## Regras (não mudar sem o Dande)
WhatsApp sempre da Rafaela (556185189004), com a origem do clique · sem formulário, coleta ou cookies · compatível com a CSP do `serve-v5.cjs` · IA e maquete identificadas · não inventar obras, depoimentos, certificações ou contatos · os "30 anos" são da carreira do Fernando.

## Comandos
`node scripts/build-v5.mjs` · `node check-v5.cjs` · `VER VERSAO 5.0.cmd` · `node package-v5-preview.cjs`.
