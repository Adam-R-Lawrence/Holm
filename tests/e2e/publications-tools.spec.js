const { test, expect } = require('@playwright/test');

test('publications builder imports BibTeX with correct author order', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/publications/tools.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
    await expect(page.locator('#existing-count')).toContainText('item(s) loaded');

    await expect(page.getByRole('textbox', { name: 'Citation data' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(1);
    await page.locator('#publications-source').fill(`@article{example2026,
      title = {Example Research},
      author = {Doe, Jane and Adam R. Lawrence},
      journal = {Sample Journal},
      year = {2026},
      doi = {10.1000/example}
    }`);
    await page.getByRole('button', { name: 'Parse as BibTeX' }).click();

    await expect(page.locator('#parse-status')).toHaveText('Parsed 1 BibTeX entry.');
    const publications = JSON.parse(await page.locator('#publications-output').textContent());
    expect(publications).toEqual([{
        title: 'Example Research',
        authors: 'Jane Doe, Adam R. Lawrence',
        venue: 'Sample Journal',
        year: 2026,
        type: 'journal',
        link: 'https://doi.org/10.1000/example'
    }]);
    expect(pageErrors).toEqual([]);
});
