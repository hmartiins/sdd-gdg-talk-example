import { openDatabase, type Db } from '@server/persistence/db.ts';
import { generateInviteToken, hashInviteToken } from '@server/tokens/invite-token.ts';

/**
 * Semeadura para testes de contrato e E2E. Escreve direto no banco real — nenhum duplo de
 * teste substitui a persistência (Princípio II, FR-012).
 */

export interface SeededInvitation {
  readonly token: string;
  readonly invitationId: string;
  readonly eventId: string;
  readonly guestName: string;
  readonly guestEmail: string;
  readonly maxPartySize: number;
  readonly eventName: string;
  readonly startsAt: string;
  readonly rsvpDeadline: string;
}

export interface SeedOptions {
  readonly guestName?: string;
  readonly guestEmail?: string;
  readonly maxPartySize?: number;
  readonly eventName?: string;
  readonly startsAt?: string;
  readonly rsvpDeadline?: string;
}

export function seedInvitation(db: Db, options: SeedOptions = {}): SeededInvitation {
  const eventId = `evt_${Math.random().toString(36).slice(2, 12)}`;
  const invitationId = `inv_${Math.random().toString(36).slice(2, 12)}`;
  const token = generateInviteToken();

  const seeded: SeededInvitation = {
    token,
    invitationId,
    eventId,
    guestName: options.guestName ?? 'Ana Ribeiro',
    guestEmail: options.guestEmail ?? 'ana.ribeiro@example.test',
    maxPartySize: options.maxPartySize ?? 2,
    eventName: options.eventName ?? 'Casamento de Ana e Bruno',
    startsAt: options.startsAt ?? '2026-11-14T21:00:00Z',
    rsvpDeadline: options.rsvpDeadline ?? '2026-10-31T23:59:59Z',
  };

  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO event (id, name, starts_at, rsvp_deadline, retention_until, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    seeded.eventId,
    seeded.eventName,
    seeded.startsAt,
    seeded.rsvpDeadline,
    '2027-05-14T00:00:00Z',
    now,
  );

  db.prepare(
    `INSERT INTO invitation
       (id, event_id, token_hash, guest_name, guest_email, max_party_size, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    seeded.invitationId,
    seeded.eventId,
    hashInviteToken(token),
    seeded.guestName,
    seeded.guestEmail,
    seeded.maxPartySize,
    now,
  );

  return seeded;
}

/** Banco em memória, migrado, descartado ao fim do teste. */
export function openTestDatabase(): Db {
  return openDatabase({ file: ':memory:' });
}
