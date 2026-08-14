import { describe, expect, it } from 'vitest';
import { assertSubmissionAllowed, ResponseRuleError } from '@domain/rsvp/response.ts';

const deadline = new Date('2026-10-31T23:59:59Z');
const before = new Date('2026-10-30T12:00:00Z');
const after = new Date('2026-11-01T00:00:00Z');

const context = { maxPartySize: 4, rsvpDeadline: deadline, now: before };

describe('regras de resposta ao RSVP', () => {
  it('aceita confirmação dentro do prazo e da capacidade', () => {
    expect(() =>
      assertSubmissionAllowed({ status: 'attending', partySize: 3 }, context),
    ).not.toThrow();
  });

  it('aceita recusa com partySize zero', () => {
    expect(() =>
      assertSubmissionAllowed({ status: 'not_attending', partySize: 0 }, context),
    ).not.toThrow();
  });

  it('rejeita recusa com partySize maior que zero', () => {
    expect(() =>
      assertSubmissionAllowed({ status: 'not_attending', partySize: 1 }, context),
    ).toThrow(ResponseRuleError);
  });

  it('rejeita confirmação com partySize zero', () => {
    expect(() => assertSubmissionAllowed({ status: 'attending', partySize: 0 }, context)).toThrow(
      ResponseRuleError,
    );
  });

  it('rejeita partySize acima da capacidade do convite', () => {
    expect(() => assertSubmissionAllowed({ status: 'attending', partySize: 5 }, context)).toThrow(
      expect.objectContaining({ code: 'party_size_exceeded' }),
    );
  });

  it('aceita partySize exatamente igual à capacidade', () => {
    expect(() =>
      assertSubmissionAllowed({ status: 'attending', partySize: 4 }, context),
    ).not.toThrow();
  });

  it('rejeita submissão após o prazo', () => {
    expect(() =>
      assertSubmissionAllowed({ status: 'attending', partySize: 1 }, { ...context, now: after }),
    ).toThrow(expect.objectContaining({ code: 'rsvp_deadline_passed' }));
  });

  it('rejeita submissão exatamente no instante do prazo', () => {
    expect(() =>
      assertSubmissionAllowed(
        { status: 'attending', partySize: 1 },
        { ...context, now: deadline },
      ),
    ).toThrow(expect.objectContaining({ code: 'rsvp_deadline_passed' }));
  });

  it('rejeita notas acima de 1000 caracteres', () => {
    expect(() =>
      assertSubmissionAllowed(
        { status: 'attending', partySize: 1, dietaryNotes: 'a'.repeat(1001) },
        context,
      ),
    ).toThrow(ResponseRuleError);
  });

  it('a mensagem de erro não inclui o conteúdo das notas (Princípio III)', () => {
    try {
      assertSubmissionAllowed(
        { status: 'attending', partySize: 1, dietaryNotes: `alergia-secreta${'x'.repeat(1000)}` },
        context,
      );
      expect.unreachable('deveria ter lançado');
    } catch (error) {
      expect((error as Error).message).not.toContain('alergia-secreta');
    }
  });
});
