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
| `blog.html` | Blog (lista das matérias) |
| `blog/*.html` | Uma página por matéria |
| `agencia.html` | A agência |
| `contato.html` | Contato (com formulário) |
| `admin.html` | Painel interno, protegido por senha |
| `404.html` | Página de endereço não encontrado |

Tudo o mais:

- `assets/css/site.css` — o visual do site
- `assets/css/admin.css` — o visual do painel
- `assets/js/site.js` — menu do celular, animações, formulário e a trava do WhatsApp
- `assets/js/blog.js` — listagem e filtro por tema do blog
- `assets/js/admin.js` — o painel inteiro
- `assets/blog/artigos.json` — índice das matérias (gerado, não editar à mão)
- `conteudo/blog/` — o texto das matérias, em `.md`
- `netlify/functions/` — o que roda no servidor
- `tools/` — os scripts que geram páginas

---

## Como funciona o contato

Existe **uma única base**. Tudo cai nela, e tudo aparece em `/admin`.

1. **Formulário da página Contato** → gravado com canal `site`.
2. **Botão do WhatsApp** → antes de abrir a conversa, aparece o mesmo
   cadastro. Só depois de preencher a pessoa vai para o WhatsApp. Fica
   gravado com canal `whatsapp`.

Nos dois casos: um aviso chega no seu e-mail e o cliente recebe uma
confirmação automática (se a chave da Resend estiver configurada).

Quem chega pelo botão do WhatsApp já entra com aceite para receber mensagens
por WhatsApp. Quem vem pelo formulário do site, não — só entra no disparo de
WhatsApp se marcar isso.

---

## O painel `/admin`

Entra com senha. A senha é trocada por um passe que vale 12 horas, então ela
não fica indo e voltando a cada clique.

**Contatos** — todos os cadastros, com busca, filtro por canal, status e
segmento. Dá para marcar como respondido, tirar alguém da lista, excluir e
exportar CSV (abre direto no Excel).

**Disparo por e-mail** — você escreve assunto e corpo, escolhe para quem vai
(por segmento e por origem), manda um teste para si mesma e dispara. Usa
`{{nome}}`, `{{empresa}}` e `{{segmento}}` para personalizar. O rodapé com o
link de descadastro entra sozinho em todo disparo — isso é obrigatório e não
tem como desligar. O envio é em fila, com pausa entre um e outro, para não
esbarrar no limite da Resend.

**Disparo por WhatsApp** — o WhatsApp só permite que a empresa **inicie**
conversa com um texto aprovado pela Meta (um "template"). Você cria e aprova
os textos no Gerenciador do WhatsApp Business; assim que aprovarem, eles
aparecem na lista do painel. Só recebe quem deixou WhatsApp e aceitou.

**Histórico** — o que já foi disparado, quantos receberam, quantos falharam,
e se algum disparo parou no meio.

---

## Publicar no Netlify

O site inteiro é esta pasta. O `netlify.toml` já traz a configuração:
publica a pasta raiz, aponta as funções e cria os endereços limpos
(`/servicos` em vez de `/servicos.html`).

Configurar em **Site configuration › Environment variables**:

| Variável | Para quê | Obrigatória |
|---|---|---|
| `PAINEL_SENHA` | senha de acesso ao `/admin` | sim |
| `AUTH_SECRET` | assina o passe do painel e os links de descadastro | sim |
| `RESEND_API_KEY` | avisar por e-mail e fazer os disparos | para e-mail |
| `CONTATO_DESTINO` | para quem vai o aviso de contato novo | não |
| `CONTATO_REMETENTE` | de quem sai o e-mail | não |
| `WHATSAPP_COMERCIAL` | número do WhatsApp comercial, só dígitos | não |
| `WHATSAPP_ACCESS_TOKEN` | token permanente da Meta | para WhatsApp |
| `WHATSAPP_PHONE_NUMBER_ID` | id do número na Meta | para WhatsApp |
| `WHATSAPP_WABA_ID` | id da conta WhatsApp Business | para WhatsApp |

Sem `RESEND_API_KEY` o site continua funcionando: o contato é gravado e
aparece no painel, só não dispara e-mail. Sem as variáveis do WhatsApp, a aba
do WhatsApp diz exatamente o que falta em vez de quebrar.

---

## Publicar uma matéria no blog

1. Escreva o texto num arquivo `.md` dentro de `conteudo/blog/`.
   Use `conteudo/blog/_modelo.md` como referência do formato.
2. Rode, de dentro de `site-hubstation/`:

   ```
   python3 tools/publicar_artigo.py conteudo/blog/*.md
   ```

Isso gera a página de cada matéria em `blog/` e refaz o índice que a página
`blog.html` lê. Imagens de capa vão em `assets/blog/img/`, em 1600×900.

---

## Ainda falta preencher

1. **Prints do portfólio.** Cinco imagens em `assets/img/portfolio/` — veja
   o `LEIA-ME.txt` de lá. Enquanto não subirem, aparece uma moldura tracejada
   dizendo o que falta; o site não quebra.
2. **As 67 matérias do calendário.** As 9 originais já estão escritas e no ar.
   O calendário com as outras 67 pautas está em
   `conteudo/blog/plano-editorial.py`, esperando aval dos títulos.

O número de WhatsApp (`5511988815448`), os perfis de Instagram e LinkedIn
(@hubstationbr) e o domínio já estão preenchidos.

---

## Mexer no site

- **Trocar um texto:** abra o `.html` da página e edite o texto entre as tags.
- **Trocar cor ou espaçamento:** os estilos estão dentro das próprias tags
  (`style="..."`), do jeito que vieram do design. O que é geral — fundo,
  fontes, comportamento no celular — está em `assets/css/site.css`.
- **Ver o site antes de publicar:** de dentro desta pasta,
  `python3 -m http.server 8000` e abra `http://localhost:8000`. O formulário,
  o painel e os disparos só funcionam de verdade no Netlify, porque dependem
  das funções do servidor.
