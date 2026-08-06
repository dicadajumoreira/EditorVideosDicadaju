/**
 * POST /disparo-whatsapp
 *
 * Disparo por WhatsApp usando a Cloud API oficial da Meta. Mesmo desenho do
 * disparo de e-mail: paginado, o painel chama em laco ate acabar.
 *
 * Regras que o WhatsApp impoe e que estao aplicadas aqui:
 *   - mensagem iniciada pela empresa SO pode ser template aprovado
 *   - so vai para quem deu opt-in (waOptIn) e nao pediu para sair
 *   - opt-out e definitivo
 *
 * Corpo:
 *   { template, idioma?, variaveis?, filtro?, offset?, limite?, disparoId?, teste? }
 *
 * variaveis: lista de campos do contato para preencher {{1}}, {{2}}...
 *            do template. Ex.: ['nome', 'empresa']
 */

import { getStore } from '@netlify/blobs';
import { todos, elegiveisWhatsapp } from '../lib/leads.mjs';
import { doPedido } from '../lib/auth-token.mjs';
import { enviarTemplate, configurado, faltando } from '../lib/wa-meta.mjs';
import { primeiroNome } from '../lib/email.mjs';
import { paraE164 } from '../lib/telefone.mjs';

const INTERVALO_MS = 300;
const LIMITE_PADRAO = 30;

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function valorDoCampo(contato, campo) {
  if (campo === 'nome') return primeiroNome(contato.nome) || 'tudo bem';
  return contato[campo] ?? '';
}

export default async function handler(req) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo nao permitido' });
  if (!doPedido(req)) return resposta(401, { erro: 'nao autorizado' });

  if (!configurado()) {
    return resposta(500, {
      erro: 'WhatsApp ainda nao configurado no Netlify',
      faltando: faltando(),
    });
  }

  let corpo;
  try { corpo = await req.json(); } catch { return resposta(400, { erro: 'corpo invalido' }); }

  const template = String(corpo.template || '').trim();
  const idioma = String(corpo.idioma || 'pt_BR');
  const campos = Array.isArray(corpo.variaveis) ? corpo.variaveis : [];
  if (!template) return resposta(400, { erro: 'escolha um template aprovado' });

  // ---- modo teste
  if (corpo.teste && corpo.teste.telefone) {
    const numero = paraE164(corpo.teste.telefone);
    if (!numero) return resposta(400, { erro: 'telefone de teste invalido' });
    try {
      await enviarTemplate({
        para: numero, template, idioma,
        variaveis: campos.map(() => 'Teste'),
      });
      return resposta(200, { ok: true, teste: true, enviados: 1, falhas: 0 });
    } catch (e) {
      return resposta(500, { erro: e.message, teste: true });
    }
  }

  const offset = Math.max(0, parseInt(corpo.offset || 0, 10) || 0);
  const limite = Math.max(1, Math.min(50, parseInt(corpo.limite || LIMITE_PADRAO, 10) || LIMITE_PADRAO));
  const disparoId = String(corpo.disparoId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  let alvos, recusados;
  try {
    const r = elegiveisWhatsapp(await todos(), corpo.filtro || {});
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
    const { telefone, contato } = fatia[i];
    try {
      await enviarTemplate({
        para: telefone, template, idioma,
        variaveis: campos.map((campo) => valorDoCampo(contato, campo)),
      });
      enviados++;
      registro.push({ telefone, nome: contato.nome || '', status: 'enviado' });
    } catch (e) {
      falhas++;
      const msg = String(e.message || 'erro').slice(0, 200);
      if (erros.length < 5) erros.push(msg);
      registro.push({ telefone, nome: contato.nome || '', status: 'falhou', erro: msg });
    }
    if (i < fatia.length - 1) await new Promise((r) => setTimeout(r, INTERVALO_MS));
  }

  const proximoOffset = offset + fatia.length;
  const hasMore = proximoOffset < total;

  try {
    const loja = getStore({ name: 'hubstation-disparos', consistency: 'strong' });
    const anterior = await loja.get(disparoId, { type: 'json' }).catch(() => null);
    await loja.setJSON(disparoId, {
      id: disparoId,
      tipo: 'whatsapp',
      criadoEm: anterior?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      assunto: `Template ${template}`,
      template, idioma, variaveis: campos,
      filtro: corpo.filtro || {},
      enviados: (anterior?.enviados || 0) + enviados,
      falhas: (anterior?.falhas || 0) + falhas,
      total: Math.max(anterior?.total || 0, total),
      concluido: !hasMore,
      recusados,
      registro: [...(anterior?.registro || []), ...registro].slice(-2000),
    });
  } catch (e) {
    console.error('[disparo-whatsapp] falha ao gravar historico:', e.message);
  }

  return resposta(200, {
    ok: true, enviados, falhas, processados: fatia.length,
    total, offset, proximoOffset, hasMore, disparoId, erros,
    recusados: offset === 0 ? recusados : undefined,
  });
}

export const config = { path: '/disparo-whatsapp' };
