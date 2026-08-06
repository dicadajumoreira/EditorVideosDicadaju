/**
 * POST /disparos
 *
 * Historico dos disparos e apoio ao painel.
 *
 * Acoes:
 *   historico              -> lista os disparos, mais recentes primeiro
 *   detalhe   { id }       -> um disparo com o registro por destinatario
 *   apagar    { id }
 *   wa-status              -> healthcheck do WhatsApp (variaveis + ping Meta)
 *   wa-templates           -> templates aprovados na conta da Meta
 */

import { getStore } from '@netlify/blobs';
import { doPedido } from '../lib/auth-token.mjs';
import { listarTemplates, ping, configurado, faltando } from '../lib/wa-meta.mjs';

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function loja() {
  return getStore({ name: 'hubstation-disparos', consistency: 'strong' });
}

export default async function handler(req) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo nao permitido' });
  if (!doPedido(req)) return resposta(401, { erro: 'nao autorizado' });

  let corpo;
  try { corpo = await req.json(); } catch { return resposta(400, { erro: 'corpo invalido' }); }

  if (corpo.acao === 'apagar') {
    if (!corpo.id) return resposta(400, { erro: 'id ausente' });
    await loja().delete(String(corpo.id));
    return resposta(200, { ok: true });
  }

  if (corpo.acao === 'detalhe') {
    if (!corpo.id) return resposta(400, { erro: 'id ausente' });
    const d = await loja().get(String(corpo.id), { type: 'json' }).catch(() => null);
    if (!d) return resposta(404, { erro: 'disparo nao encontrado' });
    return resposta(200, { disparo: d });
  }

  if (corpo.acao === 'wa-status') {
    const ausentes = faltando();
    if (!configurado()) return resposta(200, { ok: false, configurado: false, faltando: ausentes });
    try {
      const numero = await ping();
      return resposta(200, { ok: true, configurado: true, faltando: ausentes, numero });
    } catch (e) {
      return resposta(200, { ok: false, configurado: true, faltando: ausentes, erro: e.message });
    }
  }

  if (corpo.acao === 'wa-templates') {
    if (!configurado()) return resposta(200, { templates: [], configurado: false, faltando: faltando() });
    try {
      return resposta(200, { templates: await listarTemplates(), configurado: true });
    } catch (e) {
      return resposta(200, { templates: [], configurado: true, erro: e.message });
    }
  }

  // padrao: historico (sem o registro completo, que pode ser grande)
  const { blobs } = await loja().list();
  const lidos = await Promise.all(
    (blobs || []).map(({ key }) => loja().get(key, { type: 'json' }).catch(() => null))
  );
  const disparos = lidos
    .filter(Boolean)
    .map(({ registro, html, ...resto }) => ({ ...resto, destinatarios: (registro || []).length }))
    .sort((a, b) => String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')));

  return resposta(200, { disparos });
}

export const config = { path: '/disparos' };
