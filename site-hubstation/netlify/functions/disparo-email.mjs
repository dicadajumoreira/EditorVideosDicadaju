/**
 * POST /disparo-email
 *
 * Disparo de e-mail em massa, PAGINADO. O painel chama esta funcao em laco,
 * passando offset, ate hasMore virar false. Uma serverless function tem
 * poucos segundos de vida; mandar tudo numa chamada so estoura o limite.
 *
 * Corpo:
 *   { assunto, html, filtro?, offset?, limite?, disparoId?, teste? }
 *
 * filtro: { segmentos?, canais?, status? }
 * teste:  { email }   manda so pra esse endereco e nao grava historico
 *
 * Resposta:
 *   { ok, enviados, falhas, processados, total, hasMore, proximoOffset, disparoId }
 */

import { getStore } from '@netlify/blobs';
import { todos, elegiveis } from '../lib/leads.mjs';
import { doPedido } from '../lib/auth-token.mjs';
import {
  DE, RODAPE_DISPARO, personalizar, enviar, urlDescadastro, primeiroNome,
} from '../lib/email.mjs';

// A Resend permite ~5 requisicoes por segundo. Enviamos em fila, um por vez,
// com 250ms entre cada (~4/s constantes). Rajada tropeca no limite mesmo
// quando a media esta dentro.
const INTERVALO_MS = 250;
const LIMITE_PADRAO = 40;

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo nao permitido' });
  if (!doPedido(req)) return resposta(401, { erro: 'nao autorizado' });
  if (!process.env.RESEND_API_KEY) {
    return resposta(500, { erro: 'RESEND_API_KEY nao configurada no Netlify' });
  }

  let corpo;
  try { corpo = await req.json(); } catch { return resposta(400, { erro: 'corpo invalido' }); }

  const assunto = String(corpo.assunto || '').trim();
  const html = String(corpo.html || '');
  if (!assunto) return resposta(400, { erro: 'o assunto e obrigatorio' });
  if (!html) return resposta(400, { erro: 'o corpo do e-mail e obrigatorio' });

  // ---- modo teste: um destinatario, sem historico
  if (corpo.teste && corpo.teste.email) {
    const vars = { nome: 'Teste', empresa: 'Empresa', email: corpo.teste.email };
    try {
      await enviar({
        from: DE,
        to: [corpo.teste.email],
        subject: personalizar(assunto, vars),
        html: personalizar(html + RODAPE_DISPARO, {
          ...vars, unsubscribe_url: urlDescadastro(corpo.teste.email) || '',
        }),
      });
      return resposta(200, { ok: true, teste: true, enviados: 1, falhas: 0 });
    } catch (e) {
      return resposta(500, { erro: e.message, teste: true });
    }
  }

  // ---- modo real
  const offset = Math.max(0, parseInt(corpo.offset || 0, 10) || 0);
  const limite = Math.max(1, Math.min(60, parseInt(corpo.limite || LIMITE_PADRAO, 10) || LIMITE_PADRAO));
  const disparoId = String(corpo.disparoId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  let alvos, recusados;
  try {
    const r = elegiveis(await todos(), corpo.filtro || {});
    alvos = r.lista;
    recusados = r.recusados;
  } catch (e) {
    return resposta(500, { erro: 'falha ao ler a base de contatos: ' + e.message });
  }

  const total = alvos.length;
  const fatia = alvos.slice(offset, offset + limite);

  let enviados = 0, falhas = 0;
  const erros = [];
  const registro = [];

  for (let i = 0; i < fatia.length; i++) {
    const { email, contato } = fatia[i];
    const vars = {
      nome: primeiroNome(contato.nome) || 'ai',
      empresa: contato.empresa || '',
      segmento: contato.segmento || '',
      email,
    };
    try {
      await enviar({
        from: DE,
        to: [email],
        subject: personalizar(assunto, vars),
        html: personalizar(html + RODAPE_DISPARO, { ...vars, unsubscribe_url: urlDescadastro(email) || '' }),
      });
      enviados++;
      registro.push({ email, nome: contato.nome || '', status: 'enviado' });
    } catch (e) {
      falhas++;
      const msg = String(e.message || 'erro').slice(0, 200);
      if (erros.length < 5) erros.push(msg);
      registro.push({ email, nome: contato.nome || '', status: 'falhou', erro: msg });
    }
    if (i < fatia.length - 1) await new Promise((r) => setTimeout(r, INTERVALO_MS));
  }

  const proximoOffset = offset + fatia.length;
  const hasMore = proximoOffset < total;

  // Historico cumulativo, best-effort: se falhar, o disparo ja aconteceu.
  try {
    const loja = getStore({ name: 'hubstation-disparos', consistency: 'strong' });
    const anterior = await loja.get(disparoId, { type: 'json' }).catch(() => null);
    await loja.setJSON(disparoId, {
      id: disparoId,
      tipo: 'email',
      criadoEm: anterior?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      assunto,
      html,
      filtro: corpo.filtro || {},
      enviados: (anterior?.enviados || 0) + enviados,
      falhas: (anterior?.falhas || 0) + falhas,
      total: Math.max(anterior?.total || 0, total),
      concluido: !hasMore,
      recusados,
      registro: [...(anterior?.registro || []), ...registro].slice(-2000),
    });
  } catch (e) {
    console.error('[disparo-email] falha ao gravar historico:', e.message);
  }

  return resposta(200, {
    ok: true, enviados, falhas, processados: fatia.length,
    total, offset, proximoOffset, hasMore, disparoId, erros,
    recusados: offset === 0 ? recusados : undefined,
  });
}

export const config = { path: '/disparo-email' };
