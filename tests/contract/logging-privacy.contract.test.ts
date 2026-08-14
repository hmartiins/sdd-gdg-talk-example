import { afterEach, describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@server/app.ts';
import type { Db } from '@server/persistence/db.ts';
import { openTestDatabase, seedInvitation } from '../helpers/seed.ts';

/**
 * SC-008 / FR-022: nenhum dado pessoal de convidado na saída de log.
 *
 * A redação do Pino cobre o caso comum (objeto logado). Este teste cobre o que ela NÃO pega
 * — interpolação de string — porque inspeciona a saída real, não a configuração. As duas
 * camadas juntas é o que transforma o Princípio III em asserção.
 */

class CapturingStream extends Writable {
  chunks: string[] = [];

  override _write(chunk: Buffer, _enc: BufferEncoding, done: () => void): void {
    this.chunks.push(chunk.toString('utf8'));
    done();
  }

  get text(): string {
    return this.chunks.join('');
  }
}

const PERSONAL = {
  guestName: 'Zulmira Nepomuceno',
  guestEmail: 'zulmira.nepomuceno@example.test',
};

let app: FastifyInstance | undefined;
let db: Db | undefined;

afterEach(async () => {
  await app?.close();
  db?.close();
  app = undefined;
  db = undefined;
});

async function exercise(): Promise<{ log: string; token: string }> {
  const stream = new CapturingStream();
  db = openTestDatabase();
  const seeded = seedInvitation(db, PERSONAL);
  app = await buildApp({ db, loggerStream: stream, logLevel: 'trace' });

  await app.inject({ method: 'GET', url: `/api/invitations/${seeded.token}` });
  await app.inject({ method: 'GET', url: '/api/invitations/token-invalido' });
  await app.inject({ method: 'GET', url: '/api/health' });
  await app.inject({ method: 'GET', url: '/rota/inexistente' });

  return { log: stream.text, token: seeded.token };
}

describe('privacidade na saída de log', () => {
  it('não registra o nome do convidado', async () => {
    const { log } = await exercise();

    expect(log).not.toContain(PERSONAL.guestName);
  });

  it('não registra o e-mail do convidado', async () => {
    const { log } = await exercise();

    expect(log).not.toContain(PERSONAL.guestEmail);
    expect(log).not.toContain('zulmira');
  });

  it('não registra o token de convite', async () => {
    const { log, token } = await exercise();

    // Um token em log é acesso permanente ao convite (research.md R-010).
    expect(log).not.toContain(token);
  });

  it('registra a rota, e não a URL concreta com o token', async () => {
    const { log, token } = await exercise();

    expect(log).not.toContain(`/api/invitations/${token}`);
  });

  it('ainda assim produz log útil (o teste não passa por log vazio)', async () => {
    const { log } = await exercise();

    expect(log.length).toBeGreaterThan(0);
    expect(log).toContain('/api/invitations/:token');
  });

  it('redige campos pessoais logados explicitamente como objeto', async () => {
    const stream = new CapturingStream();
    db = openTestDatabase();
    app = await buildApp({ db, loggerStream: stream, logLevel: 'trace' });

    app.log.info({ guestEmail: PERSONAL.guestEmail, guestName: PERSONAL.guestName }, 'probe');

    expect(stream.text).not.toContain(PERSONAL.guestEmail);
    expect(stream.text).toContain('[REDACTED]');
  });
});
