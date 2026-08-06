# HubStation — Site Institucional

Agência de marketing especializada no mercado condominial.

## 🌐 Site ao vivo
**https://hubstation.com.br**

## 📁 Estrutura do projeto

```
hubstation/
├── index.html              # Home
├── sobre.html              # Sobre a HubStation
├── servicos.html           # Página de serviços (6 frentes)
├── eventos.html            # Webinars e workshops
├── blog.html               # Blog com 9 artigos
├── contato.html            # Formulário de contato
├── sitemap.xml             # Sitemap para Google
├── robots.txt              # Regras para crawlers
├── netlify.toml            # Configuração Netlify (headers, redirects, cache)
├── build.sh                # Script de build
├── package.json
├── css/
│   └── style.css           # Design system completo (~115KB)
├── js/
│   └── main.js             # Script de navegação e formulário
├── assets/
│   ├── logo-hz.svg         # Logo horizontal (SVG)
│   ├── logo-mark.svg       # Mark (SVG)
│   ├── logo-hz-light.png   # Logo horizontal claro
│   ├── logo-hz-dark.png    # Logo horizontal escuro
│   ├── logo-h-light.png    # Logo horizontal alt claro
│   └── logo-h-dark.png     # Logo horizontal alt escuro
└── netlify/
    └── functions/
        └── contato.mjs     # Netlify Function — envio de e-mail via Resend
```

## 🚀 Deploy

**Hosting:** Netlify (Site ID: `633ef4c2-2b7c-4e93-b67c-070a1b650ff6`)

**Build:**
```bash
bash build.sh
# Publica para /dist
```

**Publicar no Netlify via CLI:**
```bash
netlify deploy --prod --dir=dist
```

## 📧 E-mail (Resend)

**Chave:** Configurada como variável de ambiente secreta no Netlify: `RESEND_API_KEY`
**Domínio:** `hubstation.com.br` (status: pending — aguardando registros DNS)
**Endpoint:** `POST /api/contato`

### Registros DNS pendentes no Resend:
| Tipo | Nome | Valor |
|------|------|-------|
| MX  | `send` | `feedback-smtp.sa-east-1.amazonses.com` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |

### Fluxo do formulário:
1. Usuário preenche `/contato.html`
2. JS faz `POST /api/contato` com os dados em JSON
3. Netlify Function dispara 2 e-mails em paralelo via Resend:
   - **Notificação interna** → `contato@hubstation.com.br`
   - **Agradecimento** → e-mail de quem preencheu

## 🎨 Design System

**Paleta:**
- Fundo claro: `#FAFAF8` / `#F5F3EE`
- Fundo escuro: `#060606` / `#090909`
- Vermelho: `#F44336` (cor principal da marca)
- Texto: `#0E0E0E` / `rgba(255,255,255,0.x)`
- Ouro editorial: `#B8A06A`

**Tipografia (Google Fonts):**
- Display: `Cormorant Garamond` (300, 400, 500, 600, 700, italic)
- Body: `DM Sans` (300, 400, 500, 600)

**Variáveis CSS:**
```css
--fd: 'Cormorant Garamond', serif;   /* Display */
--fb: 'DM Sans', sans-serif;          /* Body */
--red: #F44336;
--ink: #0E0E0E;
--ink-2: #4A4A4A;
--ink-3: #9A9A9A;
--bg: #FAFAF8;
--bg-2: #F5F3EE;
--bg-inv: #060606;
--ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

## 🔍 SEO

**Implementado em todas as páginas:**
- Title tags otimizadas (42–60 chars)
- Meta descriptions (120–155 chars)
- Canonical tags
- Open Graph (10 meta tags)
- Twitter Cards
- Schema.org JSON-LD por página:
  - Home: Organization, WebSite, ProfessionalService, FAQPage
  - Sobre: AboutPage, Organization
  - Serviços: CollectionPage, 6x Service
  - Eventos: CollectionPage, 2x Event
  - Blog: Blog, 9x BlogPosting
  - Contato: ContactPage
- Robots meta com directivas avançadas
- DNS prefetch + preload de recursos críticos
- Lazy loading de imagens
- Alt texts descritivos em todas as imagens
- Semântica HTML5 (main, article, header, footer, nav)
- ARIA labels e skip link de acessibilidade
- `sitemap.xml` com 6 URLs
- `robots.txt` com referência ao sitemap

**Sitemap URL:** `https://hubstation.com.br/sitemap.xml`

## 📱 Instagram
`@hubstationbr` — https://www.instagram.com/hubstationbr

## ✉️ Contato
`contato@hubstation.com.br`

## 🏷️ Informações da marca
- **Tagline:** Conexão e conhecimento em um só lugar
- **Propósito:** Elevar o padrão de comunicação do mercado condominial
- **Público:** Síndicos profissionais, administradoras, prestadores de serviço, empresas de tecnologia condominial, fornecedores
- **Cor da marca:** `#F44336` (vermelho)
