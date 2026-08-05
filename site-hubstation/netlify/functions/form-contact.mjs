/**
 * POST /form-contact
 *
 * Recebe os envios do formulario da pagina Contato, guarda no Netlify Blobs e,
 * se houver RESEND_API_KEY configurada, avisa a equipe por e-mail.
 *
 * Variaveis de ambiente (Netlify > Site configuration > Environment variables):
 *   RESEND_API_KEY     opcional — sem ela o contato so e gravado, nada de e-mail
 *   CONTATO_REMETENTE  opcional — de onde sai o aviso (padrao: site@hubstation.com.br)
 *   CONTATO_DESTINO    opcional — para quem vai, separado por virgula
 *                                 (padrao: contato@hubstation.com.br)
 */

import { getStore } from '@netlify/blobs';

const LIMITES = { nome: 120, empresa: 160, segmento: 80, objetivo: 4000, contato: 200 };

function limpar(valor, max) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function lerCorpo(req) {
  const tipo = req.headers.get('content-type') || '';
  if (tipo.includes('application/json')) return await req.json();
  const form = await req.formData();
  return Object.fromEntries(form.entries());
}

async function avisarPorEmail(contato) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return;

  const destino = (process.env.CONTATO_DESTINO || 'contato@hubstation.com.br')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  const linhas = [
    ['Nome', contato.nome],
    ['Empresa', contato.empresa],
    ['Segmento', contato.segmento],
    ['Contato', contato.contato],
    ['O que precisa resolver', contato.objetivo],
  ]
    .map(([r, v]) => `<p style="margin:0 0 10px"><strong>${r}:</strong> ${v || '-'}</p>`)
    .join('');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.CONTATO_REMETENTE || 'site@hubstation.com.br',
      to: destino,
      reply_to: contato.contato?.includes('@') ? contato.contato : undefined,
      subject: `Novo contato pelo site: ${contato.nome || 'sem nome'}`,
      html: `<h2 style="font-family:sans-serif">Novo contato pelo site</h2>${linhas}`,
    }),
  }).catch(() => {
    /* o contato ja esta gravado; falha no e-mail nao derruba o envio */
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo nao permitido' });

  let dados;
  try {
    dados = await lerCorpo(req);
  } catch {
    return resposta(400, { erro: 'corpo invalido' });
  }

  // armadilha de robo: campo escondido preenchido = descarta em silencio
  if (limpar(dados['bot-field'], 50)) return resposta(200, { ok: true });

  const contato = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    nome: limpar(dados.nome, LIMITES.nome),
    empresa: limpar(dados.empresa, LIMITES.empresa),
    segmento: limpar(dados.segmento, LIMITES.segmento),
    objetivo: limpar(dados.objetivo, LIMITES.objetivo),
    contato: limpar(dados.contato, LIMITES.contato),
    status: 'novo',
  };

  if (!contato.nome || !contato.contato) {
    return resposta(400, { erro: 'nome e contato sao obrigatorios' });
  }

  try {
    const store = getStore('hubstation-contatos');
    await store.setJSON(contato.id, contato);
  } catch (err) {
    return resposta(500, { erro: 'nao foi possivel gravar o contato' });
  }

  await avisarPorEmail(contato);

  return resposta(200, { ok: true });
}

export const config = { path: '/form-contact' };
