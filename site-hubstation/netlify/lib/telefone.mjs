// Normalizacao de telefone para E.164 sem o "+", que e o formato exigido
// pela WhatsApp Cloud API da Meta. O cliente cola de tudo no campo, entao
// aceitamos formato livre e inferimos o Brasil quando falta o codigo do pais.

const BRASIL = '55';

/** '(11) 99999-1234' -> '5511999991234'. Devolve null se nao der pra usar. */
export function paraE164(entrada) {
  if (!entrada) return null;
  let d = String(entrada).replace(/\D/g, '').replace(/^0+/, '');
  if (d.length < 10) return null;

  // 10 ou 11 digitos sem codigo de pais: assume Brasil (DDD + numero)
  if (!d.startsWith(BRASIL) && (d.length === 10 || d.length === 11)) {
    d = BRASIL + d;
  }

  // Celular brasileiro no formato antigo (55 + DDD + 8 digitos): a Meta
  // exige o 9 na frente. Faixa movel comeca em 6.
  if (d.startsWith(BRASIL) && d.length === 12) {
    const ddd = d.slice(2, 4);
    const assinante = d.slice(4);
    if (parseInt(assinante[0], 10) >= 6) d = BRASIL + ddd + '9' + assinante;
  }

  if (d.length < 8 || d.length > 15) return null;
  return d;
}

/** '5511999991234' -> '+55 11 99999-1234' */
export function bonito(e164) {
  const s = String(e164 || '');
  if (s.startsWith('55') && s.length === 13) {
    return `+55 ${s.slice(2, 4)} ${s.slice(4, 9)}-${s.slice(9)}`;
  }
  return s.length >= 10 ? '+' + s : s;
}

export function ehValido(s) {
  return /^\d{8,15}$/.test(String(s || ''));
}

/** Detecta se o texto digitado no campo "contato" parece um telefone. */
export function pareceTelefone(texto) {
  const s = String(texto || '');
  if (s.includes('@')) return false;
  return (s.replace(/\D/g, '').length >= 10);
}
