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
