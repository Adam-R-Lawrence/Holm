const { test, expect } = require('@playwright/test');

const importedPublication = {
    title: 'New Research',
    authors: 'Jane Doe',
    venue: 'Sample Journal',
    year: 2026,
    type: 'journal',
    link: 'https://doi.org/10.1000/new'
};

const existingPublication = {
    title: 'Existing Research',
    authors: 'Adam R. Lawrence',
    venue: 'Another Journal',
    year: 2025,
    type: 'journal',
    link: 'https://doi.org/10.1000/existing'
};

async function importJsonPublication(page) {
    await page.getByRole('textbox', { name: 'Citation data' }).fill(JSON.stringify([importedPublication]));
    await page.getByRole('button', { name: 'Parse as JSON Array' }).click();
    await expect(page.locator('#parse-status')).toHaveText('Loaded 1 publication from JSON.');
}

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

test('publications builder waits for existing data before merging', async ({ page }) => {
    let releaseExisting;
    const existingReady = new Promise(resolve => { releaseExisting = resolve; });
    await page.route('**/data/publications.json', async route => {
        await existingReady;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([existingPublication])
        });
    });

    await page.goto('/publications/tools.html', { waitUntil: 'domcontentloaded' });
    const mergeButton = page.getByRole('button', { name: 'Merge with existing' });
    try {
        await expect(page.locator('#existing-count')).toHaveText('Loading current data…');
        await importJsonPublication(page);
        await expect(mergeButton).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Copy JSON' })).toBeEnabled();
        await expect(page.getByRole('button', { name: 'Download JSON' })).toBeEnabled();

        // The merge operation itself also rejects attempts while loading.
        await mergeButton.dispatchEvent('click');
        await expect(page.locator('#parse-status')).toHaveText('Existing publications are still loading. Wait before merging.');
        expect(JSON.parse(await page.locator('#publications-output').textContent())).toEqual([importedPublication]);
    } finally {
        releaseExisting();
    }

    await expect(page.locator('#existing-count')).toHaveText('1 item(s) loaded from data/publications.json.');
    await expect(mergeButton).toBeEnabled();
    await mergeButton.click();
    await expect(page.locator('#parse-status')).toHaveText('Merged working entries with existing publications.');
    expect(JSON.parse(await page.locator('#publications-output').textContent())).toEqual([
        importedPublication,
        existingPublication
    ]);
});

test('publications builder can merge with a successfully loaded empty dataset', async ({ page }) => {
    await page.route('**/data/publications.json', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]'
    }));

    await page.goto('/publications/tools.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#existing-count')).toHaveText('No existing publications found.');
    await importJsonPublication(page);
    const mergeButton = page.getByRole('button', { name: 'Merge with existing' });
    await expect(mergeButton).toBeEnabled();
    await mergeButton.click();
    await expect(page.locator('#parse-status')).toHaveText('Merged working entries with existing publications.');
    expect(JSON.parse(await page.locator('#publications-output').textContent())).toEqual([importedPublication]);
});

const unavailableDatasets = [
    { name: 'failed HTTP response', status: 503, body: 'Unavailable' },
    { name: 'invalid JSON', status: 200, body: '{' },
    { name: 'non-array data', status: 200, body: '{}' },
    { name: 'malformed publication records', status: 200, body: '[null]' }
];

for (const fixture of unavailableDatasets) {
    test(`publications builder blocks merging after ${fixture.name}`, async ({ page }) => {
        await page.route('**/data/publications.json', route => route.fulfill({
            status: fixture.status,
            contentType: 'application/json',
            body: fixture.body
        }));

        await page.goto('/publications/tools.html', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('#existing-count')).toHaveText('Unable to load current data. Merging is unavailable.');
        await importJsonPublication(page);
        const mergeButton = page.getByRole('button', { name: 'Merge with existing' });
        await expect(mergeButton).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Copy JSON' })).toBeEnabled();
        await expect(page.getByRole('button', { name: 'Download JSON' })).toBeEnabled();

        await mergeButton.dispatchEvent('click');
        await expect(page.locator('#parse-status')).toHaveText('Existing publications could not be loaded. Reload the page before merging.');
        expect(JSON.parse(await page.locator('#publications-output').textContent())).toEqual([importedPublication]);
    });
}
