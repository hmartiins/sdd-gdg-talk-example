import type { FastifyInstance } from 'fastify';
import type { InvitationRepository } from '@domain/ports/invitation-repository.ts';
import type { ApiError, InvitationPageView } from '@shared/contracts/invitation.ts';
import { invitationParamsSchema, invitationResponseSchema } from './schemas.ts';

const notFound: ApiError = {
  error: {
    code: 'invitation_not_found',
    message: 'Não foi possível encontrar este convite.',
  },
};

export function registerInvitationRoutes(
  app: FastifyInstance,
  invitations: InvitationRepository,
): void {
  app.get<{ Params: { token: string } }>(
    '/api/invitations/:token',
    { schema: { params: invitationParamsSchema, response: invitationResponseSchema } },
    async (request, reply) => {
      const aggregate = await invitations.findByToken(request.params.token);

      if (!aggregate) {
        // Token inexistente e token malformado produzem exatamente esta resposta. A
        // distinção não é observável de fora (contracts/http-api.md).
        return reply.status(404).send(notFound);
      }

      const body: InvitationPageView = {
        invitation: {
          guestName: aggregate.guestName,
          maxPartySize: aggregate.maxPartySize,
        },
        event: aggregate.event,
        response: aggregate.response,
      };

      // A resposta carrega dado pessoal: não deve ser guardada por navegador nem por
      // intermediário (Princípio III).
      return reply.header('cache-control', 'no-store').status(200).send(body);
    },
  );
}
