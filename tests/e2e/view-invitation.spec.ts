import { expect, test } from '@playwright/test';
import { seedViaApi, E2E_GUEST } from './seed-e2e.ts';

/**
 * Fluxo de convidado ponta a ponta: navegador real, servidor real, SQLite real. Nenhum
 * duplo de teste na camada de persistência (Princípio II).
 */

test.describe('visualizar convite', () => {
  test('convidado abre o link e vê seu convite', async ({ page, request }) => {
    const { token } = await seedViaApi(request);

    await page.goto(`/convite/${token}`);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(E2E_GUEST.eventName);
    await expect(page.getByText(E2E_GUEST.guestName)).toBeVisible();
  });

  test('token inexistente mostra mensagem amigável, sem detalhe interno', async ({ page }) => {
    await page.goto('/convite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/sqlite|stack|at Object/i);
  });

  test('a página é utilizável a 320px sem rolagem horizontal', async ({ page, request }) => {
    const { token } = await seedViaApi(request);

    await page.goto(`/convite/${token}`);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test('o token não aparece no conteúdo renderizado da página', async ({ page, request }) => {
    const { token } = await seedViaApi(request);

    await page.goto(`/convite/${token}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain(token);
  });
});
