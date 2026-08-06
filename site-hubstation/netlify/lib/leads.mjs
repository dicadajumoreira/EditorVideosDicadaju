// Acesso a base de contatos (Netlify Blobs, store "hubstation-contatos").
//
// Cada contato e um blob JSON com a chave sendo o proprio id. A base da
// HubStation comeca do zero, entao ler tudo de uma vez e varrer em memoria
// da conta com folga — nao ha por que construir indice resumo como no
// Bastidores, que carrega 14 mil registros frios.

import { getStore } from '@netlify/blobs';

export const STORE = 'hubstation-contatos';

export function loja() {
  return getStore({ name: STORE, consistency: 'strong' });
}

export function novoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Le todos os contatos, mais recentes primeiro. */
export async function todos() {
  const store = loja();
  const { blobs } = await store.list();
  const lidos = await Promise.all(
    (blobs || []).map(({ key }) => store.get(key, { type: 'json' }).catch(() => null))
  );
  return lidos
    .filter(Boolean)
    .sort((a, b) => String(b.ts || '').localeCompare(String(a.ts || '')));
}

export async function porId(id) {
  return loja().get(String(id), { type: 'json' }).catch(() => null);
}

export async function gravar(contato) {
  await loja().setJSON(String(contato.id), contato);
  return contato;
}

export async function apagar(id) {
  await loja().delete(String(id));
}

/**
 * Quem pode receber disparo: exclui descadastrados e inativos, remove
 * duplicata por e-mail (fica o cadastro mais recente) e devolve a lista
 * ordenada por e-mail — ordem estavel e o que faz a paginacao do disparo
 * nao repetir nem pular ninguem entre uma chamada e outra.
 */
export function elegiveis(contatos, filtro = {}) {
  const segmentos = filtro.segmentos && filtro.segmentos.length ? new Set(filtro.segmentos) : null;
  const canais = filtro.canais && filtro.canais.length ? new Set(filtro.canais) : null;
  const status = filtro.status && filtro.status.length ? new Set(filtro.status) : null;

  const porEmail = new Map();
  const recusados = { descadastrados: 0, semEmail: 0, porSegmento: 0, porCanal: 0, porStatus: 0, duplicados: 0 };

  for (const c of contatos) {
    if (c.descadastrado) { recusados.descadastrados++; continue; }
    if (segmentos && !segmentos.has(c.segmento || '')) { recusados.porSegmento++; continue; }
    if (canais && !canais.has(c.canal || 'site')) { recusados.porCanal++; continue; }
    if (status && !status.has(c.status || 'novo')) { recusados.porStatus++; continue; }

    const email = String(c.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) { recusados.semEmail++; continue; }

    if (porEmail.has(email)) { recusados.duplicados++; continue; } // ja veio o mais recente
    porEmail.set(email, c);
  }

  const lista = [...porEmail.entries()]
    .map(([email, c]) => ({ email, contato: c }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return { lista, recusados };
}

/** Mesma ideia, para WhatsApp: exige telefone e opt-in. */
export function elegiveisWhatsapp(contatos, filtro = {}) {
  const segmentos = filtro.segmentos && filtro.segmentos.length ? new Set(filtro.segmentos) : null;
  const porTelefone = new Map();
  const recusados = { semOptin: 0, semTelefone: 0, porSegmento: 0, duplicados: 0 };

  for (const c of contatos) {
    if (c.descadastrado || c.waOptOut) { recusados.semOptin++; continue; }
    if (!c.waOptIn) { recusados.semOptin++; continue; }
    if (segmentos && !segmentos.has(c.segmento || '')) { recusados.porSegmento++; continue; }
    const tel = String(c.telefone || '').trim();
    if (!/^\d{8,15}$/.test(tel)) { recusados.semTelefone++; continue; }
    if (porTelefone.has(tel)) { recusados.duplicados++; continue; }
    porTelefone.set(tel, c);
  }

  const lista = [...porTelefone.entries()]
    .map(([telefone, c]) => ({ telefone, contato: c }))
    .sort((a, b) => a.telefone.localeCompare(b.telefone));

  return { lista, recusados };
}
