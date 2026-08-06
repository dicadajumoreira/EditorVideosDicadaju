# Site editorial da HubStation — avaliação e pontos de troca

Esta pasta é o site que está no ar em hubstation.com.br, do jeito que ele veio
no ZIP `hubstationsitecompleto.zip`. Guardado aqui para versionar antes de
qualquer alteração.

---

## O que o site é

Seis páginas, sem etapa de build, servidas direto:

| Página | Altura | O que tem |
|---|---|---|
| `index.html` | 10.251 px | Hero, manifesto, números, mercado, públicos, serviços, faixa escura, método, blog |
| `servicos.html` | 8.012 px | Hero escuro, régua de frentes, manifesto e 6 capítulos alternando claro/escuro |
| `sobre.html` | 4.510 px | Hero, história, pilares, princípios |
| `eventos.html` | 3.586 px | Hero, próximos eventos, formatos |
| `blog.html` | 3.331 px | Hero e grade de 9 cards (sem página individual por matéria) |
| `contato.html` | 2.593 px | Hero e formulário |

Uma função de servidor: `netlify/functions/contato.mjs`, que manda dois e-mails
pela Resend (aviso interno e agradecimento ao lead). Não grava nada — não existe
base de contatos nem painel.

---

## O sistema visual, na prática

**Tipografia**
- Display: `Cormorant Garamond` (serifada, pesos 300–700, com itálico)
- Corpo: `DM Sans` (300–600)
- Escala em classes: `.t-super` (até 130px), `.t-display` (até 100px),
  `.t-headline` (até 60px), `.t-title`, `.t-quote`, `.t-label` (10px, caixa
  alta, tracking 0.22em), `.t-body`, `.t-body-sm`, `.t-small`

**Cor**
- Papel `#F8F7F4` e `#EFEDE8` · Tinta `#0E0E0E`, `#4A4A4A`, `#9A9A9A`
- Inversão `#0E0E0E` · Vermelho `#F44336` · Ouro `#B89B6A`

**Assinaturas do layout**
- Serifada grande com itálico vermelho na mesma frase
- Régua vermelha de 32×2px como acento recorrente
- Seções alternando claro e escuro, separadas por hairline
- Numeração fantasma grande no canto dos capítulos
- Texturas sutis: `tex-paper`, `tex-grain`, `tex-linen`, `tex-carbon`
- Rótulos minúsculos em caixa alta com muito tracking

---

## Por que a troca que você quer é pequena

Levantamento feito no código:

**Tipografia — 2 linhas.** As 72 declarações de `font-family` do CSS usam
variável, nenhuma tem fonte escrita direto. Trocar a família inteira do site é
mudar `--fd` e `--fb` no `:root`, mais o endereço das fontes em dois lugares
(o `<link>` no topo de cada página e o `@import` da primeira linha do CSS).

Os tamanhos, pesos e entrelinhas provavelmente precisam de ajuste junto: uma
serifada de 130px e uma sem-serifa de 130px não ocupam o mesmo espaço nem
pedem o mesmo tracking. Isso mexe só no bloco `TYPOGRAPHY SCALE` do CSS,
que tem 60 linhas.

**Logotipo — 1 bloco, repetido.** O wordmark é um SVG de 915×100 embutido
direto no HTML, três vezes por página (18 no total), sempre o mesmo bloco.
Uma substituição resolve. Os arquivos de logo em `assets/` (`logo-hz.svg`,
`logo-mark.svg` e quatro PNGs) não estão sendo referenciados por nenhuma
página — só o SVG embutido está em uso.

O `logo-mark.svg` é o eixo em cruz com seta, que é o mesmo conceito do
símbolo do brand book novo.

---

## O que falta neste ZIP

O deploy que está no ar tem **144 arquivos e 6 funções** (`api`, `auth`,
`contact`, `contato`, `sync` e uma compartilhada), incluindo uma rotina
diária às 6h e uma **área de clientes** com login, senha, painel e conexão
com Instagram (`/clientes/login`, `/clientes/dashboard`,
`/clientes/definir-senha`, `/clientes/conectar-instagram`,
`/clientes/ig-callback`).

Este ZIP tem 6 páginas e 1 função. Ou seja: **não é o deploy inteiro**.
Publicar só a partir daqui tiraria a área de clientes do ar.
