const { test, expect } = require('@playwright/test');
const projects = require('../../data/projects.json');
const writings = require('../../data/writings.json');

const routeFromDataLink = link => `/${String(link).replace(/^\/+/, '')}`;
const projectDetailRoutes = projects.map(project => routeFromDataLink(project.link));
const writingArticleRoutes = writings.map(writing => routeFromDataLink(writing.link));

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

    await page.route('https://www.youtube-nocookie.com/embed/**', route => {
        route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<!doctype html><title>Stubbed YouTube embed</title>'
        });
    });
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

async function expectResumePdfSurface(page) {
    const openLink = page.getByRole('link', { name: 'Open PDF', exact: true });
    const downloadLink = page.getByRole('link', { name: 'Download PDF', exact: true });

    await expect(openLink).toBeVisible();
    await expect(openLink).toHaveAttribute('href', /documents\/Adam_Lawrence_Resume\.pdf$/);
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveAttribute('href', /documents\/Adam_Lawrence_Resume\.pdf$/);
    await expect(downloadLink).toHaveAttribute('download', '');
    await expect(page.locator('.resume-sheet')).toBeVisible();
    await expect(page.locator('.resume-sheet')).toHaveAttribute('src', /resume_preview\.jpg/);
}

test('browser regression sweep across core routes', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });

    const routes = [
        '/',
        '/publications/',
        ...projectDetailRoutes,
        ...writingArticleRoutes,
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

test('homepage renders writing directory without removed research software sections', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    const projectDataRequests = [];
    page.on('request', request => {
        if (new URL(request.url()).pathname.endsWith('/data/projects.json')) {
            projectDataRequests.push(request.url());
        }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.home-notes')).toHaveCount(0);
    await expect(page.locator('#research-software')).toHaveCount(0);
    await expect(page.locator('#home-projects-directory')).toHaveCount(0);
    await expect(page.locator('.home-links')).toHaveCount(0);

    await expect(page.locator('#home-writings-directory .home-writing-row')).toHaveCount(writings.length);
    for (const writing of writings) {
        await expect(page.locator(`#home-writings-directory .home-directory-title[href$="${writing.link}"]`))
            .toHaveText(writing.title.english);
        await expect(page.locator('#home-writings-directory')).toContainText(writing.summary.english);

        for (const theme of writing.themes || []) {
            await expect(page.locator('#home-writings-directory')).toContainText(theme.label.english);
        }
    }
    expect(projectDataRequests).toEqual([]);
});

test('homepage writing previews and mobile rows stay readable', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await stubSharedThirdPartyRequests(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.home-image')).toHaveCount(0);
    await expect(page.locator('#home-writings-directory .home-writing-row')).toHaveCount(writings.length);
    await expect(page.locator('#home-writings-directory .home-writing-preview')).toHaveCount(writings.length);

    const firstPreview = page.locator('#home-writings-directory .home-writing-preview').first();
    await expect(firstPreview).toHaveAttribute('href', new RegExp(`${writings[0].link}$`));
    await expect(firstPreview.locator('img')).toBeVisible();
    await expect(firstPreview.locator('img')).toHaveAttribute('src', /images\/about_me\/utah\.webp$/);
    await expect(firstPreview.locator('img')).toHaveAttribute('alt', `Preview image for ${writings[0].title.english}`);

    const alignments = await page.locator('.home-writing-row').first().evaluate(row => {
        const selectors = [
            '.home-directory-title',
            '.home-directory-summary',
            '.home-directory-meta',
            '.home-directory-date .date'
        ];

        return selectors.map(selector => {
            const element = row.querySelector(selector);
            return element ? window.getComputedStyle(element).textAlign : null;
        }).filter(Boolean);
    });

    expect(alignments.length).toBeGreaterThan(0);
    expect(alignments.every(alignment => ['left', 'start'].includes(alignment))).toBe(true);
    await expectNoHorizontalOverflow(page, '/');

    await context.close();
});

test('writing article pages use the plain template with placeholder images', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    for (const route of writingArticleRoutes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.writing-page')).toHaveCount(0);
        await expect(page.locator('link[href$="writing-showcase.css"]')).toHaveCount(0);
        await expect(page.locator('.article-hero')).toHaveCount(0);
        await expect(page.locator('.article-backlink')).toHaveCount(0);
        await expect(page.locator('.writing-dummy-figure')).toHaveCount(1);
        await expect(page.locator('.writing-dummy-image')).toHaveAttribute('src', /images\/about_me\/utah\.webp$/);
        await expect(page.locator('.writing-dummy-image')).toHaveAttribute('alt', 'Antelope Island placeholder landscape');
        await expect(page.locator('.writing-video-figure')).toHaveCount(1);
        await expect(page.locator('.writing-video-frame iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/GHjopp47vvQ');
        await expect(page.locator('.writing-video-frame iframe')).toHaveAttribute('title', 'Placeholder FEM video: Understanding the Finite Element Method');
    }
});

test('writing article mobile nav opens with primary links visible', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await stubSharedThirdPartyRequests(page);

    for (const route of writingArticleRoutes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.nav-toggle')).toBeVisible();
        await page.locator('.nav-toggle').click();

        const navLinks = page.locator('#header-nav-list a');
        await expect(navLinks).toHaveText(['Home', 'Publications', 'Resume']);
        await expect(navLinks.nth(0)).toBeVisible();
        await expect(navLinks.nth(1)).toBeVisible();
        await expect(navLinks.nth(2)).toBeVisible();
    }

    await context.close();
});

test('plain personal site surfaces render without generated previews', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.home-intro')).toBeVisible();
    await expect(page.locator('.home-current')).toHaveCount(0);
    await expect(page.locator('h1')).toHaveText('Adam Lawrence');
    await expect(page.locator('.home-visual')).toHaveCount(0);
    await expect(page.locator('.home-image')).toHaveCount(0);
    await expect(page.locator('#home-writings-directory .home-writing-preview img')).toHaveCount(writings.length);
    await expect(page.locator('#home-writings-directory .home-writing-preview img').first()).toHaveAttribute('src', /images\/about_me\/utah\.webp$/);
    await expect(page.locator('#header-nav-list a')).toHaveText(['Home', 'Publications', 'Resume']);

    await page.goto('/publications/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.publications-status')).toContainText('Publications are being prepared');

    await page.goto('/projects/Torrentem/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.project-note-header')).toBeVisible();
    await expect(page.locator('.project-figure')).toHaveCount(0);
    await expect(page.locator('.project-detail-page img')).toHaveCount(0);

    await page.goto('/resume/', { waitUntil: 'domcontentloaded' });
    await expectResumePdfSurface(page);
    await expect(page.locator('.resume-frame')).toHaveCount(0);
    await expect(page.locator('iframe, object, embed')).toHaveCount(0);
    await expect(page.locator('.resume-summary-grid')).toHaveCount(0);
    await expect(page.locator('.resume-preview')).toHaveCount(0);
});

test('resume page exposes PDF links and preview on mobile', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await stubSharedThirdPartyRequests(page);

    await page.goto('/resume/', { waitUntil: 'domcontentloaded' });
    await expectResumePdfSurface(page);
    await expectNoHorizontalOverflow(page, '/resume/');

    await context.close();
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
        ...projectDetailRoutes,
        ...writingArticleRoutes,
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
