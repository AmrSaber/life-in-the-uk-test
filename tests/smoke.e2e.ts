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
	await page.goto('/exam/exam-2');
	await page.locator('.option input').first().check();
	await page.getByRole('link', { name: 'Question bank' }).click();
	await expect(page.locator('dialog[open]')).toContainText("can't be resumed");
	await page.locator('dialog[open]').getByRole('button', { name: 'Leave exam' }).click();
	await expect(page).toHaveURL(/\/bank$/);
});

test('bank: filter, select, save to a new exam and start it untimed', async ({ page }) => {
	await page.goto('/bank');
	await page.getByRole('searchbox').fill('Shakespeare');
	await page.getByRole('button', { name: /^Select all/ }).click();
	await page.getByRole('button', { name: 'Save to exam…' }).click();
	await page.getByPlaceholder('New exam name').fill('Shakespeare');
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await page.locator('dialog[open]').getByRole('button', { name: 'OK' }).click();

	await page.getByLabel('View').selectOption({ label: 'Shakespeare (5 questions)' });
	await expect(page.getByRole('heading', { name: 'Shakespeare' })).toBeVisible();
	await page.getByRole('link', { name: 'Start' }).click();
	await expect(page.getByText(/Question 1 of \d+/)).toBeVisible();
	await expect(page.getByRole('timer')).toHaveCount(0);
});

test('stars persist and drive the starred view', async ({ page }) => {
	await page.goto('/bank');
	await page.getByRole('button', { name: 'Star', exact: true }).first().click();
	await page.goto('/');
	await page.getByRole('link', { name: 'Starred questions' }).click();
	await expect(page.getByText('Showing 1 of 406 questions')).toBeVisible();
});

test('pages are prerendered with search metadata', async ({ request }) => {
	const html = async (path: string) => (await request.get(path)).text();

	const question = await html('/question/q0002');
	expect(question).toContain('<h1');
	expect(question).toContain('Where is Big Ben located?');
	expect(question).toContain('rel="canonical" href="https://lifeinuktest.net/question/q0002"');
	expect(question).toContain('"@type":"Question"');

	expect(await html('/')).toContain('<h1>Life in the UK test practice exams');
	expect(await html('/exam/exam-1')).toContain('Questions in this exam');
	expect(await html('/topic/3-4-a-global-power')).toContain('Life in the UK test questions');

	const sitemap = await html('/sitemap.xml');
	expect(sitemap).toContain('<loc>https://lifeinuktest.net/question/q0406</loc>');
	expect(sitemap).not.toContain('life-in-the-uk-test/');
	expect(await html('/robots.txt')).toContain('Sitemap: https://lifeinuktest.net/sitemap.xml');
});

test('the old exam link redirects to the exam page', async ({ page }) => {
	await page.goto('/exam?id=exam-3');
	await expect(page).toHaveURL(/\/exam\/exam-3$/);
	await expect(page.getByRole('timer')).toBeVisible();
});

test('question pages show the answer and link to the topic', async ({ page }) => {
	await page.goto('/question/q0002');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where is Big Ben located?');
	await expect(page.getByText('✓ Correct answer')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Places of interest' }).first()).toBeVisible();
});

test('topic pages link back to the chapter and to sibling sections', async ({ page }) => {
	await page.goto('/topic/3-4-a-global-power');
	const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
	await expect(crumbs.getByRole('link', { name: 'A Long and Illustrious History' })).toBeVisible();
	await expect(page.getByRole('link', { name: '3.3. The Tudors and Stuarts' })).toBeVisible();
	await expect(
		page.locator('[aria-current="page"]', { hasText: '3.4. A global power' })
	).toBeVisible();
	await crumbs.getByRole('link', { name: 'A Long and Illustrious History' }).click();
	await expect(page).toHaveURL(/\/topic\/3-a-long-and-illustrious-history$/);
	await expect(page.getByRole('link', { name: '3.4. A global power' })).toBeVisible();
});
