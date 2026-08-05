/**
 * POST /painel-contatos
 *
 * Backend do painel em /admin. Toda chamada carrega a senha no corpo e uma
 * acao: "listar", "alternar" (novo <-> respondido) ou "excluir".
 *
 * Variavel de ambiente obrigatoria:
 *   PAINEL_SENHA  — a senha do painel. Sem ela a funcao recusa tudo.
 */

import { getStore } from '@netlify/blobs';

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return iso;
  }
}

/** Comparacao de tempo constante, para nao vazar a senha pelo relogio. */
function senhaConfere(enviada, esperada) {
  if (typeof enviada !== 'string' || !esperada) return false;
  const a = new TextEncoder().encode(enviada);
  const b = new TextEncoder().encode(esperada);
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diferenca === 0;
}

export default async function handler(req) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo nao permitido' });

  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return resposta(400, { erro: 'corpo invalido' });
  }

  if (!senhaConfere(corpo.senha, process.env.PAINEL_SENHA)) {
    return resposta(401, { erro: 'nao autorizado' });
  }

  const store = getStore('hubstation-contatos');

  if (corpo.acao === 'excluir') {
    if (!corpo.id) return resposta(400, { erro: 'id ausente' });
    await store.delete(String(corpo.id));
    return resposta(200, { ok: true });
  }

  if (corpo.acao === 'alternar') {
    if (!corpo.id) return resposta(400, { erro: 'id ausente' });
    const atual = await store.get(String(corpo.id), { type: 'json' });
    if (!atual) return resposta(404, { erro: 'contato nao encontrado' });
    atual.status = atual.status === 'respondido' ? 'novo' : 'respondido';
    await store.setJSON(String(corpo.id), atual);
    return resposta(200, { ok: true });
  }

  // padrao: listar
  const { blobs } = await store.list();
  const contatos = (
    await Promise.all(
      blobs.map(({ key }) => store.get(key, { type: 'json' }).catch(() => null))
    )
  )
    .filter(Boolean)
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)))
    .map((c) => ({ ...c, data: formatarData(c.ts) }));

  return resposta(200, { contatos });
}

export const config = { path: '/painel-contatos' };
