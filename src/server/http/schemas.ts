/**
 * JSON Schemas do contrato HTTP.
 *
 * Validamos requisição E resposta (contracts/README.md, regra 1). Validar só a entrada
 * deixaria a resposta livre para regredir em silêncio — exatamente o que o Princípio II
 * proíbe. `additionalProperties: false` nas respostas é o que faz um campo acrescentado por
 * descuido — um `id`, um `token` — ser removido em vez de vazar.
 */

export const INVITE_TOKEN_PATTERN_SOURCE = '^[A-Za-z0-9_-]{43}$';

export const errorSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
} as const;

export const healthResponseSchema = {
  200: {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'checks'],
    properties: {
      status: { type: 'string', enum: ['ok'] },
      checks: {
        type: 'object',
        additionalProperties: false,
        required: ['database'],
        properties: { database: { type: 'string', enum: ['ok'] } },
      },
    },
  },
  503: {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'checks'],
    properties: {
      status: { type: 'string', enum: ['degraded'] },
      checks: {
        type: 'object',
        additionalProperties: false,
        required: ['database'],
        properties: { database: { type: 'string', enum: ['unavailable'] } },
      },
    },
  },
} as const;

export const invitationParamsSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    // Sem `pattern` aqui de propósito: um token malformado deve produzir 404, e não o 400
    // que a validação de esquema geraria. Os dois casos precisam ser indistinguíveis.
    token: { type: 'string' },
  },
} as const;

export const invitationResponseSchema = {
  200: {
    type: 'object',
    additionalProperties: false,
    required: ['invitation', 'event', 'response'],
    properties: {
      invitation: {
        type: 'object',
        additionalProperties: false,
        required: ['guestName', 'maxPartySize'],
        properties: {
          guestName: { type: 'string' },
          maxPartySize: { type: 'integer' },
        },
      },
      event: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'startsAt', 'rsvpDeadline'],
        properties: {
          name: { type: 'string' },
          startsAt: { type: 'string' },
          rsvpDeadline: { type: 'string' },
        },
      },
      response: {
        type: ['object', 'null'],
        additionalProperties: false,
        required: ['status', 'partySize', 'dietaryNotes', 'accessibilityNotes', 'submittedAt', 'updatedAt'],
        properties: {
          status: { type: 'string', enum: ['attending', 'not_attending'] },
          partySize: { type: 'integer' },
          dietaryNotes: { type: ['string', 'null'] },
          accessibilityNotes: { type: ['string', 'null'] },
          submittedAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  },
  404: errorSchema,
} as const;
