// Envio de e-mail pela Resend, na identidade da HubStation.
//
// Dois usos:
//   1) aviso interno + resposta automatica quando alguem preenche o formulario
//   2) corpo padrao e rodape obrigatorio dos disparos em massa
//
// Best-effort: se a Resend falhar, o cadastro NAO cai junto.

import { assinar } from './auth-token.mjs';

export const SITE = process.env.SITE_URL || 'https://hubstation.com.br';
export const DE = process.env.CONTATO_REMETENTE || 'HubStation <site@hubstation.com.br>';
export const PARA_INTERNO = (process.env.CONTATO_DESTINO || 'contato@hubstation.com.br')
  .split(',').map((e) => e.trim()).filter(Boolean);

const OURO = '#B8A06A';
const AREIA = '#F9DCA7';
const TINTA = '#222222';
const OSSO = '#F0EEEA';
const PRETO = '#080808';

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function primeiroNome(nome) {
  return String(nome || '').trim().split(/\s+/)[0] || '';
}

/** URL assinada de descadastro. Vale um ano. */
export function urlDescadastro(email) {
  if (!email || !/@/.test(email)) return null;
  const exp = Date.now() + 365 * 24 * 60 * 60 * 1000;
  const token = assinar({ email: String(email).toLowerCase(), tipo: 'descadastro', exp });
  return `${SITE}/sair?t=${encodeURIComponent(token)}`;
}

export async function enviar(payload) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) throw new Error('RESEND_API_KEY nao configurada no Netlify');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Resend ${r.status}: ${t.slice(0, 200)}`);
  }
}

/** Nunca lanca. Usado nos fluxos onde o e-mail e secundario. */
export async function enviarSemQuebrar(payload, marcador) {
  try {
    await enviar(payload);
  } catch (e) {
    console.error(`[email] ${marcador} falhou:`, e.message);
  }
}

// ---------------------------------------------------------------- molde ----

export function molde(conteudo, linkDescadastro) {
  const descadastro = linkDescadastro ? `
        <p style="margin:8px 0 0;font-size:11px;line-height:1.6;color:#8A8A8A;text-align:center">
          Não quer mais receber? <a href="${linkDescadastro}" style="color:${OURO}">Descadastre-se aqui</a>.
        </p>` : '';
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HubStation</title></head>
<body style="margin:0;padding:0;background:#0B0B0B;font-family:Helvetica,Arial,sans-serif">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0B0B0B">
  <tr><td align="center" style="padding:32px 16px">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:${PRETO}">
      <tr><td style="padding:30px 40px 20px;border-bottom:1px solid rgba(240,238,234,0.14)">
        <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.01em;color:${OSSO}">HUB<span style="color:#F44336">&#9679;</span>STATION</p>
        <p style="margin:8px 0 0;font-size:10px;letter-spacing:0.26em;text-transform:uppercase;color:${OURO};font-weight:700">Mercado condominial</p>
      </td></tr>
      <tr><td style="padding:38px 40px">${conteudo}</td></tr>
      <tr><td style="padding:22px 40px;border-top:1px solid rgba(240,238,234,0.14);background:#0E0E0E">
        <p style="margin:0;font-size:11px;line-height:1.6;color:#8A8A8A;text-align:center">
          Você recebeu este e-mail porque deixou seu contato em
          <a href="${SITE}" style="color:${OURO}">hubstation.com.br</a>.
        </p>${descadastro}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function assinatura() {
  return `
    <div style="margin-top:30px;padding-top:22px;border-top:1px solid rgba(240,238,234,0.14)">
      <p style="margin:0;font-size:17px;font-weight:700;color:${OSSO}">HubStation</p>
      <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8A8A;font-weight:700">Marketing para o mercado condominial</p>
    </div>`;
}

// Rodape obrigatorio de TODO disparo em massa. O {{unsubscribe_url}} e
// trocado por uma URL unica por destinatario na hora do envio.
export const RODAPE_DISPARO = `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0B0B0B;font-family:Helvetica,Arial,sans-serif">
  <tr><td align="center" style="padding:0 16px 32px">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">
      <tr><td style="padding:16px 40px 18px;background:#0E0E0E;border-top:1px solid rgba(240,238,234,0.14);text-align:center">
        <p style="margin:0;font-size:11px;line-height:1.6;color:#8A8A8A">
          Você recebeu este e-mail porque deixou seu contato em
          <a href="${SITE}" style="color:${OURO}">hubstation.com.br</a>.
        </p>
        <p style="margin:8px 0 0;font-size:11px;line-height:1.6;color:#8A8A8A">
          Não quer mais receber? <a href="{{unsubscribe_url}}" style="color:${OURO}">Descadastre-se aqui</a>.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>`;

/** Troca {{nome}}, {{empresa}}, etc. Placeholder sem valor vira string vazia. */
export function personalizar(molde, vars) {
  return String(molde == null ? '' : molde).replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? '' : String(v);
  });
}

// ------------------------------------------------- e-mails transacionais ---

export function emailInterno(c) {
  const campos = [
    ['Nome', c.nome], ['Empresa', c.empresa], ['Segmento', c.segmento],
    ['Contato', c.contato], ['E-mail', c.email], ['Telefone', c.telefonePretty],
    ['Veio de', c.canal === 'whatsapp' ? 'Botão do WhatsApp' : 'Formulário do site'],
  ].filter(([, v]) => v);

  const linhas = campos.map(([k, v]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(240,238,234,0.12);font-size:10px;color:#8A8A8A;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;width:120px;vertical-align:top">${esc(k)}</td>
      <td style="padding:10px 0 10px 14px;border-bottom:1px solid rgba(240,238,234,0.12);font-size:14px;color:${OSSO};line-height:1.5">${esc(v)}</td>
    </tr>`).join('');

  return molde(`
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${AREIA};font-weight:700">Novo contato</p>
    <h1 style="font-size:28px;font-weight:700;line-height:1.1;margin:0 0 22px;color:${OSSO}">${esc(c.nome || 'Sem nome')}</h1>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">${linhas}</table>
    ${c.objetivo ? `
      <p style="margin:24px 0 6px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8A8A8A;font-weight:700">O que precisa resolver</p>
      <p style="margin:0;font-size:15px;line-height:1.65;color:#D5D3CD">${esc(c.objetivo)}</p>` : ''}
    <p style="margin:28px 0 0;font-size:13px;color:#8A8A8A">
      Abrir no painel: <a href="${SITE}/admin" style="color:${OURO}">${SITE}/admin</a>
    </p>
  `);
}

export function emailParaOCliente(c) {
  const nome = primeiroNome(c.nome);
  return molde(`
    <h1 style="font-size:30px;font-weight:700;line-height:1.1;margin:0 0 22px;color:${OSSO}">${nome ? `Recebido, ${esc(nome)}.` : 'Recebido.'}</h1>
    <p style="font-size:16px;line-height:1.65;color:#D5D3CD;margin:0 0 16px">
      Seu contato chegou à HubStation. Respondemos em até um dia útil, com dois horários possíveis para a conversa.
    </p>
    <p style="font-size:16px;line-height:1.65;color:#D5D3CD;margin:0 0 24px">
      São quarenta minutos sobre o momento da sua empresa. Sem apresentação de vendas, sem proposta antes de entendermos o problema.
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 6px;background:#0E0E0E;border-left:3px solid ${OURO}">
      <tr><td style="padding:18px 22px">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${OURO};font-weight:700">O que você escreveu</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#D5D3CD">${esc(c.objetivo || '—')}</p>
      </td></tr>
    </table>
    ${assinatura()}
  `, urlDescadastro(c.email));
}

/** Dispara os dois e-mails do cadastro. Nunca lanca. */
export async function avisarCadastro(c) {
  if (!process.env.RESEND_API_KEY) return;
  const tarefas = [
    enviarSemQuebrar({
      from: DE, to: PARA_INTERNO,
      subject: `Novo contato pelo site: ${c.nome || 'sem nome'}${c.empresa ? ' · ' + c.empresa : ''}`,
      html: emailInterno(c),
      reply_to: c.email || undefined,
    }, 'interno'),
  ];
  if (c.email) {
    tarefas.push(enviarSemQuebrar({
      from: DE, to: [c.email],
      subject: 'Recebemos seu contato · HubStation',
      html: emailParaOCliente(c),
    }, 'cliente'));
  }
  await Promise.allSettled(tarefas);
}
