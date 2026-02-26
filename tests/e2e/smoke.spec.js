const { test, expect } = require('@playwright/test');

const commitFixture = [
    {
        commit: {
            committer: {
                date: '2026-02-20T12:00:00Z'
            }
        }
    }
];

async function stubSharedThirdPartyRequests(page) {
    await page.route('**/repos/Adam-R-Lawrence/Holm/commits?**', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(commitFixture)
        });
    });

    await page.route('https://www.googletagmanager.com/gtag/js?**', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: ''
        });
    });
}

function visibleCount(locator) {
    return locator.evaluateAll(nodes => nodes.filter(node => node.offsetParent !== null).length);
}

test('browser regression sweep across core routes', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    const routes = [
        '/',
        '/projects/',
        '/writings/',
        '/publications/',
        '/projects/Torrentem/',
        '/projects/Ostium/',
        '/projects/Vadum/',
        '/projects/Stratum/',
        '/writings/numerical_modelling_of_photopolymerization/',
        '/writings/close_to_nowhere/',
        '/resume/',
        '/404.html'
    ];

    for (const route of routes) {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response, `Missing response for ${route}`).not.toBeNull();
        expect(response.status(), `Unexpected status for ${route}`).toBeLessThan(400);

        await expect(page.locator('body')).toBeVisible();
        await page.waitForTimeout(200);
    }

    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
});

test('theme and language toggles work on homepage', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.theme-toggle');

    const initialDarkMode = await page.evaluate(() => document.documentElement.classList.contains('dark-theme'));
    await page.locator('.theme-toggle').first().click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('dark-theme')))
        .toBe(!initialDarkMode);

    const initialChinese = await page.evaluate(() => document.body.classList.contains('chinese'));
    await page.locator('.language-toggle').first().click();
    await expect.poll(async () => page.evaluate(() => document.body.classList.contains('chinese')))
        .toBe(!initialChinese);
    await expect(page.locator('html')).toHaveAttribute('lang', !initialChinese ? 'zh' : 'en');
});

test('publications filters and search work', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    await page.route('**/data/publications.json', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    title: 'Alpha Conference Paper',
                    authors: 'Author One',
                    venue: 'Venue A',
                    year: 2025,
                    type: 'conference',
                    link: ''
                },
                {
                    title: 'Beta Journal Paper',
                    authors: 'Author Two',
                    venue: 'Venue B',
                    year: 2025,
                    type: 'journal',
                    link: 'doi:10.1000/beta'
                },
                {
                    title: 'Gamma Journal Paper',
                    authors: 'Author Three',
                    venue: 'Venue C',
                    year: 2024,
                    type: 'journal',
                    link: ''
                },
                {
                    title: 'Hidden Draft',
                    authors: 'Author Four',
                    venue: 'Venue D',
                    year: 2023,
                    type: 'poster',
                    draft: true
                }
            ])
        });
    });

    await page.goto('/publications/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#publication-year-filter option')).toHaveCount(3);

    const cards = page.locator('.publications-list-item');
    await expect(cards).toHaveCount(3);

    await page.selectOption('#publication-year-filter', '2025');
    await expect(cards).toHaveCount(2);

    await page.selectOption('#publication-type-filter', 'journal');
    await expect(cards).toHaveCount(1);

    await page.fill('#publication-search', 'alpha');
    await expect(page.locator('.directory-empty-state')).toHaveCount(1);

    await page.fill('#publication-search', 'beta');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Beta Journal Paper');
});

test('writings theme filter works', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    await page.route('**/data/writings.json', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: 'w1',
                    title: { english: 'Flow Notes', chinese: '流动笔记' },
                    summary: { english: 'Summary 1', chinese: '摘要 1' },
                    date: '2025-01-01',
                    link: 'writings/close_to_nowhere/',
                    themes: [{ id: 'fluid-dynamics', label: { english: 'Fluid Dynamics', chinese: '流体力学' } }]
                },
                {
                    id: 'w2',
                    title: { english: 'History Sketches', chinese: '历史札记' },
                    summary: { english: 'Summary 2', chinese: '摘要 2' },
                    date: '2025-01-02',
                    link: 'writings/close_to_nowhere/',
                    themes: [{ id: 'environmental-history', label: { english: 'Environmental History', chinese: '环境史' } }]
                },
                {
                    id: 'w3',
                    title: { english: 'Solver Thoughts', chinese: '求解器想法' },
                    summary: { english: 'Summary 3', chinese: '摘要 3' },
                    date: '2025-01-03',
                    link: 'writings/close_to_nowhere/',
                    themes: [{ id: 'fluid-dynamics', label: { english: 'Fluid Dynamics', chinese: '流体力学' } }]
                }
            ])
        });
    });

    await page.goto('/writings/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#theme-filter');

    const writingCards = page.locator('.writing-item');
    await expect(writingCards).toHaveCount(3);

    await page.selectOption('#theme-filter', 'fluid-dynamics');
    await expect.poll(async () => visibleCount(writingCards)).toBe(2);

    await page.selectOption('#theme-filter', 'environmental-history');
    await expect.poll(async () => visibleCount(writingCards)).toBe(1);

    await page.selectOption('#theme-filter', 'all');
    await expect.poll(async () => visibleCount(writingCards)).toBe(3);
});

test('lightbox opens and closes on project detail pages', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    await page.goto('/projects/Torrentem/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.lightbox-trigger');

    await page.locator('.lightbox-trigger').first().click();
    await expect(page.locator('#lightbox-modal')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox-modal')).toBeHidden();
});
