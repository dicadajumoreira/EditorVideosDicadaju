// Token assinado (HMAC-SHA256) para o painel /admin e para os links de
// descadastro. Vive FORA de netlify/functions/ de proposito: o Netlify
// empacota como funcao tudo que estiver la dentro, e uma funcao importando
// a outra quebra o bundling em producao.

import crypto from 'node:crypto';

export const HORAS_DE_VALIDADE = 12;

export function segredo() {
  return process.env.AUTH_SECRET || process.env.PAINEL_SENHA || 'hubstation-sem-segredo';
}

export function assinar(payload, secret = segredo()) {
  const dados = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(dados).digest('base64url');
  return `${dados}.${sig}`;
}

export function conferir(token, secret = segredo()) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [dados, sig] = token.split('.');
  const esperado = crypto.createHmac('sha256', secret).update(dados).digest('base64url');
  // timingSafeEqual exige buffers do mesmo tamanho
  const a = Buffer.from(sig || '');
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Le o Bearer do cabecalho e devolve o payload, ou null. */
export function doPedido(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return conferir(token);
}

/** Comparacao de senha em tempo constante. */
export function senhaConfere(enviada, esperada) {
  if (typeof enviada !== 'string' || !esperada) return false;
  const a = Buffer.from(enviada);
  const b = Buffer.from(String(esperada));
  if (a.length !== b.length) {
    // ainda assim gasta o tempo da comparacao, pra nao vazar o tamanho
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
