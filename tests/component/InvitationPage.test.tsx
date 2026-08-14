import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvitationView } from '@client/pages/InvitationPage.tsx';
import type { InvitationPageView } from '@shared/contracts/invitation.ts';

const view: InvitationPageView = {
  invitation: { guestName: 'Ana Ribeiro', maxPartySize: 2 },
  event: {
    name: 'Casamento de Ana e Bruno',
    startsAt: '2026-11-14T21:00:00Z',
    rsvpDeadline: '2026-10-31T23:59:59Z',
  },
  response: null,
};

describe('InvitationView', () => {
  it('mostra o nome do convidado e o nome do evento', () => {
    render(<InvitationView data={view} />);

    expect(screen.getByText(/Ana Ribeiro/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Casamento de Ana e Bruno/ }),
    ).toBeInTheDocument();
  });

  it('tem exatamente um heading de nível 1', () => {
    render(<InvitationView data={view} />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('mostra a capacidade do convite', () => {
    render(<InvitationView data={view} />);

    expect(screen.getByText(/2 pessoas/)).toBeInTheDocument();
  });

  it('informa que ainda não há resposta registrada', () => {
    render(<InvitationView data={view} />);

    expect(screen.getByText(/ainda não respondeu/i)).toBeInTheDocument();
  });

  it('exibe a data do evento em formato legível, não ISO cru', () => {
    render(<InvitationView data={view} />);

    expect(screen.queryByText(/2026-11-14T21:00:00Z/)).not.toBeInTheDocument();
    expect(screen.getByText(/novembro/i)).toBeInTheDocument();
  });

  it('usa elemento <time> com datetime legível por máquina', () => {
    const { container } = render(<InvitationView data={view} />);

    const times = container.querySelectorAll('time[datetime]');
    expect(times.length).toBeGreaterThan(0);
  });

  it('mostra estado de erro sem revelar detalhe interno', () => {
    render(<InvitationView data={null} error="not_found" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/sqlite|stack|undefined/i)).not.toBeInTheDocument();
  });
});
