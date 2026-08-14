import { useEffect, useState } from 'react';
import type { InvitationPageView } from '@shared/contracts/invitation.ts';
import { fetchInvitation } from '../api/client.ts';

/**
 * Página de convite.
 *
 * Marcação HTML nativa e semântica (`main`, `h1`, `dl`, `time`), sem widget customizado:
 * o Princípio IV exige que o fluxo seja completável sem interação dependente de ponteiro, e
 * a forma mais barata de garantir isso é não construir controles próprios.
 */

type LoadError = 'not_found' | 'unavailable';

const formatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'UTC',
});

/** Componente de apresentação puro — é o que os testes de componente exercitam. */
export function InvitationView({
  data,
  error,
}: {
  data: InvitationPageView | null;
  error?: LoadError;
}) {
  if (error) {
    return (
      <main>
        <h1>Convite</h1>
        {/* role="alert" para que o erro seja anunciado por leitor de tela (Princípio IV) */}
        <p role="alert">
          {error === 'not_found'
            ? 'Não foi possível encontrar este convite. Verifique o link que você recebeu.'
            : 'Não conseguimos carregar o convite agora. Tente novamente em instantes.'}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main>
        <h1>Convite</h1>
        <p aria-live="polite">Carregando o convite…</p>
      </main>
    );
  }

  const { invitation, event, response } = data;

  return (
    <main>
      <h1>{event.name}</h1>

      <p>
        Olá, <strong>{invitation.guestName}</strong>. Você está convidada ou convidado para
        este evento.
      </p>

      <dl>
        <div>
          <dt>Quando</dt>
          <dd>
            <time dateTime={event.startsAt}>{formatter.format(new Date(event.startsAt))}</time>
          </dd>
        </div>
        <div>
          <dt>Responder até</dt>
          <dd>
            <time dateTime={event.rsvpDeadline}>
              {formatter.format(new Date(event.rsvpDeadline))}
            </time>
          </dd>
        </div>
        <div>
          <dt>Seu convite vale para</dt>
          <dd>
            {invitation.maxPartySize} {invitation.maxPartySize === 1 ? 'pessoa' : 'pessoas'}
          </dd>
        </div>
      </dl>

      {response ? (
        <p>
          Sua resposta registrada:{' '}
          {response.status === 'attending'
            ? `presença confirmada para ${response.partySize} ${
                response.partySize === 1 ? 'pessoa' : 'pessoas'
              }`
            : 'não poderá comparecer'}
          .
        </p>
      ) : (
        <p>Você ainda não respondeu a este convite.</p>
      )}
    </main>
  );
}

export function InvitationPage({ token }: { token: string }) {
  const [data, setData] = useState<InvitationPageView | null>(null);
  const [error, setError] = useState<LoadError | undefined>(undefined);

  useEffect(() => {
    let active = true;

    void fetchInvitation(token).then((result) => {
      if (!active) return;
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    });

    return () => {
      active = false;
    };
  }, [token]);

  return <InvitationView data={data} {...(error ? { error } : {})} />;
}
