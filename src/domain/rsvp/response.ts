/**
 * Regras da resposta ao RSVP e suas transições (data-model.md).
 *
 * Estas regras já existem embora `PUT /api/invitations/:token/response` ainda não seja
 * implementada: são o que a rota vai chamar, e tê-las testadas por unidade agora é o que
 * permite que aquela feature comece pelo teste de contrato em vez de pela regra.
 */

export const MAX_NOTES_LENGTH = 1000;

export type RsvpStatus = 'attending' | 'not_attending';

export type ResponseRuleCode =
  | 'party_size_invalid'
  | 'party_size_exceeded'
  | 'rsvp_deadline_passed'
  | 'notes_too_long';

export class ResponseRuleError extends Error {
  constructor(readonly code: ResponseRuleCode) {
    super(`Resposta inválida: ${code}`);
    this.name = 'ResponseRuleError';
  }
}

export interface SubmissionInput {
  readonly status: RsvpStatus;
  readonly partySize: number;
  readonly dietaryNotes?: string | null;
  readonly accessibilityNotes?: string | null;
}

export interface SubmissionContext {
  readonly maxPartySize: number;
  readonly rsvpDeadline: Date;
  readonly now: Date;
}

/**
 * @throws ResponseRuleError quando a submissão viola prazo, capacidade ou formato.
 *
 * O prazo é verificado ANTES da capacidade de propósito: um convidado atrasado deve saber
 * que o prazo passou, não que sua acompanhante não cabe.
 */
export function assertSubmissionAllowed(
  input: SubmissionInput,
  context: SubmissionContext,
): void {
  if (context.now.getTime() >= context.rsvpDeadline.getTime()) {
    throw new ResponseRuleError('rsvp_deadline_passed');
  }

  if (!Number.isInteger(input.partySize) || input.partySize < 0) {
    throw new ResponseRuleError('party_size_invalid');
  }

  if (input.status === 'not_attending' && input.partySize !== 0) {
    throw new ResponseRuleError('party_size_invalid');
  }

  if (input.status === 'attending') {
    if (input.partySize < 1) {
      throw new ResponseRuleError('party_size_invalid');
    }
    if (input.partySize > context.maxPartySize) {
      throw new ResponseRuleError('party_size_exceeded');
    }
  }

  for (const notes of [input.dietaryNotes, input.accessibilityNotes]) {
    if (notes != null && notes.length > MAX_NOTES_LENGTH) {
      throw new ResponseRuleError('notes_too_long');
    }
  }
}
