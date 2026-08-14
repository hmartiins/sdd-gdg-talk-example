import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import type { Db } from './persistence/db.ts';
import { loggerOptions } from './logging/logger.ts';
import { registerHealthRoute } from './http/health.route.ts';
import { registerInvitationRoutes } from './http/invitations.route.ts';
import { isSeedRouteEnabled, registerTestSeedRoute } from './http/test-seed.route.ts';
import { SqliteInvitationRepository } from './persistence/invitation-repository.sqlite.ts';
import type { ApiError } from '@shared/contracts/invitation.ts';

export interface BuildAppOptions {
  readonly db: Db;
  /** Diretório do bundle do cliente. Ausente em desenvolvimento — lá quem serve é o Vite. */
  readonly clientDist?: string;
  /** Destino alternativo do log — usado pelo teste de privacidade para inspecionar a saída. */
  readonly loggerStream?: NodeJS.WritableStream;
  readonly logLevel?: string;
}

/**
 * Compõe a instância Fastify. Exportada como função para que os testes de contrato usem
 * `app.inject()` — pipeline HTTP completo, sem abrir socket (research.md R-005).
 */
export async function buildApp({
  db,
  clientDist,
  loggerStream,
  logLevel,
}: BuildAppOptions): Promise<FastifyInstance> {
  const baseLogger = loggerOptions(logLevel);

  const app = Fastify({
    logger: loggerStream ? { ...baseLogger, stream: loggerStream } : baseLogger,
  });

  const invitations = new SqliteInvitationRepository(db);

  registerHealthRoute(app, db);
  registerInvitationRoutes(app, invitations);

  if (isSeedRouteEnabled()) {
    registerTestSeedRoute(app, db);
  }

  if (clientDist) {
    await app.register(fastifyStatic, { root: clientDist });
  }

  // Nenhuma resposta de erro vaza detalhe interno: mensagem genérica para o cliente, causa
  // completa apenas no log (que por sua vez é redigido). Princípio III + contracts/http-api.md.
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'unhandled_request_error');

    const status = error.statusCode ?? 500;

    if (status >= 500) {
      const body: ApiError = {
        error: { code: 'internal_error', message: 'Algo deu errado. Tente novamente.' },
      };
      return reply.status(500).send(body);
    }

    const body: ApiError = {
      error: { code: 'validation_failed', message: 'Requisição inválida.' },
    };
    return reply.status(status).send(body);
  });

  // Único ponto de tratamento de rota inexistente — registrar dois na mesma instância é erro
  // de inicialização no Fastify.
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
      const body: ApiError = {
        error: {
          code: 'invitation_not_found',
          message: 'Não foi possível encontrar este recurso.',
        },
      };
      return reply.status(404).send(body);
    }

    if (clientDist) {
      // SPA: qualquer rota não-API devolve o index e o roteamento acontece no cliente.
      return reply.sendFile('index.html');
    }

    return reply.status(404).send({
      error: { code: 'invitation_not_found', message: 'Página não encontrada.' },
    } satisfies ApiError);
  });

  return app;
}
