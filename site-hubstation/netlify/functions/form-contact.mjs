/**
 * POST /form-contact
 *
 * Unica porta de entrada de contato do site. Recebe tanto o formulario da
 * pagina Contato quanto o cadastro que aparece antes do WhatsApp — os dois
 * caem na MESMA base, marcados pelo campo "canal".
 *
 * Resposta traz `whatsappUrl` quando canal === 'whatsapp', para o site
 * mandar a pessoa para a conversa logo depois de cadastrar.
 */

import { novoId, gravar } from '../lib/leads.mjs';
import { paraE164, bonito, pareceTelefone } from '../lib/telefone.mjs';
import { avisarCadastro } from '../lib/email.mjs';

const LIMITES = { nome: 120, empresa: 160, segmento: 80, objetivo: 4000, contato: 200 };

const WHATSAPP_NUMERO = process.env.WHATSAPP_COMERCIAL || '5511988815448';
const WHATSAPP_TEXTO = 'Olá, quero falar com a HubStation';

function limpar(valor, max) {
  return String(valor ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function resposta(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function lerCorpo(req) {
  const tipo = req.headers.get('content-type') || '';
  if (tipo.includes('application/json')) return await req.json();
  const form = await req.formData();
  return Object.fromEntries(form.entries());
}

export default async function handler(req) {
  if (req.method !== 'POST') return resposta(405, { erro: 'metodo nao permitido' });

  let dados;
  try {
    dados = await lerCorpo(req);
  } catch {
    return resposta(400, { erro: 'corpo invalido' });
  }

  // Armadilha de robo: o campo fica escondido no formulario, so um script
  // automatico preenche. Respondemos 200 para o robo achar que funcionou.
  if (limpar(dados['bot-field'], 50)) return resposta(200, { ok: true });

  const canal = dados.canal === 'whatsapp' ? 'whatsapp' : 'site';
  const contatoTexto = limpar(dados.contato, LIMITES.contato);

  // O campo "contato" aceita e-mail ou WhatsApp. Separamos os dois para
  // conseguir disparar por e-mail e por WhatsApp depois.
  const email = contatoTexto.includes('@') ? contatoTexto.toLowerCase() : limpar(dados.email, LIMITES.contato).toLowerCase();
  const telefoneBruto = pareceTelefone(contatoTexto) ? contatoTexto : limpar(dados.telefone, 40);
  const telefone = paraE164(telefoneBruto);

  const contato = {
    id: novoId(),
    ts: new Date().toISOString(),
    canal,
    nome: limpar(dados.nome, LIMITES.nome),
    empresa: limpar(dados.empresa, LIMITES.empresa),
    segmento: limpar(dados.segmento, LIMITES.segmento),
    objetivo: limpar(dados.objetivo, LIMITES.objetivo),
    contato: contatoTexto,
    email: email && email.includes('@') ? email : '',
    telefone: telefone || '',
    telefonePretty: telefone ? bonito(telefone) : '',
    // Quem veio pelo botao do WhatsApp esta pedindo conversa por ali: e um
    // opt-in explicito. Quem veio pelo formulario do site so entra no
    // disparo de WhatsApp se tiver marcado a caixa.
    waOptIn: canal === 'whatsapp' ? true : dados.waOptIn === true || dados.waOptIn === 'on',
    waOptOut: false,
    descadastrado: false,
    status: 'novo',
  };

  if (!contato.nome || !contatoTexto) {
    return resposta(400, { erro: 'nome e contato sao obrigatorios' });
  }

  try {
    await gravar(contato);
  } catch (err) {
    console.error('[form-contact] falha ao gravar:', err.message);
    return resposta(500, { erro: 'nao foi possivel gravar o contato' });
  }

  // O e-mail nunca segura a resposta: se a Resend estiver fora, o cadastro
  // ja esta salvo e o painel mostra.
  await avisarCadastro(contato);

  const saida = { ok: true };
  if (canal === 'whatsapp') {
    saida.whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_TEXTO)}`;
  }
  return resposta(200, saida);
}

export const config = { path: '/form-contact' };
