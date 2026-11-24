import { expect, test } from '@playwright/test';
import { loginAsUser, signupNewUser } from './helpers';

test.use({
  channel: process.env.E2E_CHROMIUM_CHANNEL,
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
});

test('retoma, paga e cancela o mesmo ingresso pelo histórico web', async ({ page }, testInfo) => {
  if (process.env.CINEMAX_E2E_ISOLATED !== '1') {
    throw new Error('Use apenas a API e o banco descartáveis para este teste.');
  }
  test.setTimeout(60_000);
  const movieId = Number(process.env.E2E_KAN26_MOVIE_ID);
  expect(movieId).toBeGreaterThan(0);
  const catalogPath = '/produtos?filme=' + movieId;
  const browserOrigin = new URL(String(testInfo.project.use.baseURL)).origin;
  await page.route('**/*', (route) =>
    new URL(route.request().url()).origin === browserOrigin ? route.continue() : route.abort()
  );

  const cadastro = page.waitForResponse((r) => r.url().endsWith('/api/users') && r.request().method() === 'POST');
  const user = await signupNewUser(page, { nome: 'Bilheteria E2E' });
  expect((await cadastro).status()).toBe(201);
  await expect(page).toHaveURL(/\/login$/);
  await loginAsUser(page, user.email, user.senha);

  await page.goto(catalogPath);
  const grid = page.locator('.assentos-grid');
  const seat = (name: string) => grid.getByRole('button', { name, exact: true });
  await expect(grid.getByRole('button')).toHaveCount(48);
  for (const code of ['A1', 'A2', 'B1', 'B2']) await expect(seat(code)).toHaveCount(1);
  await page.locator('.tipo-ingresso-card').nth(1).getByRole('button', { name: '+', exact: true }).click();
  await seat('B1').focus();
  await page.keyboard.press('Space');
  await expect(seat('B1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.reserva-form input').nth(4)).toHaveValue('B1');

  const emission = page.waitForResponse((r) => r.url().endsWith('/api/ingressos/lote') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Ir para pagamento' }).click();
  const created = await emission;
  expect(created.status()).toBe(201);
  const [ticket] = await created.json();
  const id = Number(ticket.id_ingresso);
  expect(created.request().postDataJSON().id_assentos).toEqual([ticket.id_assento]);
  expect(ticket.tipo_ingresso).toBe('meia');
  expect(Number(ticket.valor_unitario)).toBe(12.51);
  await expect(page).toHaveURL(new RegExp('/pagamento\\?ingressos=' + id + '$'));
  await expect(page.getByRole('button', { name: 'Confirmar pagamento' })).toBeEnabled();

  await page.locator('button.usuario-trigger').click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await loginAsUser(page, user.email, user.senha);
  await page.getByRole('navigation', { name: 'Menu principal' }).getByRole('link', { name: 'Minhas Compras' }).click();

  const card = page.locator('.compra-item').filter({ hasText: '#' + id });
  await expect(card).toContainText('Pagamento pendente');
  await expect(card).toContainText('B1');
  await card.getByRole('link', { name: 'Continuar pagamento' }).click();
  await page.reload();
  await expect(page.getByText('R$ 12.51')).toBeVisible();
  await expect(page.locator('.pagamento-resumo')).toContainText('B1');

  const payment = page.waitForResponse((r) => r.url().endsWith('/api/pagamentos') && r.request().method() === 'POST');
  await page.getByRole('radio', { name: /Pix/ }).click();
  await page.getByRole('button', { name: 'Confirmar pagamento' }).click();
  const paid = await payment;
  expect(paid.status()).toBe(201);
  expect(paid.request().postDataJSON().id_ingresso).toBe(id);
  await expect(card).toContainText('Status: Pago');
  await expect(card.getByRole('link', { name: 'Continuar pagamento' })).toHaveCount(0);
  await page.goto(catalogPath);
  await expect(seat('B1')).toBeDisabled();
  await page.goto('/minhas-compras');

  const endpoint = '/api/ingressos/' + id + '/cancelar';
  page.once('dialog', (dialog) => dialog.dismiss());
  await card.getByRole('button', { name: 'Cancelar ingresso' }).click();
  await expect(card).toContainText('Status: Pago');
  const cancellation = page.waitForResponse((r) => r.url().endsWith(endpoint) && r.request().method() === 'PATCH');
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('B1');
    await dialog.accept();
  });
  await card.getByRole('button', { name: 'Cancelar ingresso' }).click();
  const cancelled = await cancellation;
  expect(cancelled.status()).toBe(200);
  await expect(card).toContainText('Status: Cancelado');
  await expect(card.getByRole('button', { name: 'Cancelar ingresso' })).toHaveCount(0);

  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('cineMaxSession') || '{}').token);
  const repeated = await page.request.patch(endpoint, { headers: { Authorization: 'Bearer ' + token } });
  expect(repeated.status()).toBe(409);
  await page.goto('/pagamento?ingressos=' + id);
  await expect(page.getByRole('alert')).toContainText('indisponível');
  await expect(page.getByRole('button', { name: 'Confirmar pagamento' })).toHaveCount(0);
  await page.goto(catalogPath);
  await expect(seat('B1')).toBeEnabled();

  await testInfo.attach('bilheteria-resultado', {
    body: JSON.stringify({
      ticketId: id, sessionId: ticket.id_sessao, seatId: ticket.id_assento, seat: 'B1',
      emission: created.status(), payment: paid.status(), cancel: cancelled.status(), repeatedCancel: repeated.status(),
    }, null, 2),
    contentType: 'application/json',
  });
});
