// Cliente da WhatsApp Cloud API (Meta Graph API).
//
// Regra do WhatsApp que manda em tudo aqui: mensagem iniciada pela empresa
// so pode ser um TEMPLATE previamente aprovado pela Meta. Texto livre so
// dentro da janela de 24h depois que o cliente escreveu. Por isso o disparo
// em massa daqui e sempre por template.
//
// Variaveis de ambiente (Netlify > Environment variables):
//   WHATSAPP_ACCESS_TOKEN     token permanente (System User)
//   WHATSAPP_PHONE_NUMBER_ID  id do numero remetente
//   WHATSAPP_WABA_ID          id da conta WhatsApp Business
// Sem elas o modulo responde "nao configurado" em vez de quebrar.

const VERSAO = 'v21.0';
const BASE = `https://graph.facebook.com/${VERSAO}`;

export function configurado() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function faltando() {
  return [
    ['WHATSAPP_ACCESS_TOKEN', process.env.WHATSAPP_ACCESS_TOKEN],
    ['WHATSAPP_PHONE_NUMBER_ID', process.env.WHATSAPP_PHONE_NUMBER_ID],
    ['WHATSAPP_WABA_ID', process.env.WHATSAPP_WABA_ID],
  ].filter(([, v]) => !v).map(([k]) => k);
}

async function chamar(caminho, opcoes = {}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN nao configurado');
  const r = await fetch(`${BASE}/${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  });
  const texto = await r.text();
  let corpo;
  try { corpo = JSON.parse(texto); } catch { corpo = { raw: texto }; }
  if (!r.ok) {
    const msg = corpo?.error?.message || texto.slice(0, 200);
    throw new Error(`Meta ${r.status}: ${msg}`);
  }
  return corpo;
}

/** Lista os templates aprovados da conta, para o painel escolher. */
export async function listarTemplates() {
  const waba = process.env.WHATSAPP_WABA_ID;
  if (!waba) throw new Error('WHATSAPP_WABA_ID nao configurado');
  const r = await chamar(`${waba}/message_templates?limit=100&fields=name,status,language,category,components`);
  return (r.data || []).map((t) => ({
    nome: t.name,
    idioma: t.language,
    status: t.status,
    categoria: t.category,
    // quantas variaveis {{1}}, {{2}}... o corpo do template espera
    variaveis: contarVariaveis(t.components),
  }));
}

function contarVariaveis(componentes) {
  const corpo = (componentes || []).find((c) => c.type === 'BODY');
  if (!corpo || !corpo.text) return 0;
  const achados = corpo.text.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
  return achados.reduce((max, m) => Math.max(max, parseInt(m.replace(/\D/g, ''), 10) || 0), 0);
}

/** Envia um template para um numero em E.164 sem "+". */
export async function enviarTemplate({ para, template, idioma = 'pt_BR', variaveis = [] }) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) throw new Error('WHATSAPP_PHONE_NUMBER_ID nao configurado');

  const componentes = variaveis.length ? [{
    type: 'body',
    parameters: variaveis.map((v) => ({ type: 'text', text: String(v ?? '') })),
  }] : [];

  return chamar(`${phoneId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: para,
      type: 'template',
      template: { name: template, language: { code: idioma }, components: componentes },
    }),
  });
}

/** Healthcheck: confirma que o token enxerga o numero. */
export async function ping() {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) throw new Error('WHATSAPP_PHONE_NUMBER_ID nao configurado');
  return chamar(`${phoneId}?fields=display_phone_number,verified_name,quality_rating`);
}
