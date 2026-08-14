import { createHash, randomBytes } from 'node:crypto';

/**
 * Tokens de convite (Princípio III, research.md R-010).
 *
 * 32 bytes de CSPRNG = 256 bits de entropia, em base64url (43 caracteres, sem padding).
 * Identificador sequencial é proibido pela constituição: permitiria enumerar convites.
 *
 * O token cru NUNCA é persistido — o banco guarda apenas o SHA-256. Um vazamento do banco
 * não deve entregar acesso aos convites, pelo mesmo motivo que credenciais não são
 * armazenadas em claro. Hash simples (sem KDF) é suficiente aqui: o token já tem 256 bits de
 * entropia, então não há espaço de busca a proteger contra força bruta.
 */

export const INVITE_TOKEN_BYTES = 32;
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString('base64url');
}

export function isValidInviteTokenFormat(token: string): boolean {
  return INVITE_TOKEN_PATTERN.test(token);
}

/**
 * @throws se o token não tiver o formato esperado — passar um valor arbitrário aqui é erro
 * de programação, e falhar cedo evita gravar um hash de lixo no banco.
 */
export function hashInviteToken(token: string): Buffer {
  if (!isValidInviteTokenFormat(token)) {
    throw new Error('Token de convite com formato inválido');
  }
  return createHash('sha256').update(token, 'utf8').digest();
}
