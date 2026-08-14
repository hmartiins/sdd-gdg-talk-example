import type { FastifyInstance } from 'fastify';
import { isDatabaseHealthy, type Db } from '../persistence/db.ts';
import type { HealthView } from '@shared/contracts/invitation.ts';
import { healthResponseSchema } from './schemas.ts';

/**
 * Vitalidade do processo e do banco. Usada pelo Playwright para saber quando o servidor
 * subiu. Deliberadamente sem versão, caminho de arquivo ou variável de ambiente na resposta:
 * um endpoint de saúde aberto não deve virar fonte de reconhecimento.
 */
export function registerHealthRoute(app: FastifyInstance, db: Db): void {
  app.get(
    '/api/health',
    { schema: { response: healthResponseSchema } },
    async (_request, reply) => {
      const healthy = isDatabaseHealthy(db);

      const body: HealthView = healthy
        ? { status: 'ok', checks: { database: 'ok' } }
        : { status: 'degraded', checks: { database: 'unavailable' } };

      return reply.status(healthy ? 200 : 503).send(body);
    },
  );
}
