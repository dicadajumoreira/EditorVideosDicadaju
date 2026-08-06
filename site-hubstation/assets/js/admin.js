/* ============================================================================
   HubStation — painel interno
   A senha é trocada por um token de 12h logo no login; dali em diante todas
   as chamadas levam o token, não a senha.
   ========================================================================= */
(function () {
  'use strict';

  var CHAVE_TOKEN = 'hs_painel_token';
  var token = '';
  var contatos = [];
  var resumo = {};

  /* ------------------------------------------------------------ base ---- */

  function api(rota, corpo) {
    return fetch(rota, {
      method: 'POST',
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        token ? { Authorization: 'Bearer ' + token } : {}
      ),
      body: JSON.stringify(corpo || {})
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (dados) {
        if (r.status === 401) { sair(); throw new Error('Sessão expirada. Entre de novo.'); }
        if (!r.ok) throw new Error(dados.erro || 'Não deu certo (' + r.status + ')');
        return dados;
      });
    });
  }

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function mostrarErro(el, msg) {
    el.textContent = msg;
    el.hidden = false;
  }

  function ocupado(botao, sim, rotuloOcupado) {
    if (!botao) return;
    if (sim) {
      botao.dataset.rotulo = botao.textContent;
      botao.textContent = rotuloOcupado || 'AGUARDE...';
      botao.disabled = true;
    } else {
      if (botao.dataset.rotulo) botao.textContent = botao.dataset.rotulo;
      botao.disabled = false;
    }
  }

  /* ----------------------------------------------------------- login ---- */

  function entrar(ev) {
    ev.preventDefault();
    var campo = $('admin-senha');
    var erro = $('admin-login-erro');
    erro.hidden = true;

    fetch('/painel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'entrar', senha: campo.value })
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.status === 401) throw new Error('Senha incorreta.');
          if (!r.ok) throw new Error(d.erro || 'Não deu para entrar agora.');
          return d;
        });
      })
      .then(function (d) {
        token = d.token;
        try { sessionStorage.setItem(CHAVE_TOKEN, token); } catch (e) {}
        campo.value = '';
        abrirPainel();
      })
      .catch(function (e) { mostrarErro(erro, e.message); });
  }

  function sair() {
    token = '';
    try { sessionStorage.removeItem(CHAVE_TOKEN); } catch (e) {}
    $('admin-app').hidden = true;
    $('admin-gate').style.display = '';
  }

  function abrirPainel() {
    $('admin-gate').style.display = 'none';
    $('admin-app').hidden = false;
    carregarContatos();
  }

  /* -------------------------------------------------------- contatos ---- */

  function carregarContatos() {
    return api('/painel', { acao: 'listar' })
      .then(function (d) {
        contatos = d.contatos || [];
        resumo = d.resumo || {};
        $('admin-carregando').hidden = true;
        preencherSegmentos();
        desenharResumo();
        desenharContatos();
        atualizarContagens();
      })
      .catch(function (e) {
        $('admin-carregando').textContent = e.message;
      });
  }

  function segmentosUnicos() {
    var s = {};
    contatos.forEach(function (c) { if (c.segmento) s[c.segmento] = true; });
    return Object.keys(s).sort();
  }

  function preencherSegmentos() {
    var lista = segmentosUnicos();
    var filtro = $('filtro-segmento');
    var atual = filtro.value;
    filtro.innerHTML = '<option value="">Todos os segmentos</option>' +
      lista.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
    filtro.value = atual;

    ['email-seg', 'wa-seg'].forEach(function (id) {
      var sel = $(id);
      var marcados = Array.prototype.filter.call(sel.options, function (o) { return o.selected; })
        .map(function (o) { return o.value; });
      sel.innerHTML = lista.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
      Array.prototype.forEach.call(sel.options, function (o) {
        o.selected = marcados.indexOf(o.value) !== -1;
      });
    });
  }

  function desenharResumo() {
    var cartoes = [
      ['total', 'CONTATOS'],
      ['novos', 'AGUARDANDO RESPOSTA', true],
      ['doSite', 'PELO FORMULÁRIO'],
      ['doWhatsapp', 'PELO WHATSAPP'],
      ['comEmail', 'RECEBEM E-MAIL'],
      ['comWhatsapp', 'RECEBEM WHATSAPP'],
      ['descadastrados', 'FORA DA LISTA']
    ];
    $('admin-resumo').innerHTML = cartoes.map(function (c) {
      return '<div class="cartao' + (c[2] ? ' destaque' : '') + '">' +
        '<div class="cartao-num">' + (resumo[c[0]] || 0) + '</div>' +
        '<div class="cartao-rot">' + c[1] + '</div>' +
      '</div>';
    }).join('');
  }

  function filtrados() {
    var busca = ($('filtro-busca').value || '').trim().toLowerCase();
    var canal = $('filtro-canal').value;
    var status = $('filtro-status').value;
    var segmento = $('filtro-segmento').value;

    return contatos.filter(function (c) {
      if (canal && (c.canal || 'site') !== canal) return false;
      if (status && (c.status || 'novo') !== status) return false;
      if (segmento && c.segmento !== segmento) return false;
      if (busca) {
        var alvo = [c.nome, c.empresa, c.email, c.contato, c.segmento, c.objetivo]
          .join(' ').toLowerCase();
        if (alvo.indexOf(busca) === -1) return false;
      }
      return true;
    });
  }

  function desenharContatos() {
    var lista = filtrados();
    $('admin-vazio').hidden = lista.length > 0;
    $('admin-lista').innerHTML = lista.map(function (c) {
      var respondido = c.status === 'respondido';
      var wa = c.canal === 'whatsapp';
      return '' +
        '<div class="contato' + (c.descadastrado ? ' fora' : '') + '">' +
          '<div>' +
            '<div class="contato-data">' + esc(c.data) + '</div>' +
            '<div class="selo ' + (respondido ? 'selo-respondido' : 'selo-novo') + '">' +
              (respondido ? 'RESPONDIDO' : 'NOVO') + '</div>' +
            '<div class="selo-canal' + (wa ? ' wa' : '') + '">' + (wa ? 'WHATSAPP' : 'FORMULÁRIO') + '</div>' +
          '</div>' +
          '<div>' +
            '<div class="contato-nome">' + esc(c.nome || '(sem nome)') + '</div>' +
            (c.empresa ? '<div class="contato-sub">' + esc(c.empresa) + '</div>' : '') +
            (c.segmento ? '<div class="contato-seg">' + esc(c.segmento) + '</div>' : '') +
            (c.descadastrado ? '<div class="incompleto">Pediu para sair da lista</div>' : '') +
          '</div>' +
          '<div>' +
            '<div class="contato-obj">' + esc(c.objetivo || '—') + '</div>' +
            '<div class="contato-via">' + esc(c.contato || '') +
              (c.telefonePretty && c.telefonePretty !== c.contato ? ' · ' + esc(c.telefonePretty) : '') +
            '</div>' +
          '</div>' +
          '<div class="contato-acoes">' +
            '<button type="button" class="btn btn-fantasma btn-mini" data-alternar="' + esc(c.id) + '">' +
              (respondido ? 'REABRIR' : 'MARCAR RESPONDIDO') + '</button>' +
            '<button type="button" class="btn btn-fantasma btn-mini" data-optout="' + esc(c.id) + '" data-valor="' + (c.descadastrado ? '0' : '1') + '">' +
              (c.descadastrado ? 'DEVOLVER À LISTA' : 'TIRAR DA LISTA') + '</button>' +
            '<button type="button" class="btn btn-perigo btn-mini" data-excluir="' + esc(c.id) + '">EXCLUIR</button>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function exportarCsv() {
    var esc2 = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
    var linhas = [['Data', 'Canal', 'Nome', 'Empresa', 'Segmento', 'Objetivo', 'Contato', 'E-mail', 'Telefone', 'Status', 'Fora da lista']]
      .concat(filtrados().map(function (c) {
        return [c.data, c.canal === 'whatsapp' ? 'WhatsApp' : 'Formulário', c.nome, c.empresa,
          c.segmento, c.objetivo, c.contato, c.email, c.telefonePretty,
          c.status === 'respondido' ? 'Respondido' : 'Novo', c.descadastrado ? 'Sim' : 'Não'];
      }));
    var csv = linhas.map(function (l) { return l.map(esc2).join(';'); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'contatos-hubstation.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* --------------------------------------------------------- contagem --- */

  function selecionados(id) {
    return Array.prototype.filter.call($(id).options, function (o) { return o.selected; })
      .map(function (o) { return o.value; });
  }

  function atualizarContagens() {
    var segE = selecionados('email-seg');
    var canal = $('email-canal').value;
    var vistos = {};
    var nE = 0;
    contatos.forEach(function (c) {
      if (c.descadastrado) return;
      if (!c.email) return;
      if (segE.length && segE.indexOf(c.segmento) === -1) return;
      if (canal && (c.canal || 'site') !== canal) return;
      var e = c.email.toLowerCase();
      if (vistos[e]) return;
      vistos[e] = true;
      nE++;
    });
    $('email-contagem').textContent = nE + (nE === 1 ? ' pessoa recebe' : ' pessoas recebem');

    var segW = selecionados('wa-seg');
    var vistosW = {};
    var nW = 0;
    contatos.forEach(function (c) {
      if (c.descadastrado || c.waOptOut || !c.waOptIn) return;
      if (!c.telefone) return;
      if (segW.length && segW.indexOf(c.segmento) === -1) return;
      if (vistosW[c.telefone]) return;
      vistosW[c.telefone] = true;
      nW++;
    });
    $('wa-contagem').textContent = nW + (nW === 1 ? ' pessoa recebe' : ' pessoas recebem');
  }

  /* ----------------------------------------------- laço de paginação ---- */

  // Uma serverless function tem poucos segundos de vida. O disparo vai em
  // fatias: a função devolve hasMore e o painel chama de novo, até acabar.
  function dispararEmLaco(rota, corpoBase, elementos) {
    var progresso = elementos.progresso;
    var barra = progresso.querySelector('.barra span');
    var texto = progresso.querySelector('.progresso-texto');
    var erro = elementos.erro;

    erro.hidden = true;
    progresso.hidden = false;
    ocupado(elementos.botao, true, 'DISPARANDO...');

    var enviados = 0, falhas = 0, disparoId = null, offset = 0, total = 0;

    function rodada() {
      var corpo = Object.assign({}, corpoBase, { offset: offset });
      if (disparoId) corpo.disparoId = disparoId;

      return api(rota, corpo).then(function (d) {
        disparoId = d.disparoId;
        enviados += d.enviados;
        falhas += d.falhas;
        offset = d.proximoOffset;
        total = d.total;

        var pct = total ? Math.round((offset / total) * 100) : 100;
        barra.style.width = pct + '%';
        texto.innerHTML = 'Enviados <b>' + enviados + '</b> de ' + total +
          (falhas ? ' · <span style="color:#F44336">' + falhas + ' falharam</span>' : '');

        if (d.hasMore) return rodada();

        texto.innerHTML = 'Pronto. <b>' + enviados + '</b> ' +
          (enviados === 1 ? 'mensagem enviada' : 'mensagens enviadas') +
          (falhas ? ' · <span style="color:#F44336">' + falhas + ' falharam</span>' : '') + '.';
        if (d.erros && d.erros.length) mostrarErro(erro, 'Erros: ' + d.erros.join(' | '));
      });
    }

    return rodada()
      .catch(function (e) { mostrarErro(erro, e.message); })
      .then(function () { ocupado(elementos.botao, false); carregarHistorico(); });
  }

  /* ----------------------------------------------------- disparo email -- */

  function testarEmail() {
    var erro = $('email-erro');
    erro.hidden = true;
    var destino = $('email-teste').value.trim();
    if (!destino) return mostrarErro(erro, 'Escreva um e-mail para receber o teste.');
    var botao = $('email-testar');
    ocupado(botao, true, 'ENVIANDO...');
    api('/disparo-email', {
      assunto: $('email-assunto').value,
      html: $('email-html').value,
      teste: { email: destino }
    })
      .then(function () {
        erro.className = 'ok';
        mostrarErro(erro, 'Teste enviado para ' + destino + '. Confira a caixa de entrada.');
      })
      .catch(function (e) { erro.className = 'erro'; mostrarErro(erro, e.message); })
      .then(function () { ocupado(botao, false); });
  }

  function dispararEmail() {
    var erro = $('email-erro');
    erro.className = 'erro';
    erro.hidden = true;
    if (!$('email-assunto').value.trim()) return mostrarErro(erro, 'Falta o assunto.');
    if (!$('email-html').value.trim()) return mostrarErro(erro, 'Falta o corpo do e-mail.');

    var quantos = $('email-contagem').textContent;
    if (!window.confirm('Disparar este e-mail agora?\n\n' + quantos + '.\n\nNão dá para cancelar depois que começa.')) return;

    var canal = $('email-canal').value;
    dispararEmLaco('/disparo-email', {
      assunto: $('email-assunto').value,
      html: $('email-html').value,
      filtro: {
        segmentos: selecionados('email-seg'),
        canais: canal ? [canal] : []
      }
    }, { botao: $('email-disparar'), progresso: $('email-progresso'), erro: erro });
  }

  /* -------------------------------------------------- disparo whatsapp -- */

  var templates = [];

  function carregarWhatsapp() {
    var status = $('wa-status');
    return api('/disparos', { acao: 'wa-status' })
      .then(function (d) {
        if (!d.configurado) {
          status.innerHTML = 'O WhatsApp ainda não está ligado. Falta configurar no Netlify: <b>' +
            esc((d.faltando || []).join(', ')) + '</b>. ' +
            'Esses valores saem do Gerenciador de Apps da Meta, no app do WhatsApp Business.';
          return;
        }
        if (!d.ok) {
          status.innerHTML = 'As chaves estão configuradas, mas a Meta recusou a conexão: <b>' + esc(d.erro || '') + '</b>';
          return;
        }
        var n = d.numero || {};
        status.innerHTML = 'Conectado ao número <b>' + esc(n.display_phone_number || '') + '</b>' +
          (n.verified_name ? ' (' + esc(n.verified_name) + ')' : '') +
          (n.quality_rating ? ' · qualidade ' + esc(n.quality_rating) : '');
        return api('/disparos', { acao: 'wa-templates' }).then(function (t) {
          templates = (t.templates || []).filter(function (x) { return x.status === 'APPROVED'; });
          if (!templates.length) {
            status.innerHTML += '<br>Nenhum template aprovado ainda. Crie e aprove no Gerenciador do WhatsApp Business.';
            return;
          }
          $('wa-template').innerHTML = templates.map(function (t2, i) {
            return '<option value="' + i + '">' + esc(t2.nome) + ' · ' + esc(t2.idioma) +
              (t2.variaveis ? ' · ' + t2.variaveis + ' variável(is)' : '') + '</option>';
          }).join('');
          $('wa-formulario').hidden = false;
          desenharVariaveis();
        });
      })
      .catch(function (e) { status.textContent = e.message; });
  }

  var CAMPOS = [
    ['nome', 'Primeiro nome'], ['empresa', 'Empresa'], ['segmento', 'Segmento'],
    ['contato', 'Contato informado']
  ];

  function desenharVariaveis() {
    var t = templates[parseInt($('wa-template').value, 10)];
    var caixa = $('wa-vars');
    if (!t || !t.variaveis) { caixa.hidden = true; return; }
    caixa.hidden = false;
    var campos = [];
    for (var i = 1; i <= t.variaveis; i++) {
      campos.push(
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">' +
          '<span style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:12px;color:#F9DCA7;flex:none;width:44px">{{' + i + '}}</span>' +
          '<select class="hs-f10 wa-var" data-i="' + i + '">' +
            CAMPOS.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('') +
          '</select>' +
        '</div>'
      );
    }
    $('wa-vars-campos').innerHTML = campos.join('');
  }

  function variaveisEscolhidas() {
    return Array.prototype.map.call(document.querySelectorAll('.wa-var'), function (s) { return s.value; });
  }

  function templateAtual() {
    return templates[parseInt($('wa-template').value, 10)];
  }

  function testarWhatsapp() {
    var erro = $('wa-erro');
    erro.className = 'erro';
    erro.hidden = true;
    var t = templateAtual();
    if (!t) return mostrarErro(erro, 'Escolha um template.');
    var destino = $('wa-teste').value.trim();
    if (!destino) return mostrarErro(erro, 'Escreva um número para receber o teste.');
    var botao = $('wa-testar');
    ocupado(botao, true, 'ENVIANDO...');
    api('/disparo-whatsapp', {
      template: t.nome, idioma: t.idioma, variaveis: variaveisEscolhidas(),
      teste: { telefone: destino }
    })
      .then(function () { erro.className = 'ok'; mostrarErro(erro, 'Teste enviado para ' + destino + '.'); })
      .catch(function (e) { erro.className = 'erro'; mostrarErro(erro, e.message); })
      .then(function () { ocupado(botao, false); });
  }

  function dispararWhatsapp() {
    var erro = $('wa-erro');
    erro.className = 'erro';
    erro.hidden = true;
    var t = templateAtual();
    if (!t) return mostrarErro(erro, 'Escolha um template.');

    var quantos = $('wa-contagem').textContent;
    if (!window.confirm('Disparar o template "' + t.nome + '" agora?\n\n' + quantos + '.\n\nNão dá para cancelar depois que começa.')) return;

    dispararEmLaco('/disparo-whatsapp', {
      template: t.nome, idioma: t.idioma, variaveis: variaveisEscolhidas(),
      filtro: { segmentos: selecionados('wa-seg') }
    }, { botao: $('wa-disparar'), progresso: $('wa-progresso'), erro: erro });
  }

  /* -------------------------------------------------------- histórico --- */

  function carregarHistorico() {
    return api('/disparos', { acao: 'historico' })
      .then(function (d) {
        var lista = d.disparos || [];
        $('hist-vazio').hidden = lista.length > 0;
        $('hist-lista').innerHTML = lista.map(function (x) {
          var wa = x.tipo === 'whatsapp';
          var quando = '';
          try {
            quando = new Date(x.criadoEm).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: '2-digit',
              hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
            });
          } catch (e) { quando = x.criadoEm; }
          return '' +
            '<div class="disparo">' +
              '<div>' +
                '<div class="contato-data">' + esc(quando) + '</div>' +
                '<div class="disparo-tipo' + (wa ? ' wa' : '') + '">' + (wa ? 'WHATSAPP' : 'E-MAIL') + '</div>' +
              '</div>' +
              '<div>' +
                '<div class="disparo-assunto">' + esc(x.assunto || '(sem assunto)') + '</div>' +
                '<div class="disparo-numeros"><b>' + (x.enviados || 0) + '</b> enviados de ' + (x.total || 0) +
                  (x.falhas ? ' · <span class="falha">' + x.falhas + ' falharam</span>' : '') + '</div>' +
                (x.concluido ? '' : '<div class="incompleto">Disparo interrompido antes do fim</div>') +
              '</div>' +
              '<div class="contato-acoes">' +
                '<button type="button" class="btn btn-perigo btn-mini" data-apagar-disparo="' + esc(x.id) + '">APAGAR REGISTRO</button>' +
              '</div>' +
            '</div>';
        }).join('');
      })
      .catch(function () { /* histórico é secundário: não atrapalha o resto */ });
  }

  /* ------------------------------------------------------------ abas ---- */

  function trocarAba(nome) {
    document.querySelectorAll('.aba').forEach(function (b) {
      b.classList.toggle('ativa', b.dataset.aba === nome);
    });
    document.querySelectorAll('.painel').forEach(function (p) {
      p.hidden = p.dataset.painel !== nome;
    });
    if (nome === 'whatsapp' && !templates.length) carregarWhatsapp();
    if (nome === 'historico') carregarHistorico();
  }

  /* ------------------------------------------------------------ boot ---- */

  function iniciar() {
    $('admin-login').addEventListener('submit', entrar);
    $('admin-sair').addEventListener('click', sair);
    $('admin-atualizar').addEventListener('click', carregarContatos);
    $('admin-csv').addEventListener('click', exportarCsv);
    $('hist-atualizar').addEventListener('click', carregarHistorico);

    ['filtro-busca', 'filtro-canal', 'filtro-status', 'filtro-segmento'].forEach(function (id) {
      $(id).addEventListener('input', desenharContatos);
      $(id).addEventListener('change', desenharContatos);
    });
    ['email-seg', 'email-canal', 'wa-seg'].forEach(function (id) {
      $(id).addEventListener('change', atualizarContagens);
    });

    $('admin-abas').addEventListener('click', function (ev) {
      var b = ev.target.closest('.aba');
      if (b) trocarAba(b.dataset.aba);
    });

    $('admin-lista').addEventListener('click', function (ev) {
      var alternar = ev.target.closest('[data-alternar]');
      var optout = ev.target.closest('[data-optout]');
      var excluir = ev.target.closest('[data-excluir]');
      if (alternar) {
        api('/painel', { acao: 'alternar', id: alternar.dataset.alternar }).then(carregarContatos);
      } else if (optout) {
        api('/painel', { acao: 'optout', id: optout.dataset.optout, valor: optout.dataset.valor === '1' })
          .then(carregarContatos);
      } else if (excluir) {
        if (!window.confirm('Excluir este contato em definitivo?')) return;
        api('/painel', { acao: 'excluir', id: excluir.dataset.excluir }).then(carregarContatos);
      }
    });

    $('hist-lista').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-apagar-disparo]');
      if (!b) return;
      if (!window.confirm('Apagar o registro deste disparo? As mensagens já enviadas não voltam.')) return;
      api('/disparos', { acao: 'apagar', id: b.dataset.apagarDisparo }).then(carregarHistorico);
    });

    $('email-testar').addEventListener('click', testarEmail);
    $('email-disparar').addEventListener('click', dispararEmail);
    $('wa-template').addEventListener('change', desenharVariaveis);
    $('wa-testar').addEventListener('click', testarWhatsapp);
    $('wa-disparar').addEventListener('click', dispararWhatsapp);

    // Sessão ainda válida? Entra direto.
    try {
      var salvo = sessionStorage.getItem(CHAVE_TOKEN);
      if (salvo) {
        token = salvo;
        api('/painel', { acao: 'listar' })
          .then(abrirPainel)
          .catch(function () { sair(); });
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
