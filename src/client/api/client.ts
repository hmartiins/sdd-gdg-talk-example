import type { ApiError, InvitationPageView } from '@shared/contracts/invitation.ts';

/**
 * Cliente HTTP. Tipado exclusivamente por `@shared/contracts` — o cliente nunca importa
 * nada de `src/server/` (regra fiscalizada por `eslint-plugin-boundaries`).
 *
 * Caminhos relativos sempre: em desenvolvimento o Vite faz proxy de `/api`, em produção o
 * mesmo processo serve tudo. Não existe URL de API configurável porque não existe segunda
 * origem.
 */

export type FetchInvitationResult =
  | { readonly ok: true; readonly data: InvitationPageView }
  | { readonly ok: false; readonly error: 'not_found' | 'unavailable' };

export async function fetchInvitation(token: string): Promise<FetchInvitationResult> {
  let response: Response;

  try {
    response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
      headers: { accept: 'application/json' },
    });
  } catch {
    // Falha de rede: nada a expor além de "indisponível".
    return { ok: false, error: 'unavailable' };
  }

  if (response.status === 404) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    return {
      ok: false,
      error: body?.error.code === 'invitation_not_found' ? 'not_found' : 'unavailable',
    };
  }

  if (!response.ok) {
    return { ok: false, error: 'unavailable' };
  }

  return { ok: true, data: (await response.json()) as InvitationPageView };
}
