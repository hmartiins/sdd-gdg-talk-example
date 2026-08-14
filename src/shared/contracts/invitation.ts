/**
 * Tipos do contrato HTTP entre cliente e servidor.
 *
 * Esta é a ÚNICA forma de o cliente conhecer o formato das respostas: `src/client/` nunca
 * importa nada de `src/server/`. Derivado de
 * `specs/001-project-scaffolding/contracts/http-api.md` — mudar um destes tipos é mudar o
 * contrato, e exige atualizar o teste de contrato no mesmo conjunto de alterações.
 *
 * Nenhum identificador interno (`id`, `eventId`, `token`, `tokenHash`) aparece aqui, e isso
 * é deliberado: o convidado não deve poder inferir nada sobre os demais convidados
 * (Princípio III).
 */

export type RsvpStatus = 'attending' | 'not_attending';

export interface InvitationView {
  readonly guestName: string;
  readonly maxPartySize: number;
}

export interface EventView {
  readonly name: string;
  /** ISO-8601 UTC */
  readonly startsAt: string;
  /** ISO-8601 UTC */
  readonly rsvpDeadline: string;
}

export interface RsvpResponseView {
  readonly status: RsvpStatus;
  readonly partySize: number;
  readonly dietaryNotes: string | null;
  readonly accessibilityNotes: string | null;
  /** ISO-8601 UTC */
  readonly submittedAt: string;
  /** ISO-8601 UTC */
  readonly updatedAt: string;
}

export interface InvitationPageView {
  readonly invitation: InvitationView;
  readonly event: EventView;
  /** `null` enquanto o convidado não tiver respondido. */
  readonly response: RsvpResponseView | null;
}

/**
 * Corpo de `PUT /api/invitations/:token/response`.
 * Contratado, ainda não implementado — ver contracts/README.md.
 */
export interface RsvpSubmission {
  readonly status: RsvpStatus;
  readonly partySize: number;
  readonly dietaryNotes?: string | null;
  readonly accessibilityNotes?: string | null;
}

export type ApiErrorCode =
  | 'invitation_not_found'
  | 'validation_failed'
  | 'party_size_exceeded'
  | 'rsvp_deadline_passed'
  | 'internal_error';

export interface ApiError {
  readonly error: {
    readonly code: ApiErrorCode;
    /**
     * Texto voltado ao usuário final. NUNCA contém dado pessoal, valor de token, detalhe de
     * banco, caminho de arquivo ou stack trace (Princípio III).
     */
    readonly message: string;
  };
}

export interface HealthView {
  readonly status: 'ok' | 'degraded';
  readonly checks: { readonly database: 'ok' | 'unavailable' };
}
