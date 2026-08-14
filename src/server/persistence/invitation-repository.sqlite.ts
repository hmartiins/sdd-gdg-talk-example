import type {
  InvitationAggregate,
  InvitationRepository,
} from '@domain/ports/invitation-repository.ts';
import type { Db } from './db.ts';
import { hashInviteToken, isValidInviteTokenFormat } from '../tokens/invite-token.ts';

interface InvitationRow {
  readonly id: string;
  readonly guest_name: string;
  readonly max_party_size: number;
  readonly event_name: string;
  readonly starts_at: string;
  readonly rsvp_deadline: string;
}

/**
 * Implementação SQLite da port declarada pelo domínio.
 *
 * SQL escrito à mão em vez de ORM (research.md R-004): o acesso a dados fica confinado a
 * este arquivo, então trocar por um ORM depois seria uma mudança local.
 */
export class SqliteInvitationRepository implements InvitationRepository {
  constructor(private readonly db: Db) {}

  async findByToken(token: string): Promise<InvitationAggregate | null> {
    // Token malformado é "não encontrado", não erro: distinguir os dois entregaria um
    // oráculo de enumeração ao chamador (contracts/http-api.md).
    if (!isValidInviteTokenFormat(token)) {
      return null;
    }

    const row = this.db
      .prepare<[Buffer], InvitationRow>(
        `SELECT i.id,
                i.guest_name,
                i.max_party_size,
                e.name          AS event_name,
                e.starts_at,
                e.rsvp_deadline
           FROM invitation i
           JOIN event e ON e.id = i.event_id
          WHERE i.token_hash = ?`,
      )
      .get(hashInviteToken(token));

    if (!row) {
      return null;
    }

    return {
      invitationId: row.id,
      guestName: row.guest_name,
      maxPartySize: row.max_party_size,
      event: {
        name: row.event_name,
        startsAt: row.starts_at,
        rsvpDeadline: row.rsvp_deadline,
      },
      // A tabela `rsvp_response` pertence à feature que implementar o envio de RSVP
      // (research.md R-011); até lá, todo convite é lido como "sem resposta".
      response: null,
    };
  }
}
