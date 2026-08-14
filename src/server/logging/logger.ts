/**
 * Ponto ÚNICO de log do servidor.
 *
 * O Princípio III proíbe dado pessoal de convidado em log. Isso só é aplicável se existir um
 * único ponto de saída — com `console.log` espalhado não há onde redigir. O ESLint proíbe
 * `console.*` em `src/server/` justamente para forçar todo log a passar por aqui.
 *
 * Duas camadas de proteção, porque uma não basta:
 *  1. `redact` cobre o caso comum (objeto logado com campo pessoal).
 *  2. `tests/contract/logging-privacy.contract.test.ts` inspeciona a saída real e pega o
 *     caso que a redação não pega: interpolação de string.
 */

/**
 * Caminhos redigidos. Tokens de convite entram aqui como dado sensível: um token em log é
 * acesso permanente ao convite (research.md R-010).
 */
export const REDACTED_PATHS = [
  'name',
  'guestName',
  'email',
  'guestEmail',
  'phone',
  'guestPhone',
  'dietaryNotes',
  'accessibilityNotes',
  'token',
  'inviteToken',
  '*.name',
  '*.guestName',
  '*.email',
  '*.guestEmail',
  '*.phone',
  '*.dietaryNotes',
  '*.accessibilityNotes',
  '*.token',
  'req.params.token',
  'req.headers.authorization',
  'req.headers.cookie',
] as const;

export const REDACTED_CENSOR = '[REDACTED]';

/**
 * Configuração de logger passada ao Fastify. Não é um logger próprio: reusa o Pino que o
 * Fastify já traz, apenas com a redação e a serialização de requisição fixadas.
 */
export function loggerOptions(level = process.env['LOG_LEVEL'] ?? 'info') {
  return {
    level,
    redact: {
      paths: [...REDACTED_PATHS],
      censor: REDACTED_CENSOR,
    },
    serializers: {
      // O padrão do Fastify inclui a URL completa, que carrega o token de convite no
      // caminho. Serializamos apenas o que é seguro e útil para depurar.
      req(request: { method: string; routeOptions?: { url?: string }; url: string }) {
        return {
          method: request.method,
          // Rota registrada (`/api/invitations/:token`), não a URL concreta.
          route: request.routeOptions?.url ?? '(unrouted)',
        };
      },
    },
  };
}
