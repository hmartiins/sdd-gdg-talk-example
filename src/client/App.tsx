import { InvitationPage } from './pages/InvitationPage.tsx';

/**
 * Roteamento mínimo: `/convite/:token` mostra o convite, qualquer outra coisa mostra a
 * página inicial. Sem biblioteca de rotas — há duas rotas, e o Princípio V manda não
 * introduzir uma dependência sem requisito que a sustente.
 */
export function App() {
  const match = /^\/convite\/([A-Za-z0-9_-]+)\/?$/.exec(window.location.pathname);
  const token = match?.[1];

  if (token) {
    return <InvitationPage token={token} />;
  }

  return (
    <main>
      <h1>RSVP</h1>
      <p>Abra o link do convite que você recebeu para confirmar sua presença.</p>
    </main>
  );
}
