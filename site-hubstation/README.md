# Site da HubStation

Site institucional da HubStation, feito a partir do pacote de design
`Hubstation_Brand_Book_site.zip`. São páginas HTML simples: dá para abrir
qualquer arquivo `.html` num editor de texto e mudar o que estiver escrito.
Não existe etapa de compilação.

---

## O que tem aqui

| Arquivo | Página |
|---|---|
| `index.html` | Home |
| `servicos.html` | Serviços |
| `metodo.html` | Método |
| `mercado.html` | Mercado |
| `portfolio.html` | Portfólio |
| `agencia.html` | A agência |
| `contato.html` | Contato (com formulário) |
| `admin.html` | Painel de contatos, protegido por senha |
| `404.html` | Página de endereço não encontrado |

Tudo o mais:

- `assets/css/site.css` — todo o visual do site
- `assets/js/site.js` — menu do celular, animações, formulário e painel
- `assets/logos/` — logos oficiais
- `assets/img/portfolio/` — **prints do portfólio (ainda faltam, veja abaixo)**
- `netlify/functions/` — o que recebe o formulário e alimenta o painel
- `tools/` — o script que converteu o protótipo em site; serve só de registro

---

## Ainda falta preencher

1. **Número do WhatsApp.** Hoje está o provisório `5511999999999`, no botão
   verde flutuante e nos rodapés. Trocar em todos os `.html` de uma vez.
2. **Instagram e LinkedIn.** Os links estão apontando para as páginas iniciais
   das redes (`https://instagram.com/`), sem o perfil da HubStation.
3. **Prints do portfólio.** Cinco imagens, que devem entrar em
   `assets/img/portfolio/` com estes nomes exatos:
   `dicadajumoreira.jpg`, `sindicompanybr.jpg`, `bysindicompany.jpg`,
   `lavandery.jpg` (todas em 4:5) e `youtube-dicadaju.jpg` (16:9).
   Enquanto não subirem, aparece uma moldura tracejada dizendo o que falta —
   o site não quebra.
4. **Domínio.** As tags de SEO estão escritas para `https://hubstation.com.br`.
   Se o endereço for outro, trocar nos `.html`, no `robots.txt` e no
   `sitemap.xml`.

---

## Publicar no Netlify

O site inteiro é esta pasta. O `netlify.toml` já traz a configuração:
publica a pasta raiz, aponta as funções e cria os endereços limpos
(`/servicos` em vez de `/servicos.html`).

Depois de criar o projeto no Netlify, configurar em
**Site configuration › Environment variables**:

| Variável | Para quê | Obrigatória |
|---|---|---|
| `PAINEL_SENHA` | senha de acesso ao `/admin` | sim |
| `RESEND_API_KEY` | avisar por e-mail a cada contato novo | não |
| `CONTATO_DESTINO` | para quem vai o aviso (padrão `contato@hubstation.com.br`) | não |
| `CONTATO_REMETENTE` | de quem sai o aviso (padrão `site@hubstation.com.br`) | não |

Sem `RESEND_API_KEY` o site continua funcionando: o contato é gravado e
aparece no painel, só não dispara e-mail.

Sem `PAINEL_SENHA` o painel recusa qualquer senha — ninguém entra.

---

## Como o formulário funciona

1. A pessoa preenche em `/contato` e envia.
2. `netlify/functions/form-contact.mjs` recebe, descarta robô (campo isca
   escondido), guarda no Netlify Blobs e, se houver chave, manda o e-mail.
3. Em `/admin`, depois da senha, a lista aparece com data, status, dados e
   o que a pessoa escreveu. Dá para marcar como respondido, excluir e
   exportar um CSV que abre direto no Excel.

---

## Mexer no site

- **Trocar um texto:** abrir o `.html` da página e editar o texto entre as
  tags. O visual não depende do texto.
- **Trocar uma cor ou espaçamento:** os estilos estão escritos dentro das
  próprias tags (`style="..."`), do jeito que vieram do design. O que é geral
  — fundo, fontes, comportamento no celular — está em `assets/css/site.css`.
- **Ver o site na máquina antes de publicar:** de dentro desta pasta,
  `python3 -m http.server 8000` e abrir `http://localhost:8000`. O formulário
  e o painel só funcionam de verdade no Netlify, porque dependem das funções.

O menu do celular, a barra de progresso de leitura, as animações de entrada
e o rotador de palavras da home estão todos em `assets/js/site.js`.
