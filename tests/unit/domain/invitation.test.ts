import { describe, expect, it } from 'vitest';
import { assertValidInvitation, InvitationRuleError } from '@domain/rsvp/invitation.ts';

const valid = {
  guestName: 'Ana Ribeiro',
  guestEmail: 'ana@example.test',
  maxPartySize: 2,
};

describe('regras de convite', () => {
  it('aceita um convite válido', () => {
    expect(() => assertValidInvitation(valid)).not.toThrow();
  });

  it.each([
    ['vazio', ''],
    ['só espaços', '   '],
    ['acima de 200 caracteres', 'a'.repeat(201)],
  ])('rejeita nome %s', (_label, guestName) => {
    expect(() => assertValidInvitation({ ...valid, guestName })).toThrow(InvitationRuleError);
  });

  it('aceita nome com exatamente 200 caracteres', () => {
    expect(() => assertValidInvitation({ ...valid, guestName: 'a'.repeat(200) })).not.toThrow();
  });

  it.each([
    ['0', 0],
    ['negativo', -1],
    ['acima de 20', 21],
    ['fracionário', 1.5],
  ])('rejeita maxPartySize %s', (_label, maxPartySize) => {
    expect(() => assertValidInvitation({ ...valid, maxPartySize })).toThrow(
      InvitationRuleError,
    );
  });

  it.each([1, 20])('aceita maxPartySize no limite (%i)', (maxPartySize) => {
    expect(() => assertValidInvitation({ ...valid, maxPartySize })).not.toThrow();
  });

  it('aceita convite sem e-mail (campo opcional)', () => {
    expect(() => assertValidInvitation({ ...valid, guestEmail: null })).not.toThrow();
  });

  it.each([
    ['sem arroba', 'ana.example.test'],
    ['acima de 320 caracteres', `${'a'.repeat(315)}@e.co`],
  ])('rejeita e-mail %s', (_label, guestEmail) => {
    expect(() => assertValidInvitation({ ...valid, guestEmail })).toThrow(InvitationRuleError);
  });

  it('a mensagem de erro não inclui o valor rejeitado (Princípio III)', () => {
    try {
      assertValidInvitation({ ...valid, guestEmail: 'segredo-pessoal' });
      expect.unreachable('deveria ter lançado');
    } catch (error) {
      expect((error as Error).message).not.toContain('segredo-pessoal');
    }
  });
});
