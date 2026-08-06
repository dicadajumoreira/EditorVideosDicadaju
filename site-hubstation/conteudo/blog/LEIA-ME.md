# Materias do blog

Cada materia e um arquivo `.md` nesta pasta. `_modelo.md` mostra o formato
(arquivos que comecam com `_` sao ignorados na publicacao).

Para publicar, da raiz de `site-hubstation/`:

    python3 tools/publicar_artigo.py conteudo/blog/*.md

Isso gera uma pagina em `blog/<slug>.html` para cada materia e reescreve o
indice `assets/blog/artigos.json`, que e o que a pagina `blog.html` le.

As imagens de capa vao em `assets/blog/img/` e sao referenciadas no cabecalho
da materia como `capa: /assets/blog/img/nome-do-arquivo.jpg` (1600x900).
