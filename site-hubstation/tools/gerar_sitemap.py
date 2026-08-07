#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reescreve o sitemap.xml com as paginas fixas + as materias do blog.

Rodar depois de publicar materias:
    python3 tools/gerar_sitemap.py
"""
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://hubstation.com.br"

FIXAS = [("", "1.0"), ("servicos", "0.9"), ("metodo", "0.8"), ("mercado", "0.8"),
         ("portfolio", "0.8"), ("blog", "0.8"), ("eventos", "0.8"), ("agencia", "0.7"), ("contato", "0.9")]

linhas = ['  <url><loc>%s/%s</loc><priority>%s</priority></url>' % (BASE, c, p) for c, p in FIXAS]

indice = os.path.join(RAIZ, "assets", "blog", "artigos.json")
if os.path.exists(indice):
    with open(indice, encoding="utf-8") as fh:
        for a in json.load(fh):
            linhas.append(
                '  <url><loc>%s%s</loc><lastmod>%s</lastmod><priority>0.7</priority></url>'
                % (BASE, a["url"], a.get("data", ""))
            )

with open(os.path.join(RAIZ, "sitemap.xml"), "w", encoding="utf-8") as fh:
    fh.write('<?xml version="1.0" encoding="UTF-8"?>\n'
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
             + "\n".join(linhas) + "\n</urlset>\n")

print("sitemap: %d endereco(s)" % len(linhas))
