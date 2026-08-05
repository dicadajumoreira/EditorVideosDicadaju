#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Conversao unica do prototipo de design (Site HubStation.dc.html) para o site
estatico multipagina em site-hubstation/.

Rodar de novo SOBRESCREVE as paginas geradas. Depois da primeira conversao, o
site e editado direto nos arquivos .html — este script fica so como registro de
como o prototipo virou codigo.

Uso:
    python3 tools/build_from_prototype.py <caminho-do-prototipo.dc.html>
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- rotas -----

ROUTES = {
    "isHome": "index.html",
    "isServicos": "servicos.html",
    "isMetodo": "metodo.html",
    "isMercado": "mercado.html",
    "isPortfolio": "portfolio.html",
    "isSobre": "agencia.html",
    "isContato": "contato.html",
    "isAdmin": "admin.html",
}

# nome da funcao de navegacao do prototipo -> arquivo de destino
NAV = {
    "goHome": "index.html",
    "goServicos": "servicos.html",
    "goMetodo": "metodo.html",
    "goMercado": "mercado.html",
    "goPortfolio": "portfolio.html",
    "goSobre": "agencia.html",
    "goContato": "contato.html",
    "goAdmin": "admin.html",
}

SEO = {
    "index.html": (
        "HubStation | Marketing para o mercado condominial",
        "Agencia de marketing e eventos especializada 100% no mercado condominial. "
        "Posicionamento, conteudo, presenca digital e campanhas para sindicos "
        "profissionais, administradoras e fornecedores do setor.",
    ),
    "servicos.html": (
        "Servicos | HubStation",
        "Seis frentes de trabalho para marcas do mercado condominial: posicionamento, "
        "identidade, conteudo, site, campanhas e eventos. Entregaveis, quando "
        "contratar e formato de cada uma.",
    ),
    "metodo.html": (
        "Metodo | HubStation",
        "A decisao vem antes da producao. Conheca as quatro etapas do metodo "
        "HubStation, o que acontece em cada uma e o que voce recebe ao final.",
    ),
    "mercado.html": (
        "Mercado | HubStation",
        "Oito frentes do ecossistema condominial brasileiro: a dor de cada segmento, "
        "o que a HubStation faz por ele e o calendario do setor.",
    ),
    "portfolio.html": (
        "Portfolio | HubStation",
        "Gestao de redes sociais, producao para YouTube e sites entregues pela "
        "HubStation para marcas do mercado condominial.",
    ),
    "agencia.html": (
        "A agencia | HubStation",
        "Desde o setor, para o setor. Proposito, missao, visao, valores e "
        "compromissos da HubStation com o mercado condominial.",
    ),
    "contato.html": (
        "Contato | HubStation",
        "Quarenta minutos de conversa sobre o momento da sua empresa. Sem "
        "apresentacao de vendas, sem proposta antes de entender o problema.",
    ),
    "admin.html": (
        "Painel de contatos | HubStation",
        "Area interna da HubStation.",
    ),
}

NOINDEX = {"admin.html"}

CANONICAL_BASE = "https://hubstation.com.br"


# -------------------------------------------------------- utilidades --------

def read_prototype(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def slice_between(text, start_marker, end_marker, start_from=0):
    i = text.index(start_marker, start_from)
    j = text.index(end_marker, i) + len(end_marker)
    return text[i:j], j


class HoverCss(object):
    """Converte style-hover / style-focus em classes CSS de verdade."""

    def __init__(self):
        self.rules = {}   # (pseudo, declaracoes) -> nome da classe
        self.order = []

    def class_for(self, pseudo, decls):
        decls = decls.strip().rstrip(";")
        key = (pseudo, decls)
        if key not in self.rules:
            name = "hs-%s%d" % ("h" if pseudo == "hover" else "f", len(self.rules) + 1)
            self.rules[key] = name
            self.order.append(key)
        return self.rules[key]

    def stylesheet(self):
        out = []
        for pseudo, decls in self.order:
            name = self.rules[(pseudo, decls)]
            body = ";".join(d.strip() + " !important" for d in decls.split(";") if d.strip())
            out.append(".%s:%s{%s}" % (name, pseudo, body))
        return "\n".join(out)


def add_class(tag, class_name):
    """Insere uma classe na tag de abertura recebida (string com < ... >)."""
    m = re.search(r'\sclass="([^"]*)"', tag)
    if m:
        return tag[:m.start(1)] + (m.group(1) + " " + class_name).strip() + tag[m.end(1):]
    # depois do nome do elemento
    m = re.match(r"<([a-zA-Z][\w-]*)", tag)
    end = m.end()
    return tag[:end] + ' class="%s"' % class_name + tag[end:]


def convert_state_styles(html, hover_css):
    """style-hover="..." / style-focus="..." -> class + regra CSS."""

    def repl(match):
        tag = match.group(0)
        classes = []
        for pseudo in ("hover", "focus"):
            m = re.search(r'\sstyle-%s="([^"]*)"' % pseudo, tag)
            if m:
                classes.append(hover_css.class_for(pseudo, m.group(1)))
                tag = tag[:m.start()] + tag[m.end():]
        for c in classes:
            tag = add_class(tag, c)
        return tag

    return re.sub(r"<[a-zA-Z][^>]*style-(?:hover|focus)=\"[^\"]*\"[^>]*>", repl, html)


def convert_nav_buttons(html):
    """<button onClick="{{ goX }}" ...>...</button> -> <a href="x.html" ...>."""

    def repl(match):
        open_tag, target, rest = match.group(0), match.group(1), None
        href = NAV.get(target)
        if not href:
            return open_tag
        tag = open_tag.replace(' onClick="{{ %s }}"' % target, "")
        tag = "<a href=\"%s\"" % href + tag[len("<button"):]
        return add_class(tag, "hs-btn")

    html = re.sub(r'<button[^>]*onClick="\{\{ (go\w+) \}\}"[^>]*>', repl, html)
    # fecha as tags trocadas: percorre e casa <a class="hs-btn" ...> ... </button>
    out, depth, i = [], 0, 0
    tokens = re.split(r"(<button\b|</button>|<a\b[^>]*hs-btn[^>]*>)", html)
    open_converted = []
    for tok in tokens:
        if tok.startswith("<button"):
            open_converted.append(False)
        elif tok.startswith("<a") and "hs-btn" in tok:
            open_converted.append(True)
        elif tok == "</button>":
            if open_converted and open_converted.pop():
                tok = "</a>"
        out.append(tok)
    return "".join(out)


def strip_sc_if(html, truthy=True):
    """Resolve <sc-if> internos (mostrarSelo, narrativaCompleta, enviado)."""
    html = re.sub(r'<sc-if value="\{\{ (?:mostrarSelo|narrativaCompleta) \}\}"[^>]*>', "", html)
    # bloco de sucesso do formulario: vira um elemento oculto controlado por JS
    html = re.sub(
        r'<sc-if value="\{\{ enviado \}\}"[^>]*>',
        '<div id="form-sucesso" hidden>',
        html,
    )
    html = html.replace("</sc-if>", "</div>" if "id=\"form-sucesso\"" in html else "")
    return html


# ---------------------------------------------------------- montagem --------

def build_head(page, extra_css=""):
    title, desc = SEO[page]
    robots = "noindex,nofollow" if page in NOINDEX else "index,follow"
    canonical = CANONICAL_BASE + ("/" if page == "index.html" else "/" + page)
    return """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HubStation">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{base}/assets/logos/logo-v3.png">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#080808">
<link rel="icon" type="image/png" href="/assets/logos/circulo.png">
<link rel="apple-touch-icon" href="/assets/logos/circulo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;800&family=Space+Grotesk:wght@500;700&display=swap">
<link rel="stylesheet" href="/assets/css/site.css">
{extra_css}</head>
<body>
""".format(title=title, desc=desc, robots=robots, canonical=canonical,
           base=CANONICAL_BASE, extra_css=extra_css)


def main():
    proto_path = sys.argv[1]
    raw = read_prototype(proto_path)

    # CSS base vindo do <helmet>
    base_css = "\n".join(re.findall(r"<style>(.*?)</style>", raw, re.S)[:3]).strip()

    header, _ = slice_between(raw, "<header ", "</header>")
    footer_start = raw.index('<footer id="site-footer"')
    footer_end = raw.index("</div>\n\n</x-dc>")
    footer = raw[footer_start:footer_end].strip()

    hover_css = HoverCss()

    pages = {}
    for flag, filename in ROUTES.items():
        start = raw.index('<sc-if value="{{ %s }}"' % flag)
        start = raw.index("<main>", start)
        end = raw.index("</main>", start) + len("</main>")
        pages[filename] = raw[start:end]

    shared_header = convert_state_styles(header, hover_css)
    shared_header = convert_nav_buttons(shared_header)
    shared_footer = convert_state_styles(footer, hover_css)
    shared_footer = convert_nav_buttons(shared_footer)

    built = {}
    for filename, body in pages.items():
        body = convert_state_styles(body, hover_css)
        body = convert_nav_buttons(body)
        body = strip_sc_if(body)
        built[filename] = body

    # o CSS gerado precisa existir antes de escrever as paginas
    with open(os.path.join(ROOT, "tools", "_gerado.css"), "w", encoding="utf-8") as fh:
        fh.write("/* Camada gerada a partir do prototipo. Referencia: o CSS\n   de producao e assets/css/site.css, mantido a mao. Se este script\n   rodar de novo, reconcilie as duas coisas. */\n")
        fh.write(base_css + "\n")
        fh.write(hover_css.stylesheet() + "\n")

    for filename, body in built.items():
        html = build_head(filename)
        html += shared_header + "\n" + body + "\n" + shared_footer + "\n"
        html += '<script src="/assets/js/site.js" defer></script>\n</body>\n</html>\n'
        with open(os.path.join(ROOT, filename), "w", encoding="utf-8") as fh:
            fh.write(html)
        print("escrito:", filename)


if __name__ == "__main__":
    main()
