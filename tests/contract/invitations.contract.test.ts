import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@server/app.ts';
import type { Db } from '@server/persistence/db.ts';
import { generateInviteToken } from '@server/tokens/invite-token.ts';
import type { ApiError, InvitationPageView } from '@shared/contracts/invitation.ts';
import { openTestDatabase, seedInvitation } from '../helpers/seed.ts';

let app: FastifyInstance | undefined;
let db: Db | undefined;

afterEach(async () => {
  await app?.close();
  db?.close();
  app = undefined;
  db = undefined;
});

async function start() {
  db = openTestDatabase();
  const seeded = seedInvitation(db);
  app = await buildApp({ db });
  return { app, seeded };
}

describe('GET /api/invitations/:token', () => {
  it('retorna 200 com o esquema exato do contrato', async () => {
    const { app: server, seeded } = await start();

    const response = await server.inject({
      method: 'GET',
      url: `/api/invitations/${seeded.token}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<InvitationPageView>()).toEqual({
      invitation: { guestName: seeded.guestName, maxPartySize: seeded.maxPartySize },
      event: {
        name: seeded.eventName,
        startsAt: seeded.startsAt,
        rsvpDeadline: seeded.rsvpDeadline,
      },
      response: null,
    });
  });

  it('não expõe identificadores internos nem o token', async () => {
    const { app: server, seeded } = await start();

    const response = await server.inject({
      method: 'GET',
      url: `/api/invitations/${seeded.token}`,
    });
    const body = response.json<InvitationPageView>();

    // Asserção sobre o CONJUNTO de chaves, não sobre as presentes: um campo acrescentado
    // por descuido reprova aqui, que é o ponto (contracts/http-api.md).
    expect(Object.keys(body).sort()).toEqual(['event', 'invitation', 'response']);
    expect(Object.keys(body.invitation).sort()).toEqual(['guestName', 'maxPartySize']);
    expect(Object.keys(body.event).sort()).toEqual(['name', 'rsvpDeadline', 'startsAt']);

    expect(response.body).not.toContain(seeded.invitationId);
    expect(response.body).not.toContain(seeded.eventId);
    expect(response.body).not.toContain(seeded.token);
    expect(response.body).not.toContain(seeded.guestEmail);
  });

  it('não vaza nada sobre outros convidados do mesmo evento', async () => {
    const { app: server, seeded } = await start();
    seedInvitation(db!, { guestName: 'Bruno Costa', guestEmail: 'bruno@example.test' });

    const response = await server.inject({
      method: 'GET',
      url: `/api/invitations/${seeded.token}`,
    });

    expect(response.body).not.toContain('Bruno Costa');
    expect(response.body).not.toContain('bruno@example.test');
  });

  it('retorna 404 invitation_not_found para token inexistente', async () => {
    const { app: server } = await start();

    const response = await server.inject({
      method: 'GET',
      url: `/api/invitations/${generateInviteToken()}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<ApiError>().error.code).toBe('invitation_not_found');
  });

  it('retorna para token malformado o MESMO corpo do caso inexistente', async () => {
    const { app: server } = await start();

    const missing = await server.inject({
      method: 'GET',
      url: `/api/invitations/${generateInviteToken()}`,
    });
    const malformed = await server.inject({ method: 'GET', url: '/api/invitations/curto' });

    // Distinguir os dois casos entregaria um oráculo de enumeração de tokens.
    expect(malformed.statusCode).toBe(missing.statusCode);
    expect(malformed.json()).toEqual(missing.json());
  });

  it('respostas com dado pessoal trazem Cache-Control: no-store', async () => {
    const { app: server, seeded } = await start();

    const response = await server.inject({
      method: 'GET',
      url: `/api/invitations/${seeded.token}`,
    });

    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('a mensagem de erro não revela detalhe interno', async () => {
    const { app: server } = await start();

    const response = await server.inject({ method: 'GET', url: '/api/invitations/curto' });

    expect(response.body).not.toMatch(/sqlite|select|\/Users\/|at Object\.|stack/i);
  });

  it('a rota de organizador NÃO está registrada enquanto não houver autenticação', async () => {
    const { app: server, seeded } = await start();

    const response = await server.inject({
      method: 'GET',
      url: `/api/events/${seeded.eventId}/responses`,
    });

    // Registrar esta rota sem autenticação exporia todos os dados pessoais do evento a
    // quem souber um eventId (plan.md, re-avaliação pós-Fase 1).
    expect(response.statusCode).toBe(404);
  });
});
