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

async function expectNoHorizontalOverflow(page, route) {
    const overflow = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.scrollWidth
    }));

    expect(
        Math.max(overflow.documentWidth, overflow.bodyWidth),
        `Horizontal overflow on ${route}: ${JSON.stringify(overflow)}`
    ).toBeLessThanOrEqual(overflow.viewportWidth + 1);
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
        '/writings/vms_nse/',
        '/writings/photopolymerization/',
        '/writings/river_morphodynamics/',
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
        await expectNoHorizontalOverflow(page, route);
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

test('plain personal site surfaces render without generated previews', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.home-intro')).toBeVisible();
    await expect(page.locator('.home-current')).toBeVisible();
    await expect(page.locator('.home-current dt')).toHaveText(['Focus', 'Main code', 'Contact']);
    await expect(page.locator('.home-current')).toContainText('free-surface hydrodynamics, stabilized FEM, level-set methods, and photopolymerization modelling.');
    await expect(page.locator('.home-current')).toContainText('Torrentem');
    await expect(page.locator('.home-current')).toContainText('adamrl3@illinois.edu');
    await expect(page.locator('h1')).toHaveText('Adam Lawrence');
    await expect(page.locator('.home-visual')).toHaveCount(0);
    await expect(page.locator('.home-image')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Primary site links' }).getByRole('link', { name: 'Publications' })).toBeVisible();

    await page.goto('/projects/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.project-item')).toHaveCount(4);
    await expect(page.locator('.project-card-metadata').first()).toHaveText('C++, CUDA, MPI, FEM');
    await expect(page.locator('.project-card-tags li')).toHaveCount(0);
    await expect(page.locator('.project-card-media')).toHaveCount(0);
    await expect(page.locator('.project-item img')).toHaveCount(0);

    await page.goto('/publications/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.publications-status')).toContainText('Publications are being prepared');

    await page.goto('/projects/Torrentem/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.project-note-header')).toBeVisible();
    await expect(page.locator('.project-figure')).toHaveCount(0);
    await expect(page.locator('.project-detail-page img')).toHaveCount(0);

    await page.goto('/resume/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
    await expect(page.locator('.resume-sheet')).toBeVisible();
    await expect(page.locator('.resume-sheet')).toHaveAttribute('src', /resume_preview\.jpg/);
    await expect(page.locator('.resume-frame')).toHaveCount(0);
    await expect(page.locator('iframe, object, embed')).toHaveCount(0);
    await expect(page.locator('.resume-summary-grid')).toHaveCount(0);
    await expect(page.locator('.resume-preview')).toHaveCount(0);
});

test('core routes avoid mobile horizontal overflow', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await stubSharedThirdPartyRequests(page);

    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    const routes = [
        '/',
        '/projects/',
        '/projects/Torrentem/',
        '/writings/',
        '/writings/vms_nse/',
        '/writings/photopolymerization/',
        '/writings/river_morphodynamics/',
        '/publications/',
        '/resume/'
    ];

    for (const route of routes) {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response, `Missing response for ${route}`).not.toBeNull();
        expect(response.status(), `Unexpected status for ${route}`).toBeLessThan(400);
        await page.waitForTimeout(200);
        await expectNoHorizontalOverflow(page, route);
    }

    expect(pageErrors, `Unexpected mobile page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    await context.close();
});
