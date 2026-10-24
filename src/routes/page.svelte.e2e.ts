import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fixture = fileURLToPath(new URL('../lib/server/csv/fixtures/girokonto.csv', import.meta.url));

test('has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test('previews a CSV export without saving it', async ({ page }) => {
	await page.goto('/import');
	await page.setInputFiles('#csv-file', fixture);
	await page.getByRole('button', { name: 'Read file' }).click();
	await expect(page.getByRole('heading', { name: 'Check before importing' })).toBeVisible();
	await page.getByRole('button', { name: 'Discard' }).click();
	await expect(page).toHaveURL(/\/import$/);
});

test('explains why a file was rejected', async ({ page }) => {
	await page.goto('/import');
	await page.setInputFiles('#csv-file', {
		name: 'notes.csv',
		mimeType: 'text/csv',
		buffer: Buffer.from('"Datum";"Betrag"\n"01.10.26";"1,00"')
	});
	await page.getByRole('button', { name: 'Read file' }).click();
	await expect(page.getByRole('alert')).toContainText('Missing columns');
});

test('creates, saves and deletes a tag', async ({ page }) => {
	const name = `Groceries ${Date.now()}`;
	await page.goto('/tags/new', { waitUntil: 'networkidle' });
	await page.getByLabel('Name').fill(name);
	await page.getByLabel('Field for rule 1').selectOption('counterparty');
	await page.getByLabel('Text for rule 1').fill('REWE');
	await page.getByRole('button', { name: 'Add rule' }).click();
	await page.getByLabel('Text for rule 2').fill('Lidl');
	await page.getByRole('button', { name: 'Create tag' }).click();

	await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
	await expect(page.getByRole('status')).toContainText('Saved');
	await expect(page.getByLabel('Text for rule 2')).toHaveValue('Lidl');

	await page.getByText('Delete tag').click();
	await page.getByRole('button', { name: `Delete ${name}` }).click();
	await expect(page).toHaveURL(/\/tags\?deleted=/);
	await expect(page.getByRole('status')).toContainText(name);
});

test('refuses a rule without text', async ({ page }) => {
	await page.goto('/tags/new', { waitUntil: 'networkidle' });
	await page.getByLabel('Name').fill(`Empty ${Date.now()}`);
	await page.getByRole('button', { name: 'Create tag' }).click();
	await expect(page.getByRole('alert')).toContainText('Rule 1 has no text');
});
