/**
 * GET /sair?t=<token>
 *
 * Descadastro de e-mail. O link vem assinado dentro do proprio disparo, com
 * o endereco de quem clicou — ninguem descadastra outra pessoa.
 * Devolve uma pagina simples de confirmacao, na identidade da HubStation.
 */

import { conferir } from '../lib/auth-token.mjs';
import { todos, gravar } from '../lib/leads.mjs';

function pagina(titulo, texto, cor = '#F9DCA7') {
  return new Response(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${titulo} | HubStation</title>
<link rel="stylesheet" href="/assets/css/site.css"></head>
<body>
<main id="conteudo"><section style="min-height:70vh;display:flex;align-items:center">
  <div style="max-width:1280px;margin:0 auto;padding:100px 40px;width:100%;box-sizing:border-box">
    <div data-eyebrow="1" style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;letter-spacing:0.34em;color:${cor};margin-bottom:24px">HUBSTATION</div>
    <h1 style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(30px,4.4vw,58px);line-height:1.06;letter-spacing:0.02em;margin:0 0 24px;max-width:760px">${titulo}</h1>
    <p style="font-size:18px;line-height:1.5;color:#D5D3CD;max-width:560px;margin:0 0 40px">${texto}</p>
    <a href="/" class="hs-btn hs-h7" style="display:inline-block;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.2em;color:#F0EEEA;padding:18px 32px;border:1px solid rgba(240,238,234,0.3)">VOLTAR PARA O SITE</a>
  </div>
</section></main>
</body></html>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export default async function handler(req) {
  const token = new URL(req.url).searchParams.get('t') || '';
  const payload = conferir(token);
  if (!payload || !payload.email) {
    return pagina('Link expirado', 'Este link de descadastro não vale mais. Se quiser parar de receber nossos e-mails, responda qualquer mensagem nossa pedindo a remoção — a gente tira na hora.', '#F44336');
  }

  const alvo = String(payload.email).toLowerCase();
  let quantos = 0;
  try {
    for (const c of await todos()) {
      if (String(c.email || '').toLowerCase() === alvo && !c.descadastrado) {
        c.descadastrado = true;
        c.waOptOut = true;
        await gravar(c);
        quantos++;
      }
    }
  } catch (e) {
    console.error('[sair] falha:', e.message);
    return pagina('Não deu certo agora', 'Tivemos um problema para registrar seu descadastro. Tente de novo em alguns minutos, por favor.', '#F44336');
  }

  return pagina('Pronto, você saiu.',
    quantos
      ? `Não vamos mais mandar e-mails para <strong>${alvo}</strong>. Se um dia mudar de ideia, é só falar com a gente.`
      : `O endereço <strong>${alvo}</strong> já estava fora da nossa lista. Nada muda.`);
}

export const config = { path: '/sair' };
