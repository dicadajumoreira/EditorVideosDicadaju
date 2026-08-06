/* ============================================================================
   HubStation — comportamento do site
   Sem dependencias externas. Tudo degrada com elegancia se o JS falhar.
   ========================================================================= */
(function () {
  'use strict';

  var reduzirMovimento = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------ menu mobile --- */

  function menuMobile() {
    var btn = document.getElementById('hs-menu-btn');
    var nav = document.getElementById('hs-nav');
    if (!btn || !nav) return;

    function fechar() {
      nav.classList.remove('aberto');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menu');
    }

    btn.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    nav.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) fechar();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fechar();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 940) fechar();
    });
  }

  /* ------------------------------- barra de progresso e revelacoes ------ */

  function progressoELeitura() {
    var barra = document.getElementById('hs-progress');
    var secoes = Array.prototype.slice.call(
      document.querySelectorAll('main section')
    );

    function mostrar(el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    }

    var escondidas = [];

    if (!reduzirMovimento && 'IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            mostrar(en.target);
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      secoes.forEach(function (el) {
        var r = el.getBoundingClientRect();
        el.style.transition =
          'opacity 0.85s ease, transform 0.85s cubic-bezier(0.22,0.61,0.36,1)';
        // se ja esta na tela no carregamento, nunca esconder
        if (r.top < (window.innerHeight || 800) && r.bottom > 0) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        escondidas.push(el);
        obs.observe(el);
      });
    }

    // Rede de seguranca: numa rolagem rapida, ou quando a pagina abre no meio
    // por causa de uma ancora, o observador pode nao acompanhar. Aqui qualquer
    // secao que ja chegou na altura da janela (inclusive as que ficaram para
    // tras) e revelada na marra.
    function resgatar() {
      if (!escondidas.length) return;
      var limite = (window.innerHeight || 800) + 100;
      escondidas = escondidas.filter(function (el) {
        if (el.getBoundingClientRect().top < limite) {
          mostrar(el);
          if (obs) obs.unobserve(el);
          return false;
        }
        return true;
      });
    }

    var pendente = false;
    function aoRolar() {
      pendente = false;
      if (barra) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        barra.style.width =
          (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
      }
      resgatar();
    }
    window.addEventListener('scroll', function () {
      if (pendente) return;
      pendente = true;
      window.requestAnimationFrame(aoRolar);
    }, { passive: true });
    window.addEventListener('resize', resgatar, { passive: true });
    aoRolar();

    // Ultimo recurso: uma batida lenta que se desliga sozinha quando nao ha
    // mais nada escondido. Garante que nenhum trecho do site fique invisivel
    // por causa de uma rolagem muito rapida ou de um salto de ancora.
    if (escondidas.length) {
      var tique = setInterval(function () {
        resgatar();
        if (!escondidas.length) clearInterval(tique);
      }, 250);
    }
  }

  /* ------------------------------------------- rotador de palavras ------ */

  function rotador() {
    var alvo = document.getElementById('hs-rotador');
    var contador = document.getElementById('hs-rotador-contador');
    if (!alvo) return;

    var palavras = ['POSICIONAMENTO', 'AUTORIDADE', 'PRESENÇA', 'CRESCIMENTO'];
    var i = 0;

    if (reduzirMovimento) return;

    setInterval(function () {
      i = (i + 1) % palavras.length;
      var novo = alvo.cloneNode(false);
      novo.textContent = palavras[i];
      alvo.parentNode.replaceChild(novo, alvo);
      alvo = novo;
      if (contador) {
        contador.textContent = '0' + (i + 1) + ' / 04';
      }
    }, 2800);
  }

  /* --------------------------------- imagens do portfolio que faltam ---- */

  function imagensPendentes() {
    document.querySelectorAll('img[data-slot]').forEach(function (img) {
      function trocar() {
        var caixa = document.createElement('div');
        caixa.className = 'hs-slot';
        caixa.textContent = img.getAttribute('data-slot');
        if (img.parentNode) img.parentNode.replaceChild(caixa, img);
      }
      if (img.complete && img.naturalWidth === 0) trocar();
      else img.addEventListener('error', trocar);
    });
  }

  /* ------------------------------- cadastro antes do WhatsApp ----------- */

  // Ninguem vai para a conversa sem deixar o contato antes. O cadastro cai
  // na MESMA base do formulario da pagina Contato, marcado como canal
  // "whatsapp" — no painel da para separar quem veio de onde.
  //
  // Se o JavaScript nao carregar, o link continua levando ao WhatsApp
  // direto: e melhor um botao que funciona sem trava do que um botao morto.

  var SEGMENTOS = [
    'Síndico profissional', 'Administradora', 'Prestador de serviço',
    'Tecnologia para o setor', 'Manutenção e obras', 'Auditoria e consultoria',
    'Fornecedor estratégico', 'Outro'
  ];

  function campoWa(id, rotulo, marcador, tipo) {
    return '' +
      '<div>' +
        '<label for="' + id + '" style="display:block;font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.24em;color:#F9DCA7;margin-bottom:9px">' + rotulo + '</label>' +
        '<input class="hs-f10" id="' + id + '" name="' + id.replace('wa-', '') + '" type="' + (tipo || 'text') + '" placeholder="' + marcador + '" ' +
          'style="width:100%;box-sizing:border-box;background:#0E0E0E;border:1px solid rgba(240,238,234,0.2);color:#F0EEEA;font-size:16px;padding:14px 16px;outline:none">' +
      '</div>';
  }

  function montarModal() {
    var m = document.createElement('div');
    m.id = 'hs-wa-modal';
    m.hidden = true;
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.setAttribute('aria-labelledby', 'hs-wa-titulo');
    m.innerHTML = '' +
      '<div id="hs-wa-fundo"></div>' +
      '<div id="hs-wa-caixa">' +
        '<button type="button" id="hs-wa-fechar" aria-label="Fechar">&times;</button>' +
        '<div data-eyebrow="1" style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.3em;color:#B8A06A;margin-bottom:18px">ANTES DA CONVERSA</div>' +
        '<h2 id="hs-wa-titulo" style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:clamp(22px,3vw,30px);line-height:1.1;letter-spacing:0.02em;margin:0 0 12px">DEIXE SEU CONTATO</h2>' +
        '<p style="font-size:15px;line-height:1.6;color:#9D9D9D;margin:0 0 26px">Assim já chegamos na conversa sabendo quem é você e o que precisa resolver.</p>' +
        '<form id="hs-wa-form" style="display:flex;flex-direction:column;gap:18px">' +
          campoWa('wa-nome', 'NOME', 'Como podemos te chamar') +
          campoWa('wa-empresa', 'EMPRESA', 'Nome da marca') +
          '<div>' +
            '<label for="wa-segmento" style="display:block;font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.24em;color:#F9DCA7;margin-bottom:9px">SEGMENTO</label>' +
            '<select class="hs-f10" id="wa-segmento" name="segmento" style="width:100%;box-sizing:border-box;background:#0E0E0E;border:1px solid rgba(240,238,234,0.2);color:#F0EEEA;font-size:16px;padding:14px 16px;outline:none">' +
              SEGMENTOS.map(function (s) { return '<option>' + s + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label for="wa-objetivo" style="display:block;font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.24em;color:#F9DCA7;margin-bottom:9px">O QUE VOCÊ PRECISA RESOLVER</label>' +
            '<textarea class="hs-f10" id="wa-objetivo" name="objetivo" rows="3" placeholder="Em uma ou duas linhas" style="width:100%;box-sizing:border-box;background:#0E0E0E;border:1px solid rgba(240,238,234,0.2);color:#F0EEEA;font-size:16px;padding:14px 16px;outline:none;resize:vertical"></textarea>' +
          '</div>' +
          campoWa('wa-contato', 'SEU WHATSAPP OU E-MAIL', 'Onde respondemos') +
          '<p style="position:absolute;left:-9999px" aria-hidden="true"><label>Não preencha<input type="text" name="bot-field" tabindex="-1" autocomplete="off"></label></p>' +
          '<div id="hs-wa-erro" hidden style="font-size:14px;line-height:1.5;color:#F44336">Não deu para enviar agora. Tente de novo em instantes.</div>' +
          '<button type="submit" id="hs-wa-enviar" class="hs-h5" style="display:flex;align-items:center;justify-content:center;gap:14px;background:#25D366;color:#08210F;font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.2em;padding:18px 30px;width:100%">ABRIR O WHATSAPP</button>' +
          '<p style="font-size:12.5px;line-height:1.6;color:#585858;margin:0">Seus dados ficam só com a HubStation. Não compartilhamos nem usamos para disparo em massa sem o seu aceite.</p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(m);
    return m;
  }

  function travaWhatsapp() {
    var modal = null, form = null, erro = null, botao = null, rotulo = '';
    var destino = '';
    var focoAnterior = null;

    function abrir(href) {
      destino = href;
      if (!modal) {
        modal = montarModal();
        form = modal.querySelector('#hs-wa-form');
        erro = modal.querySelector('#hs-wa-erro');
        botao = modal.querySelector('#hs-wa-enviar');
        rotulo = botao.textContent;
        modal.querySelector('#hs-wa-fechar').addEventListener('click', fechar);
        modal.querySelector('#hs-wa-fundo').addEventListener('click', fechar);
        form.addEventListener('submit', enviar);
      }
      focoAnterior = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      var primeiro = modal.querySelector('#wa-nome');
      if (primeiro) primeiro.focus();
    }

    function fechar() {
      if (!modal) return;
      modal.hidden = true;
      document.body.style.overflow = '';
      if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
    }

    function irParaWhatsapp(url) {
      var alvo = url || destino;
      // window.open pode ser barrado por bloqueador de pop-up quando sai de
      // uma resposta de rede; se barrar, navega na propria aba.
      var aba = window.open(alvo, '_blank', 'noopener');
      if (!aba) window.location.href = alvo;
    }

    function enviar(ev) {
      ev.preventDefault();
      var nome = form.querySelector('#wa-nome');
      var contato = form.querySelector('#wa-contato');
      if (!nome.value.trim() || !contato.value.trim()) {
        erro.textContent = 'Precisamos pelo menos do seu nome e de onde responder.';
        erro.hidden = false;
        (nome.value.trim() ? contato : nome).focus();
        return;
      }
      erro.hidden = true;
      botao.disabled = true;
      botao.style.opacity = '0.6';
      botao.textContent = 'UM SEGUNDO...';

      var dados = new FormData(form);
      fetch('/form-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canal: 'whatsapp',
          nome: dados.get('nome') || '',
          empresa: dados.get('empresa') || '',
          segmento: dados.get('segmento') || '',
          objetivo: dados.get('objetivo') || '',
          contato: dados.get('contato') || '',
          'bot-field': dados.get('bot-field') || ''
        })
      })
        .then(function (r) {
          if (!r.ok) throw new Error('falhou');
          return r.json().catch(function () { return {}; });
        })
        .then(function (r) {
          fechar();
          form.reset();
          irParaWhatsapp(r && r.whatsappUrl);
        })
        .catch(function () {
          // O cadastro falhou, mas segurar o cliente longe do WhatsApp por
          // causa disso seria pior: abrimos a conversa mesmo assim.
          erro.textContent = 'Não conseguimos salvar seu cadastro, mas vamos te levar para a conversa.';
          erro.hidden = false;
          setTimeout(function () { fechar(); irParaWhatsapp(); }, 1600);
        })
        .then(function () {
          botao.disabled = false;
          botao.style.opacity = '';
          botao.textContent = rotulo;
        });
    }

    document.addEventListener('click', function (ev) {
      var link = ev.target.closest('a[href*="wa.me"]');
      if (!link) return;
      ev.preventDefault();
      abrir(link.getAttribute('href'));
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modal && !modal.hidden) fechar();
    });
  }

  /* ------------------------------------------ formulario de contato ----- */

  function formularioContato() {
    var form = document.getElementById('form-contato');
    if (!form) return;

    var sucesso = document.getElementById('form-sucesso');
    var erro = document.getElementById('form-erro');
    var botao = document.getElementById('c-enviar');
    var rotulo = botao ? botao.innerHTML : '';

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;

      if (sucesso) sucesso.hidden = true;
      if (erro) erro.hidden = true;
      if (botao) {
        botao.disabled = true;
        botao.style.opacity = '0.6';
        botao.textContent = 'ENVIANDO...';
      }

      var dados = new FormData(form);

      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canal: 'site',
          nome: dados.get('nome') || '',
          empresa: dados.get('empresa') || '',
          segmento: dados.get('segmento') || '',
          objetivo: dados.get('objetivo') || '',
          contato: dados.get('contato') || '',
          'bot-field': dados.get('bot-field') || ''
        })
      })
        .then(function (r) {
          if (!r.ok) throw new Error('falha no envio');
          return r.json().catch(function () { return {}; });
        })
        .then(function () {
          form.reset();
          if (sucesso) {
            sucesso.hidden = false;
            setTimeout(function () { sucesso.hidden = true; }, 8000);
          }
        })
        .catch(function () {
          if (erro) erro.hidden = false;
        })
        .then(function () {
          if (botao) {
            botao.disabled = false;
            botao.style.opacity = '';
            botao.innerHTML = rotulo;
          }
        });
    });
  }

  /* ------------------------------------------- painel administrativo ---- */

  function painelContatos() {
    var gate = document.getElementById('admin-gate');
    if (!gate) return;

    var login = document.getElementById('admin-login');
    var campoSenha = document.getElementById('admin-senha');
    var loginErro = document.getElementById('admin-login-erro');
    var conteudo = document.getElementById('admin-conteudo');
    var lista = document.getElementById('admin-lista');
    var vazio = document.getElementById('admin-vazio');
    var carregando = document.getElementById('admin-carregando');
    var total = document.getElementById('admin-total');
    var btnCsv = document.getElementById('admin-csv');

    var senha = '';
    var registros = [];

    function api(acao, corpo) {
      return fetch('/painel-contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ senha: senha, acao: acao }, corpo || {}))
      }).then(function (r) {
        if (r.status === 401) throw new Error('senha');
        if (!r.ok) throw new Error('falha');
        return r.json();
      });
    }

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }

    function desenhar() {
      carregando.hidden = true;
      total.textContent = registros.length + ' registro(s)';
      vazio.hidden = registros.length > 0;
      lista.innerHTML = registros.map(function (c) {
        var respondido = c.status === 'respondido';
        return '' +
          '<div class="hs-linha-contato" style="display:grid;grid-template-columns:110px minmax(0,1fr) minmax(0,1.4fr) auto;gap:26px;padding:24px 0;border-top:1px solid rgba(240,238,234,0.14);align-items:start">' +
            '<div>' +
              '<div style="font-size:13px;color:#6B6B6B">' + esc(c.data) + '</div>' +
              '<div style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:10px;letter-spacing:0.16em;margin-top:8px;color:' + (respondido ? '#6B6B6B' : '#F44336') + '">' + (respondido ? 'RESPONDIDO' : 'NOVO') + '</div>' +
            '</div>' +
            '<div>' +
              '<div style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:16px;color:#F0EEEA">' + esc(c.nome || '(sem nome)') + '</div>' +
              '<div style="font-size:14px;color:#9D9D9D;margin-top:4px">' + esc(c.empresa) + '</div>' +
              '<div style="font-size:13px;color:#B8A06A;margin-top:4px">' + esc(c.segmento) + '</div>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:14.5px;line-height:1.6;color:#D5D3CD">' + esc(c.objetivo) + '</div>' +
              '<div style="font-size:14px;color:#B8A06A;margin-top:8px">' + esc(c.contato) + '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;align-items:stretch">' +
              '<button type="button" class="hs-h3" data-marcar="' + esc(c.id) + '" style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:10px;letter-spacing:0.14em;color:#F0EEEA;padding:10px 16px;border:1px solid rgba(240,238,234,0.3)">' + (respondido ? 'REABRIR' : 'MARCAR RESPONDIDO') + '</button>' +
              '<button type="button" class="hs-h11" data-excluir="' + esc(c.id) + '" style="font-family:\'Space Grotesk\',sans-serif;font-weight:700;font-size:10px;letter-spacing:0.14em;color:#9D9D9D;padding:10px 16px;border:1px solid rgba(240,238,234,0.16)">EXCLUIR</button>' +
            '</div>' +
          '</div>';
      }).join('');
    }

    function carregar() {
      return api('listar').then(function (r) {
        registros = r.contatos || [];
        desenhar();
      });
    }

    login.addEventListener('submit', function (ev) {
      ev.preventDefault();
      senha = campoSenha.value;
      loginErro.hidden = true;
      carregar()
        .then(function () {
          gate.hidden = true;
          gate.style.display = 'none';
          conteudo.hidden = false;
        })
        .catch(function (e) {
          senha = '';
          loginErro.textContent = e.message === 'senha'
            ? 'Senha incorreta.'
            : 'Não foi possível carregar os contatos agora.';
          loginErro.hidden = false;
        });
    });

    lista.addEventListener('click', function (ev) {
      var marcar = ev.target.closest('[data-marcar]');
      var excluir = ev.target.closest('[data-excluir]');
      if (marcar) {
        api('alternar', { id: marcar.getAttribute('data-marcar') }).then(carregar);
      } else if (excluir) {
        if (!window.confirm('Excluir este contato em definitivo?')) return;
        api('excluir', { id: excluir.getAttribute('data-excluir') }).then(carregar);
      }
    });

    btnCsv.addEventListener('click', function () {
      var esc2 = function (s) { return '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"'; };
      var linhas = [['Data', 'Nome', 'Empresa', 'Segmento', 'Objetivo', 'Contato', 'Status']]
        .concat(registros.map(function (c) {
          return [c.data, c.nome, c.empresa, c.segmento, c.objetivo, c.contato, c.status];
        }));
      var csv = linhas.map(function (l) { return l.map(esc2).join(';'); }).join('\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'contatos-hubstation.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  /* ------------------------------------------------------------ boot ---- */

  function iniciar() {
    menuMobile();
    progressoELeitura();
    rotador();
    imagensPendentes();
    travaWhatsapp();
    formularioContato();
    painelContatos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
