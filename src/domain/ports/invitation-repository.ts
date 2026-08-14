import type { RsvpStatus } from '../rsvp/response.ts';

/**
 * Port declarada pelo DOMÍNIO e implementada pela persistência (contracts/ports.md).
 *
 * A direção importa: `src/server/persistence/` importa daqui, nunca o contrário. Se a seta
 * se inverter, `eslint-plugin-boundaries` reprova `npm run verify`.
 *
 * Fechada de propósito: sem `findAll`, sem SQL arbitrário, sem objeto de critérios. Cada
 * método existe porque um fluxo nomeado o exige — método sem chamador é a generalidade
 * especulativa que o Princípio V manda remover na revisão.
 */

export interface InvitationAggregate {
  readonly invitationId: string;
  readonly guestName: string;
  readonly maxPartySize: number;
  readonly event: {
    readonly name: string;
    readonly startsAt: string;
    readonly rsvpDeadline: string;
  };
  readonly response: {
    readonly status: RsvpStatus;
    readonly partySize: number;
    readonly dietaryNotes: string | null;
    readonly accessibilityNotes: string | null;
    readonly submittedAt: string;
    readonly updatedAt: string;
  } | null;
}

export interface InvitationRepository {
  /**
   * Recebe o token CRU e faz o hash internamente — o domínio nunca vê `tokenHash` e o token
   * cru nunca chega ao banco.
   *
   * Devolve `null` para token ausente ou malformado. Não lança: "não encontrado" é um
   * resultado esperado do fluxo de convidado, não uma falha.
   */
  findByToken(token: string): Promise<InvitationAggregate | null>;
}

/*
 * Contratados e ainda NÃO implementados (contracts/ports.md). Ficam documentados aqui, e
 * não declarados na interface, para que a implementação atual não precise de stubs que
 * lançam — um método que existe e explode é pior que um método que não existe.
 *
 *   saveResponse(invitationId, submission): Promise<InvitationAggregate>
 *     Atômica: ler o convite, validar contra maxPartySize e rsvpDeadline, e gravar em UMA
 *     transação. A constituição não admite escrita parcial de RSVP.
 *
 *   listByEvent(eventId): Promise<InvitationAggregate[]>
 *     Exige autenticação de organizador na camada HTTP antes de existir.
 *
 *   purgeExpired(now): Promise<number>
 *     Anula os campos pessoais preservando status e partySize (data-model.md, purge()).
 */
