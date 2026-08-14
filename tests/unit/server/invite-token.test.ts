import { describe, expect, it } from 'vitest';
import {
  generateInviteToken,
  hashInviteToken,
  INVITE_TOKEN_PATTERN,
} from '@server/tokens/invite-token.ts';

describe('token de convite', () => {
  it('gera token no formato base64url de 43 caracteres', () => {
    const token = generateInviteToken();

    expect(token).toMatch(INVITE_TOKEN_PATTERN);
    expect(token).toHaveLength(43);
  });

  it('não colide em uma amostra grande', () => {
    const tokens = new Set(Array.from({ length: 10_000 }, () => generateInviteToken()));

    expect(tokens.size).toBe(10_000);
  });

  it('não é sequencial: dois tokens consecutivos não compartilham prefixo longo', () => {
    const a = generateInviteToken();
    const b = generateInviteToken();

    let shared = 0;
    while (shared < a.length && a[shared] === b[shared]) shared += 1;

    expect(shared).toBeLessThan(8);
  });

  it('produz hash estável para o mesmo token', () => {
    const token = generateInviteToken();

    expect(hashInviteToken(token)).toEqual(hashInviteToken(token));
  });

  it('produz hashes distintos para tokens distintos', () => {
    expect(hashInviteToken(generateInviteToken())).not.toEqual(
      hashInviteToken(generateInviteToken()),
    );
  });

  it('o hash tem 32 bytes (SHA-256) e não revela o token', () => {
    const token = generateInviteToken();
    const hash = hashInviteToken(token);

    expect(hash).toHaveLength(32);
    expect(hash.toString('utf8')).not.toContain(token);
  });

  it('rejeita token com formato inválido ao gerar hash', () => {
    expect(() => hashInviteToken('curto-demais')).toThrow();
  });
});
