import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { seedViaApi } from './seed-e2e.ts';

/**
 * FR-018 / Princípio IV: WCAG 2.1 A e AA verificados na página REALMENTE renderizada, em
 * viewport de 320px (definido em playwright.config.ts).
 *
 * Limite conhecido e deliberado: axe-core captura tipicamente 30–40% dos problemas reais de
 * acessibilidade. Isto é o piso que impede regressão óbvia, não um atestado de conformidade.
 * Teclado e leitor de tela continuam sendo item de revisão manual (docs/architecture.md).
 */

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('acessibilidade das páginas de convidado', () => {
  test('a página de convite não tem violações A/AA', async ({ page, request }) => {
    const { token } = await seedViaApi(request);
    await page.goto(`/convite/${token}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(results.violations).toEqual([]);
  });

  test('a página inicial não tem violações A/AA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(results.violations).toEqual([]);
  });

  test('a página de erro de convite não tem violações A/AA', async ({ page }) => {
    await page.goto('/convite/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    await expect(page.getByRole('alert')).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();

    expect(results.violations).toEqual([]);
  });

  test('a página declara idioma e tem título', async ({ page, request }) => {
    const { token } = await seedViaApi(request);
    await page.goto(`/convite/${token}`);

    await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
    await expect(page).toHaveTitle(/.+/);
  });
});
