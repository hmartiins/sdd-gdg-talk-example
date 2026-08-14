import type { APIRequestContext } from '@playwright/test';

/**
 * Semeadura para E2E.
 *
 * A rota `POST /api/test/seed` só existe quando `E2E_SEED=1`, definido exclusivamente pelo
 * `webServer` do Playwright. Em produção ela não é registrada — uma rota capaz de criar
 * convites arbitrários sem autenticação seria um buraco, não um utilitário.
 */

export const E2E_GUEST = {
  guestName: 'Ana Ribeiro',
  guestEmail: 'ana.ribeiro@example.test',
  eventName: 'Casamento de Ana e Bruno',
} as const;

export interface SeededE2eInvitation {
  readonly token: string;
}

export async function seedViaApi(request: APIRequestContext): Promise<SeededE2eInvitation> {
  const response = await request.post('/api/test/seed', { data: E2E_GUEST });

  if (!response.ok()) {
    throw new Error(
      `Semeadura E2E falhou (${response.status()}). A rota de seed só existe com E2E_SEED=1.`,
    );
  }

  return (await response.json()) as SeededE2eInvitation;
}
