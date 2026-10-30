import { expect, test } from '@playwright/test';

test('practice exam: answer, see feedback, finish and score', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: /^Exam 1\b/ }).click();
	await expect(page.getByRole('timer')).toContainText('left');

	const check = page.getByRole('button', { name: 'Check answer' });
	await expect(check).toBeDisabled();
	const hint = await page.locator('.hint').textContent();
	const needed = Number(hint?.match(/Choose (\d)/)?.[1]);
	for (let i = 0; i < needed; i++) await page.locator('.option input').nth(i).check();
	await check.click();

	await expect(page.locator('.result')).toBeVisible();
	await expect(page.locator('.option input').first()).toBeDisabled();

	await page.getByRole('button', { name: 'Finish' }).first().click();
	await page.locator('dialog[open]').getByRole('button', { name: 'Finish' }).click();
	await expect(page.getByText(/\d+ \/ 24 correct/)).toBeVisible();
	await expect(page.getByText(/Passed|Not passed/)).toBeVisible();
});

test('leaving an unfinished exam asks for confirmation', async ({ page }) => {
	await page.goto('/exam?id=exam-2');
	await page.locator('.option input').first().check();
	await page.getByRole('link', { name: 'Question bank' }).click();
	await expect(page.locator('dialog[open]')).toContainText("can't be resumed");
	await page.locator('dialog[open]').getByRole('button', { name: 'Leave exam' }).click();
	await expect(page).toHaveURL(/\/bank$/);
});

test('bank: filter, select, save as exam and start it untimed', async ({ page }) => {
	await page.goto('/bank');
	await page.getByRole('searchbox').fill('Shakespeare');
	await page.getByRole('button', { name: /^Select all/ }).click();
	await page.getByRole('button', { name: 'Save as exam…' }).click();
	await page.locator('dialog[open] input').fill('Shakespeare');
	await page.locator('dialog[open]').getByRole('button', { name: 'Save' }).click();

	await expect(page.getByRole('heading', { name: 'Shakespeare' })).toBeVisible();
	await page.getByRole('link', { name: 'Start' }).click();
	await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();
	await expect(page.getByRole('timer')).toHaveCount(0);
});

test('stars persist and drive the starred view', async ({ page }) => {
	await page.goto('/bank');
	await page.getByRole('button', { name: 'Star', exact: true }).first().click();
	await page.reload();
	await page.getByRole('link', { name: 'Starred questions' }).click();
	await expect(page.getByText('Showing 1 of 406 questions')).toBeVisible();
});
