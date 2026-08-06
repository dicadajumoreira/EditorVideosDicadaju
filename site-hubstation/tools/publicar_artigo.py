#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Publica materias do blog da HubStation.

Le arquivos .md simples (um por materia), gera a pagina HTML de cada uma em
blog/<slug>.html e reescreve o indice assets/blog/artigos.json que alimenta a
listagem em blog.html.

Formato do .md — um cabecalho de chave: valor, uma linha em branco, e o texto:

    titulo: Como um sindico profissional constroi autoridade
    resumo: Tres movimentos que separam quem e lembrado de quem e procurado.
    data: 2026-07-14
    tema: Posicionamento
    capa: /assets/blog/img/autoridade.jpg
    autor: HubStation

    ## O primeiro movimento

    Texto corrido em paragrafos. Linha em branco separa paragrafo.

    - item de lista
    - outro item

    > Uma citacao em destaque.

Marcacao aceita: ## e ### para titulos, **negrito**, *italico*,
[texto](link), listas com "-" e citacao com ">". E de proposito um
subconjunto pequeno: o blog e texto, nao layout.

Uso:
    python3 tools/publicar_artigo.py conteudo/blog/*.md
    python3 tools/publicar_artigo.py --reindexar     (so refaz o indice)
"""

import glob
import html
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA_ARTIGOS = os.path.join(RAIZ, "blog")
INDICE = os.path.join(RAIZ, "assets", "blog", "artigos.json")
BASE = "https://hubstation.com.br"


# ------------------------------------------------------------- utilidades --

def url_absoluta(caminho):
    """A capa pode ser um arquivo do site (/assets/...) ou uma URL externa."""
    if caminho.startswith("http://") or caminho.startswith("https://"):
        return caminho
    return BASE + caminho


def slugificar(texto):
    s = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    return re.sub(r"[\s_-]+", "-", s)[:80]


def ler_md(caminho):
    with open(caminho, encoding="utf-8") as fh:
        bruto = fh.read()

    partes = bruto.split("\n\n", 1)
    cabecalho, corpo = (partes + [""])[:2]

    meta = {}
    linhas_sobrando = []
    for linha in cabecalho.splitlines():
        m = re.match(r"^(\w+):\s*(.*)$", linha)
        if m:
            meta[m.group(1).lower()] = m.group(2).strip()
        elif linha.strip():
            linhas_sobrando.append(linha)

    if linhas_sobrando:
        corpo = "\n".join(linhas_sobrando) + "\n\n" + corpo

    if not meta.get("titulo"):
        raise ValueError("%s: falta a linha 'titulo:' no cabecalho" % caminho)

    meta.setdefault("slug", slugificar(meta["titulo"]))
    meta.setdefault("autor", "HubStation")
    meta.setdefault("data", "")
    meta.setdefault("tema", "")
    meta.setdefault("resumo", "")
    meta.setdefault("capa", "")
    return meta, corpo.strip()


def em_linha(texto):
    """Negrito, italico e links. O texto entra escapado."""
    t = html.escape(texto)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(
        r"\[(.+?)\]\((https?://[^)\s]+|/[^)\s]*)\)",
        r'<a href="\2" style="color:#F9DCA7;border-bottom:1px solid rgba(249,220,167,0.4)">\1</a>',
        t,
    )
    return t


P = 'style="font-family:Archivo,sans-serif;font-size:17.5px;line-height:1.75;color:#D5D3CD;margin:0 0 26px"'
H2 = ('style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:clamp(24px,2.8vw,34px);'
      'line-height:1.16;letter-spacing:0.02em;margin:52px 0 22px;color:#F0EEEA"')
H3 = ('style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:19px;letter-spacing:0.1em;'
      'margin:40px 0 16px;color:#F9DCA7"')
LI = 'style="font-family:Archivo,sans-serif;font-size:17px;line-height:1.7;color:#D5D3CD;margin:0 0 12px"'
CIT = ('style="font-family:\'Space Grotesk\',sans-serif;font-weight:500;font-size:clamp(20px,2.4vw,27px);'
       'line-height:1.32;color:#F0EEEA;margin:44px 0;padding:0 0 0 28px;border-left:2px solid #B8A06A"')


def corpo_para_html(corpo):
    saida = []
    lista_aberta = False

    def fechar_lista():
        nonlocal lista_aberta
        if lista_aberta:
            saida.append("</ul>")
            lista_aberta = False

    for bloco in re.split(r"\n\s*\n", corpo):
        bloco = bloco.strip()
        if not bloco:
            continue

        if bloco.startswith("### "):
            fechar_lista()
            saida.append("<h3 %s>%s</h3>" % (H3, em_linha(bloco[4:].strip())))
        elif bloco.startswith("## "):
            fechar_lista()
            saida.append("<h2 %s>%s</h2>" % (H2, em_linha(bloco[3:].strip())))
        elif bloco.startswith("> "):
            fechar_lista()
            texto = " ".join(l.lstrip("> ").strip() for l in bloco.splitlines())
            saida.append("<blockquote %s>%s</blockquote>" % (CIT, em_linha(texto)))
        elif bloco.startswith("- "):
            if not lista_aberta:
                saida.append('<ul style="margin:0 0 26px;padding-left:22px">')
                lista_aberta = True
            for linha in bloco.splitlines():
                if linha.strip().startswith("- "):
                    saida.append("<li %s>%s</li>" % (LI, em_linha(linha.strip()[2:])))
        else:
            fechar_lista()
            saida.append("<p %s>%s</p>" % (P, em_linha(" ".join(bloco.splitlines()))))

    fechar_lista()
    return "\n      ".join(saida)


# ----------------------------------------------------------------- pagina --

def montar_pagina(meta, corpo_html, molde_cabeca, molde_rodape):
    titulo = html.escape(meta["titulo"])
    resumo = html.escape(meta["resumo"])
    url = "%s/blog/%s" % (BASE, meta["slug"])

    cabeca = molde_cabeca
    cabeca = re.sub(r"<title>.*?</title>", "<title>%s | HubStation</title>" % titulo, cabeca)
    cabeca = re.sub(r'<meta name="description" content="[^"]*">',
                    '<meta name="description" content="%s">' % resumo, cabeca)
    cabeca = re.sub(r'<meta property="og:title" content="[^"]*">',
                    '<meta property="og:title" content="%s">' % titulo, cabeca)
    cabeca = re.sub(r'<meta property="og:description" content="[^"]*">',
                    '<meta property="og:description" content="%s">' % resumo, cabeca)
    cabeca = re.sub(r'<meta property="og:type" content="[^"]*">',
                    '<meta property="og:type" content="article">', cabeca)
    cabeca = re.sub(r'<link rel="canonical" href="[^"]*">',
                    '<link rel="canonical" href="%s">' % url, cabeca)
    cabeca = re.sub(r'<meta property="og:url" content="[^"]*">',
                    '<meta property="og:url" content="%s">' % url, cabeca)
    if meta["capa"]:
        cabeca = re.sub(r'<meta property="og:image" content="[^"]*">',
                        '<meta property="og:image" content="%s">' % url_absoluta(meta["capa"]), cabeca)
    # a pagina do artigo mora em /blog/, entao os links da navegacao sobem um nivel
    cabeca = re.sub(r'href="(?!/|https?:|mailto:|#)([\w.-]+\.html)"', r'href="../\1"', cabeca)

    dados = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": meta["titulo"],
        "description": meta["resumo"],
        "datePublished": meta["data"],
        "author": {"@type": "Organization", "name": meta["autor"]},
        "publisher": {"@type": "Organization", "name": "HubStation"},
        "mainEntityOfPage": url,
    }
    if meta["capa"]:
        dados["image"] = url_absoluta(meta["capa"])
    cabeca = cabeca.replace(
        "</head>",
        '<script type="application/ld+json">%s</script>\n</head>'
        % json.dumps(dados, ensure_ascii=False),
    )

    capa_html = ""
    if meta["capa"]:
        capa_html = ('\n      <div style="margin:0 0 56px;aspect-ratio:16/9;overflow:hidden;background:#0B0B0B">'
                     '<img src="%s" alt="" style="width:100%%;height:100%%;object-fit:cover;display:block">'
                     "</div>" % html.escape(meta["capa"]))

    miolo = """<main id="conteudo">
  <article>
  <section style="border-bottom:1px solid rgba(240,238,234,0.12);position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background-image:linear-gradient(90deg,rgba(240,238,234,0.05) 1px,transparent 1px);background-size:160px 100%"></div>
    <div style="position:relative;max-width:820px;margin:0 auto;padding:100px 40px 70px">
      <div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.26em;color:#6B6B6B;margin-bottom:26px">
        <a href="../blog.html" style="color:#6B6B6B">HUBSTATION / BLOG</a>
      </div>
      {olho}
      <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(32px,4.6vw,60px);line-height:1.08;letter-spacing:0.02em;margin:0 0 26px">{titulo}</h1>
      {resumo}
      <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;padding-top:26px;border-top:1px solid rgba(240,238,234,0.14);font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:10.5px;letter-spacing:0.2em;color:#585858">
        <span>{autor}</span>{data}
      </div>
    </div>
  </section>

  <section>
    <div style="max-width:820px;margin:0 auto;padding:66px 40px 96px">{capa}
      {corpo}
    </div>
  </section>

  <section style="border-top:1px solid rgba(240,238,234,0.14);background:#0E0E0E">
    <div style="max-width:820px;margin:0 auto;padding:80px 40px;text-align:center">
      <div data-eyebrow="1" style="display:inline-flex;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;letter-spacing:0.3em;color:#B8A06A;margin-bottom:24px">CONVERSA</div>
      <h2 style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(26px,3.2vw,42px);line-height:1.1;letter-spacing:0.02em;margin:0 0 22px">SUA MARCA JA TEM MERCADO. FALTA OCUPAR UMA POSICAO.</h2>
      <p style="font-size:17px;line-height:1.6;color:#9D9D9D;max-width:520px;margin:0 auto 38px">Comece pelo diagnostico: quarenta minutos de leitura, sem apresentacao de vendas.</p>
      <a href="../contato.html" class="hs-btn hs-h6" style="display:inline-flex;align-items:center;gap:16px;background:#F44336;color:#FFFFFF;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.2em;padding:20px 34px">SOLICITAR DIAGNOSTICO
        <svg width="26" height="9" viewBox="0 0 26 9" fill="none"><path d="M0 4.5H24M20 1L24.5 4.5L20 8" stroke="#FFFFFF" stroke-width="1.4"></path></svg>
      </a>
      <div style="margin-top:44px"><a href="../blog.html" style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.2em;color:#9D9D9D">VER TODAS AS MATERIAS</a></div>
    </div>
  </section>
  </article>
</main>
""".format(
        olho=('<div data-eyebrow="1" style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;'
              'font-size:12px;letter-spacing:0.34em;color:#B8A06A;margin-bottom:26px">%s</div>'
              % html.escape(meta["tema"].upper())) if meta["tema"] else "",
        titulo=titulo,
        resumo=('<p style="font-family:Archivo,sans-serif;font-size:clamp(18px,2vw,23px);line-height:1.4;'
                'color:#D5D3CD;margin:0 0 34px">%s</p>' % resumo) if resumo else "",
        autor=html.escape(meta["autor"].upper()),
        data=('<span style="width:5px;height:5px;background:#B8A06A;transform:rotate(45deg)"></span>'
              "<span>%s</span>" % html.escape(meta["data"])) if meta["data"] else "",
        capa=capa_html,
        corpo=corpo_html,
    )

    rodape = re.sub(r'href="(?!/|https?:|mailto:|#)([\w.-]+\.html)"', r'href="../\1"', molde_rodape)
    return cabeca + miolo + rodape


def moldes():
    with open(os.path.join(RAIZ, "portfolio.html"), encoding="utf-8") as fh:
        s = fh.read()
    return s[: s.index('<main id="conteudo">')], s[s.index('<footer id="site-footer"') :]


def reindexar():
    entradas = []
    for caminho in sorted(glob.glob(os.path.join(PASTA_ARTIGOS, "*.html"))):
        nome = os.path.basename(caminho)
        if nome.startswith("_"):
            continue
        with open(caminho, encoding="utf-8") as fh:
            s = fh.read()
        m = re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
        if not m:
            continue
        d = json.loads(m.group(1))
        entradas.append({
            "titulo": d.get("headline", ""),
            "resumo": d.get("description", ""),
            "data": d.get("datePublished", ""),
            "tema": "",
            "capa": (d.get("image") or "").replace(BASE + "/", "/"),
            "url": "/blog/" + nome,
        })
        tema = re.search(r'letter-spacing:0\.34em;color:#B8A06A;margin-bottom:26px">([^<]+)</div>', s)
        if tema:
            entradas[-1]["tema"] = tema.group(1).strip().title()

    entradas.sort(key=lambda a: a["data"], reverse=True)
    os.makedirs(os.path.dirname(INDICE), exist_ok=True)
    with open(INDICE, "w", encoding="utf-8") as fh:
        json.dump(entradas, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print("indice: %d materia(s) em %s" % (len(entradas), os.path.relpath(INDICE, RAIZ)))


def main():
    args = [a for a in sys.argv[1:] if a != "--reindexar"]
    if "--reindexar" in sys.argv and not args:
        reindexar()
        return
    if not args:
        print(__doc__)
        sys.exit(1)

    cabeca, rodape = moldes()
    os.makedirs(PASTA_ARTIGOS, exist_ok=True)

    for padrao in args:
        for caminho in sorted(glob.glob(padrao)):
            meta, corpo = ler_md(caminho)
            pagina = montar_pagina(meta, corpo_para_html(corpo), cabeca, rodape)
            destino = os.path.join(PASTA_ARTIGOS, meta["slug"] + ".html")
            with open(destino, "w", encoding="utf-8") as fh:
                fh.write(pagina)
            print("publicado: blog/%s.html" % meta["slug"])

    reindexar()


if __name__ == "__main__":
    main()
