/**
 * Regras de convite. Puro: sem I/O, sem React, sem `node:*`.
 *
 * O ESLint reprova qualquer import de `server`, `client` ou `node:*` a partir daqui
 * (eslint.config.js, `eslint-plugin-boundaries`). Essa restrição é o que permite testar
 * estas regras em milissegundos, sem subir banco.
 */

export const MAX_GUEST_NAME_LENGTH = 200;
export const MAX_GUEST_EMAIL_LENGTH = 320;
export const MIN_PARTY_SIZE = 1;
export const MAX_PARTY_SIZE = 20;

export type InvitationRuleCode =
  | 'guest_name_required'
  | 'guest_name_too_long'
  | 'guest_email_invalid'
  | 'guest_email_too_long'
  | 'max_party_size_out_of_range';

/**
 * As mensagens NUNCA incluem o valor rejeitado: um erro de validação que ecoa o e-mail do
 * convidado acaba em log ou em tela de erro, e o Princípio III proíbe as duas coisas.
 */
export class InvitationRuleError extends Error {
  constructor(readonly code: InvitationRuleCode) {
    super(`Convite inválido: ${code}`);
    this.name = 'InvitationRuleError';
  }
}

export interface InvitationInput {
  readonly guestName: string;
  readonly guestEmail?: string | null;
  readonly maxPartySize: number;
}

export interface EventTiming {
  readonly startsAt: Date;
  readonly rsvpDeadline: Date;
}

/** Validação de formato deliberadamente frouxa: aceitar é barato, rejeitar um endereço
 *  válido custa um convidado. A verificação real é o e-mail chegar. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertValidInvitation(input: InvitationInput): void {
  const name = input.guestName.trim();

  if (name.length === 0) {
    throw new InvitationRuleError('guest_name_required');
  }
  if (input.guestName.length > MAX_GUEST_NAME_LENGTH) {
    throw new InvitationRuleError('guest_name_too_long');
  }

  if (input.guestEmail != null) {
    if (input.guestEmail.length > MAX_GUEST_EMAIL_LENGTH) {
      throw new InvitationRuleError('guest_email_too_long');
    }
    if (!EMAIL_SHAPE.test(input.guestEmail)) {
      throw new InvitationRuleError('guest_email_invalid');
    }
  }

  if (
    !Number.isInteger(input.maxPartySize) ||
    input.maxPartySize < MIN_PARTY_SIZE ||
    input.maxPartySize > MAX_PARTY_SIZE
  ) {
    throw new InvitationRuleError('max_party_size_out_of_range');
  }
}

export function isRsvpOpen(timing: EventTiming, now: Date): boolean {
  return now.getTime() < timing.rsvpDeadline.getTime();
}
