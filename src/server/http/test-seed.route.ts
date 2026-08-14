import type { FastifyInstance } from 'fastify';
import type { Db } from '../persistence/db.ts';
import { generateInviteToken, hashInviteToken } from '../tokens/invite-token.ts';

/**
 * Rota de semeadura para os testes E2E.
 *
 * Registrada SOMENTE quando `E2E_SEED=1`, variável definida exclusivamente pelo `webServer`
 * do Playwright. Ela cria convites sem autenticação — em produção seria um buraco, não um
 * utilitário. Por isso o registro é condicional, e não "protegido por convenção".
 */

interface SeedBody {
  readonly guestName?: string;
  readonly guestEmail?: string;
  readonly eventName?: string;
}

export function isSeedRouteEnabled(): boolean {
  return process.env['E2E_SEED'] === '1';
}

export function registerTestSeedRoute(app: FastifyInstance, db: Db): void {
  app.post<{ Body: SeedBody }>('/api/test/seed', async (request, reply) => {
    const token = generateInviteToken();
    const eventId = `evt_${Math.random().toString(36).slice(2, 12)}`;
    const invitationId = `inv_${Math.random().toString(36).slice(2, 12)}`;
    const now = new Date().toISOString();

    const seed = db.transaction(() => {
      db.prepare(
        `INSERT INTO event (id, name, starts_at, rsvp_deadline, retention_until, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        eventId,
        request.body?.eventName ?? 'Casamento de Ana e Bruno',
        '2026-11-14T21:00:00Z',
        '2026-10-31T23:59:59Z',
        '2027-05-14T00:00:00Z',
        now,
      );

      db.prepare(
        `INSERT INTO invitation
           (id, event_id, token_hash, guest_name, guest_email, max_party_size, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        invitationId,
        eventId,
        hashInviteToken(token),
        request.body?.guestName ?? 'Ana Ribeiro',
        request.body?.guestEmail ?? 'ana.ribeiro@example.test',
        2,
        now,
      );
    });

    seed();

    return reply.status(201).send({ token });
  });
}
