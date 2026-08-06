/* ============================================================================
   HubStation — listagem do blog
   As matérias vivem em /assets/blog/artigos.json. Cada uma tem sua própria
   página em /blog/<slug>.html. Para publicar, basta a página existir e a
   entrada estar no índice.
   ========================================================================= */
(function () {
  'use strict';

  var lista = document.getElementById('blog-lista');
  if (!lista) return;

  var carregando = document.getElementById('blog-carregando');
  var vazio = document.getElementById('blog-vazio');
  var barraTemas = document.getElementById('blog-temas');
  var artigos = [];
  var temaAtivo = '';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function dataBonita(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    var meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return m[3] + ' ' + meses[parseInt(m[2], 10) - 1] + ' ' + m[1];
  }

  function temas() {
    var s = {};
    artigos.forEach(function (a) { if (a.tema) s[a.tema] = true; });
    return Object.keys(s).sort();
  }

  function desenharTemas() {
    var todos = temas();
    if (!todos.length) return;
    var botao = function (valor, rotulo) {
      var ativo = temaAtivo === valor;
      return '<button type="button" data-tema="' + esc(valor) + '" ' +
        'style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.18em;' +
        'padding:11px 18px;border:1px solid ' + (ativo ? '#F9DCA7' : 'rgba(240,238,234,0.2)') + ';' +
        'color:' + (ativo ? '#F9DCA7' : '#9D9D9D') + '">' + esc(rotulo) + '</button>';
    };
    barraTemas.innerHTML = botao('', 'TUDO') + todos.map(function (t) {
      return botao(t, t.toUpperCase());
    }).join('');
  }

  function desenhar() {
    var visiveis = temaAtivo ? artigos.filter(function (a) { return a.tema === temaAtivo; }) : artigos;
    vazio.hidden = visiveis.length > 0;

    lista.innerHTML = visiveis.map(function (a) {
      var capa = a.capa
        ? '<div style="aspect-ratio:16/9;overflow:hidden;background:#0B0B0B">' +
            '<img src="' + esc(a.capa) + '" alt="" loading="lazy" decoding="async" ' +
            'style="width:100%;height:100%;object-fit:cover;display:block">' +
          '</div>'
        : '';
      return '' +
        '<a href="' + esc(a.url) + '" data-card="1" class="hs-btn" ' +
          'style="display:flex;flex-direction:column;background:#0E0E0E;border:1px solid rgba(240,238,234,0.12);text-decoration:none">' +
          capa +
          '<div style="padding:32px 30px 34px;display:flex;flex-direction:column;flex:1">' +
            '<div data-line="1" style="height:2px;background:linear-gradient(90deg,#B8A06A,#F9DCA7);margin:-32px -30px 26px"></div>' +
            (a.tema ? '<div style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:10px;letter-spacing:0.24em;color:#B8A06A;margin-bottom:16px">' + esc(a.tema.toUpperCase()) + '</div>' : '') +
            '<h2 style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:20px;line-height:1.24;letter-spacing:0.02em;margin:0 0 14px;color:#F0EEEA">' + esc(a.titulo) + '</h2>' +
            '<p style="font-size:15px;line-height:1.65;color:#9D9D9D;margin:0 0 24px;flex:1">' + esc(a.resumo || '') + '</p>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:20px;border-top:1px solid rgba(240,238,234,0.12)">' +
              '<span style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:10px;letter-spacing:0.2em;color:#585858">' + esc(dataBonita(a.data)) + '</span>' +
              '<svg data-arrow="1" width="26" height="9" viewBox="0 0 26 9" fill="none" aria-hidden="true"><path d="M0 4.5H24M20 1L24.5 4.5L20 8" stroke="#F9DCA7" stroke-width="1.4"></path></svg>' +
            '</div>' +
          '</div>' +
        '</a>';
    }).join('');
  }

  barraTemas.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-tema]');
    if (!b) return;
    temaAtivo = b.getAttribute('data-tema');
    desenharTemas();
    desenhar();
  });

  fetch('/assets/blog/artigos.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (dados) {
      artigos = (Array.isArray(dados) ? dados : [])
        .filter(function (a) { return a && a.titulo && a.url; })
        .sort(function (a, b) { return String(b.data || '').localeCompare(String(a.data || '')); });
      carregando.hidden = true;
      desenharTemas();
      desenhar();
    })
    .catch(function () {
      carregando.textContent = 'Não deu para carregar as matérias agora.';
    });
})();
