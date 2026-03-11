import { test, expect } from '@playwright/test';

test.describe('AccountPicker', () => {
  test('renders in default state', async ({ page }) => {
    await page.goto('/iframe.html?id=apps-accountpicker--default&viewMode=story');
    const combobox = page.getByRole('combobox');
    await expect(combobox).toBeVisible();
    await expect(combobox).toBeEnabled();
  });

  test('shows accounts when clicked', async ({ page }) => {
    await page.goto('/iframe.html?id=apps-accountpicker--default&viewMode=story');
    const combobox = page.getByRole('combobox');
    await combobox.click();

    await expect(page.getByText('Contoso Ltd')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Fabrikam Inc')).toBeVisible();
  });

  test('disabled state prevents interaction', async ({ page }) => {
    await page.goto('/iframe.html?id=apps-accountpicker--disabled&viewMode=story');
    const combobox = page.getByRole('combobox');
    await expect(combobox).toBeDisabled();
  });

  test('empty results shows message', async ({ page }) => {
    await page.goto('/iframe.html?id=apps-accountpicker--empty-results&viewMode=story');
    const combobox = page.getByRole('combobox');
    await combobox.click();
    await expect(page.getByText('No accounts found')).toBeVisible({ timeout: 5000 });
  });

  test('renders correctly in form shell', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=apps-accountpicker--default&viewMode=story&globals=pcfHostType:form;pcfWidth:500',
    );
    await expect(page.locator('.pa-form')).toBeVisible();
    await expect(page.locator('.customControl')).toBeVisible();
  });

  test('renders correctly in view shell', async ({ page }) => {
    await page.goto(
      '/iframe.html?id=apps-accountpicker--default&viewMode=story&globals=pcfHostType:view;pcfWidth:800',
    );
    await expect(page.locator('.pa-grid-page')).toBeVisible();
  });
});
