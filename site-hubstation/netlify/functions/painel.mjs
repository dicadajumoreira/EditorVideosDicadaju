/**
 * POST /painel
 *
 * Backend do /admin. Uma porta so, com uma acao por chamada.
 *
 * A senha viaja UMA vez, em "entrar". Dali sai um token assinado que vale
 * 12 horas e vai no cabecalho Authorization das chamadas seguintes — assim
 * a senha nao fica indo e voltando a cada clique.
 *
 * Acoes:
 *   entrar    { senha }                 -> { token }
 *   listar    -                         -> { contatos, resumo }
 *   alternar  { id }                    -> alterna novo <-> respondido
 *   excluir   { id }
 *   optout    { id, valor }             -> tira/devolve do disparo
 *
 * Variavel de ambiente obrigatoria: PAINEL_SENHA
 */

import { todos, porId, gravar, apagar } from '../lib/leads.mjs';
import { assinar, doPedido, senhaConfere, HORAS_DE_VALIDADE } from '../lib/auth-token.mjs';

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return iso;
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo nao permitido' });

  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return resposta(400, { erro: 'corpo invalido' });
  }

  // ---- entrar: troca senha por token
  if (corpo.acao === 'entrar') {
    if (!process.env.PAINEL_SENHA) {
      return resposta(500, { erro: 'PAINEL_SENHA nao configurada no Netlify' });
    }
    if (!senhaConfere(corpo.senha, process.env.PAINEL_SENHA)) {
      return resposta(401, { erro: 'senha incorreta' });
    }
    const exp = Date.now() + HORAS_DE_VALIDADE * 60 * 60 * 1000;
    return resposta(200, { token: assinar({ painel: true, exp }), validoAte: exp });
  }

  // ---- daqui pra baixo, so com token valido
  if (!doPedido(req)) return resposta(401, { erro: 'nao autorizado' });

  if (corpo.acao === 'excluir') {
    if (!corpo.id) return resposta(400, { erro: 'id ausente' });
    await apagar(corpo.id);
    return resposta(200, { ok: true });
  }

  if (corpo.acao === 'alternar' || corpo.acao === 'optout') {
    if (!corpo.id) return resposta(400, { erro: 'id ausente' });
    const atual = await porId(corpo.id);
    if (!atual) return resposta(404, { erro: 'contato nao encontrado' });
    if (corpo.acao === 'alternar') {
      atual.status = atual.status === 'respondido' ? 'novo' : 'respondido';
    } else {
      atual.descadastrado = Boolean(corpo.valor);
    }
    await gravar(atual);
    return resposta(200, { ok: true });
  }

  // ---- listar (padrao)
  const contatos = (await todos()).map((c) => ({ ...c, data: formatarData(c.ts) }));
  const resumo = {
    total: contatos.length,
    novos: contatos.filter((c) => c.status !== 'respondido').length,
    doSite: contatos.filter((c) => (c.canal || 'site') === 'site').length,
    doWhatsapp: contatos.filter((c) => c.canal === 'whatsapp').length,
    comEmail: contatos.filter((c) => c.email).length,
    comWhatsapp: contatos.filter((c) => c.telefone && c.waOptIn && !c.waOptOut).length,
    descadastrados: contatos.filter((c) => c.descadastrado).length,
  };
  return resposta(200, { contatos, resumo });
}

export const config = { path: '/painel' };
