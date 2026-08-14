import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@server/app.ts';
import { openDatabase } from '@server/persistence/db.ts';
import type { HealthView } from '@shared/contracts/invitation.ts';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /api/health', () => {
  it('retorna 200 e status ok quando as migrações estão aplicadas', async () => {
    const db = openDatabase({ file: ':memory:' });
    app = await buildApp({ db });

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json<HealthView>()).toEqual({
      status: 'ok',
      checks: { database: 'ok' },
    });
  });

  it('retorna 503 e status degraded quando o banco está indisponível', async () => {
    const db = openDatabase({ file: ':memory:' });
    app = await buildApp({ db });
    db.close();

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json<HealthView>()).toEqual({
      status: 'degraded',
      checks: { database: 'unavailable' },
    });
  });

  it('não expõe versão, caminho de banco nem variáveis de ambiente', async () => {
    const db = openDatabase({ file: ':memory:' });
    app = await buildApp({ db });

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    // Asserção sobre o conjunto de chaves, não sobre as presentes: uma chave nova
    // acrescentada por descuido deve reprovar este teste.
    expect(Object.keys(response.json<HealthView>()).sort()).toEqual(['checks', 'status']);
    expect(response.body).not.toMatch(/sqlite|\/Users\/|\/home\/|version/i);
  });
});
