const { test, expect } = require('@playwright/test');
const projects = require('../../data/projects.json');
const writings = require('../../data/writings.json');

const routeFromDataLink = link => `/${String(link).replace(/^\/+/, '')}`;
const projectDetailRoutes = projects.map(project => routeFromDataLink(project.link));
const writingArticleRoutes = writings.map(writing => routeFromDataLink(writing.link));
const featuredWritingRoute = '/writings/numerical_modelling_of_photopolymerization/';
const unlistedWritingRoutes = [
    '/writings/vms_nse/',
    '/writings/photopolymerization/',
    '/writings/river_morphodynamics/',
    '/writings/close_to_nowhere/'
];
const allWritingArticleRoutes = [...writingArticleRoutes, ...unlistedWritingRoutes];
const wideDesktopViewport = { width: 1440, height: 1000 };

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

    await page.route(/^https:\/\/www\.youtube-nocookie\.com\/embed(?:\/|\?)/, route => {
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

async function expectSharedFooterContact(page, route) {
    const contact = page.locator('.site-contact');
    await expect(contact, `Shared contact block count on ${route}`).toHaveCount(1);
    await expect(contact, `Shared contact block text on ${route}`).toContainText(
        'For enquiries or collaboration'
    );
    await expect(contact.locator('a'), `Shared contact mail link on ${route}`)
        .toHaveAttribute('href', 'mailto:adamrl3@illinois.edu');

    const contactImmediatelyPrecedesFooter = await page.evaluate(() => {
        const contactElement = document.querySelector('.site-contact');
        return contactElement?.nextElementSibling?.tagName === 'FOOTER';
    });

    expect(
        contactImmediatelyPrecedesFooter,
        `Shared contact block should be immediately before the footer on ${route}`
    ).toBe(true);
}

async function layoutBox(page, selector) {
    const locator = page.locator(selector).first();
    await expect(locator, `Expected ${selector} to be visible`).toBeVisible();

    return locator.evaluate(element => {
        const rect = element.getBoundingClientRect();

        return {
            left: rect.left,
            right: rect.right,
            width: rect.width,
            center: rect.left + rect.width / 2
        };
    });
}

async function expectCenteredInViewport(page, selector, label, tolerance = 2) {
    const box = await layoutBox(page, selector);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const leftGutter = box.left;
    const rightGutter = viewportWidth - box.right;

    expect(
        Math.abs(leftGutter - rightGutter),
        `${label} should have balanced viewport gutters`
    ).toBeLessThanOrEqual(tolerance);

    return box;
}

function expectSharedAxis(reference, candidate, label, tolerance = 2) {
    expect(Math.abs(candidate.left - reference.left), `${label} left edge`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(candidate.right - reference.right), `${label} right edge`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(candidate.center - reference.center), `${label} center`).toBeLessThanOrEqual(tolerance);
}

function rgbChannels(cssColor) {
    const hexMatch = cssColor.trim().match(/^#([\da-f]{6})$/i);
    if (hexMatch) {
        return [0, 2, 4].map(offset => Number.parseInt(hexMatch[1].slice(offset, offset + 2), 16));
    }

    const rgbMatch = cssColor.trim().match(/^rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
    if (rgbMatch) {
        return rgbMatch.slice(1, 4).map(Number);
    }

    throw new Error(`Unsupported CSS color: ${cssColor}`);
}

function relativeLuminance(cssColor) {
    const [red, green, blue] = rgbChannels(cssColor).map(channel => {
        const normalized = channel / 255;
        return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
    });

    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(foreground, background) {
    const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
    const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
    return (lighter + 0.05) / (darker + 0.05);
}

function expectMinimumContrast(foreground, background, minimum, label) {
    expect(
        contrastRatio(foreground, background),
        `${label}: ${foreground} against ${background}`
    ).toBeGreaterThanOrEqual(minimum);
}

test('browser regression sweep across core routes', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    const pageErrors = [];
    const trackingRequests = [];
    page.on('pageerror', error => {
        pageErrors.push(error.message);
    });
    page.on('request', request => {
        const hostname = new URL(request.url()).hostname;
        if (hostname === 'www.googletagmanager.com' || hostname === 'www.google-analytics.com') {
            trackingRequests.push(request.url());
        }
    });

    const routes = [
        '/',
        '/publications/',
        ...projectDetailRoutes,
        ...allWritingArticleRoutes,
        '/resume/',
        '/404.html'
    ];

    for (const route of routes) {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response, `Missing response for ${route}`).not.toBeNull();
        expect(response.status(), `Unexpected status for ${route}`).toBeLessThan(400);

        await expect(page.locator('body')).toBeVisible();
        await page.waitForTimeout(200);
        const trackingGlobals = await page.evaluate(() => ({
            hasDataLayer: Object.prototype.hasOwnProperty.call(window, 'dataLayer'),
            hasGtag: Object.prototype.hasOwnProperty.call(window, 'gtag')
        }));
        expect(trackingGlobals, `Tracking globals created on ${route}`).toEqual({
            hasDataLayer: false,
            hasGtag: false
        });
        await expectSharedFooterContact(page, route);
        await expect(page.locator('.skip-link'), `Skip link count on ${route}`).toHaveCount(1);
        await expectNoHorizontalOverflow(page, route);
    }

    expect(pageErrors, `Unexpected page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(trackingRequests, 'Requests to Google tracking domains').toEqual([]);
});

test('nested 404 keeps its styles, navigation, and home link working', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    await page.route('**/not-found/nested/page', route => route.fulfill({
        status: 404,
        contentType: 'text/html',
        path: __dirname + '/../../404.html'
    }));

    const response = await page.goto('/not-found/nested/page', { waitUntil: 'domcontentloaded' });
    expect(response.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Return to Home' })).toHaveAttribute('href', '/');
    await expect(page.locator('link[rel="stylesheet"]').first())
        .toHaveAttribute('href', '/styles/styles.min.css');
    await expect(page.locator('.contentHeader-placeholder nav')).toBeVisible();
    await expectSharedFooterContact(page, '/not-found/nested/page');
});

test('footer update date follows the selected language, including after reload', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');

    await page.locator('.language-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    await expect(page.locator('#last-updated')).toHaveText('2026年2月20日');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#last-updated')).toHaveText('2026年2月20日');

    await page.locator('.language-toggle').click();
    await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');
});

for (const initialLanguage of ['english', 'chinese']) {
    test(`rapid language changes ignore stale translations from ${initialLanguage}`, async ({ page }) => {
        await stubSharedThirdPartyRequests(page);
        await page.addInitScript(language => localStorage.setItem('language', language), initialLanguage);
        const delayedLanguage = initialLanguage === 'english' ? 'zh' : 'en';
        const translations = require(`../../data/translations_${delayedLanguage}.json`);
        let releaseTranslation;
        const translationReady = new Promise(resolve => { releaseTranslation = resolve; });
        await page.route(`**/data/translations_${delayedLanguage}.json`, async route => {
            await translationReady;
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(translations) });
        });

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const isChinese = initialLanguage === 'chinese';
        await expect(page.locator('#last-updated')).toHaveText(isChinese ? '2026年2月20日' : 'February 20, 2026');
        const delayedRequest = page.waitForRequest(`**/data/translations_${delayedLanguage}.json`);
        const firstToggle = page.evaluate(() => window.toggleLanguage());
        try {
            await delayedRequest;
            await page.evaluate(() => window.toggleLanguage());
        } finally {
            releaseTranslation();
            await firstToggle;
        }

        await expect(page.locator('html')).toHaveAttribute('lang', isChinese ? 'zh' : 'en');
        await expect(page.locator('.language-toggle')).toHaveAttribute('aria-pressed', String(isChinese));
        await expect(page.locator('#header-nav-list a')).toHaveText(
            isChinese ? ['主页', '出版物', '简历'] : ['Home', 'Publications', 'Resume']
        );
        await expect(page.locator('#home-writings-heading')).toHaveText(isChinese ? '文章' : 'Writings');
        await expect(page.locator('.home-directory-title').first()).toHaveText(
            writings[0].title[initialLanguage]
        );
        await expect(page.locator('#last-updated')).toHaveText(isChinese ? '2026年2月20日' : 'February 20, 2026');
    });
}

for (const blockedStorage of ['access', 'read', 'write']) {
    test(`content and controls work when browser storage ${blockedStorage} is blocked`, async ({ page }) => {
        await stubSharedThirdPartyRequests(page);
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.addInitScript(mode => {
            const denyStorage = () => { throw new DOMException('Storage access denied', 'SecurityError'); };
            if (mode === 'access') {
                Object.defineProperty(window, 'localStorage', { get: denyStorage });
            } else {
                Storage.prototype[mode === 'read' ? 'getItem' : 'setItem'] = denyStorage;
            }
        }, blockedStorage);

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.home-writing-row')).toHaveCount(writings.length);
        await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');
        await page.locator('.theme-toggle').click();
        await expect(page.locator('html')).toHaveClass(/dark-theme/);
        await page.locator('.theme-toggle').click();
        await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
        await page.locator('.language-toggle').click();
        await expect(page.locator('#header-home')).toHaveText('主页');
        await expect(page.locator('#last-updated')).toHaveText('2026年2月20日');
        await expect(page.locator('.home-directory-title').first()).toHaveText(writings[0].title.chinese);
        await page.locator('.language-toggle').click();
        await expect(page.locator('#header-home')).toHaveText('Home');
        await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');

        await page.goto('/publications/', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.publications-list-item')).toContainText('A multi-GPU-centric finite element multiphysics modeling framework');
        await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');
        expect(pageErrors).toEqual([]);
    });
}

test('Chinese mode gives controls localized names and identifies English article content', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.home-writing-preview')).toHaveCount(writings.length);

    await page.locator('.language-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    await expect(page.locator('.skip-link')).toHaveAttribute('aria-label', '跳转到主要内容');
    await expect(page.locator('.theme-toggle')).toHaveAttribute('aria-label', '切换主题');
    await expect(page.locator('.language-toggle')).toHaveAttribute('aria-label', '切换语言');
    await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-label', '切换导航菜单');
    await expect(page.locator('#scroll-to-top-btn')).toHaveAttribute('aria-label', '返回顶部');
    await expect(page.locator('.home-writing-preview').first())
        .toHaveAttribute('aria-label', `阅读：${writings[0].title.chinese}`);

    await page.goto('/resume/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.contentHeader-placeholder nav')).toContainText('简历');

    await page.goto(featuredWritingRoute, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
});

test('homepage embeds the newest video from the channel uploads playlist', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const video = page.locator('.home-video-frame iframe');
    await expect(video).toHaveAttribute(
        'src',
        'https://www.youtube-nocookie.com/embed?listType=playlist&list=UUuOtXNfo_nRq0GfsTRHxe8w'
    );
    await expect(video).toHaveAttribute('loading', 'lazy');
    await expect(video).toHaveAttribute('title', 'Latest video from Adam Lawrence on YouTube');
    await expect(page.locator('#home-video-channel-link'))
        .toHaveAttribute('href', 'https://www.youtube.com/@arlawrence');
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]'))
        .toHaveAttribute('content', /frame-src 'self' https:\/\/www\.youtube-nocookie\.com/);

    await page.setViewportSize({ width: 375, height: 812 });
    await expectNoHorizontalOverflow(page, '/');
    const frameBox = await video.boundingBox();
    expect(frameBox.width / frameBox.height).toBeCloseTo(16 / 9, 1);

    await page.locator('.language-toggle').click();
    await expect(page.locator('#home-video-heading')).toHaveText('最新视频');
    await expect(page.locator('#home-video-channel-link')).toHaveText('在 YouTube 查看更多');
});

test('wide desktop layouts keep content measures centered and proportional', async ({ browser }) => {
    const context = await browser.newContext({ viewport: wideDesktopViewport });
    const page = await context.newPage();
    await stubSharedThirdPartyRequests(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#home-writings-directory .home-writing-row')).toHaveCount(writings.length);

    const homeMainBox = await expectCenteredInViewport(page, '.home-page', 'Homepage main content');
    const homeIntroBox = await layoutBox(page, '.home-intro');
    const homeHeadingBox = await layoutBox(page, '#about-header');
    const homeLedeBox = await layoutBox(page, '.home-lede');
    const homeWritingBox = await layoutBox(page, '.home-writing-note');
    const homeDirectoryBox = await layoutBox(page, '#home-writings-directory');

    expectSharedAxis(homeMainBox, homeIntroBox, 'Homepage intro section');
    expectSharedAxis(homeMainBox, homeWritingBox, 'Homepage writings section');
    expect(Math.abs(homeHeadingBox.center - homeMainBox.center), 'Homepage heading center')
        .toBeLessThanOrEqual(2);
    expect(Math.abs(homeLedeBox.center - homeMainBox.center), 'Homepage lede center')
        .toBeLessThanOrEqual(2);
    expect(homeHeadingBox.width, 'Homepage intro should use the primary reading measure')
        .toBeLessThan(homeWritingBox.width * 0.8);
    expect(homeDirectoryBox.width, 'Homepage writings directory should remain wider than the intro')
        .toBeGreaterThan(homeHeadingBox.width * 1.25);

    const writingRowBalance = await page.locator('.home-writing-row').first().evaluate(row => {
        const rowRect = row.getBoundingClientRect();
        const copyRect = row.querySelector('.home-directory-body').getBoundingClientRect();
        const previewRect = row.querySelector('.home-writing-preview').getBoundingClientRect();

        return {
            rowWidth: rowRect.width,
            copyCenter: copyRect.top + copyRect.height / 2,
            previewCenter: previewRect.top + previewRect.height / 2,
            previewWidth: previewRect.width,
            previewRightGap: rowRect.right - previewRect.right
        };
    });

    expect(writingRowBalance.previewWidth, 'Homepage preview should stay thumbnail-sized')
        .toBeLessThanOrEqual(225);
    expect(writingRowBalance.previewWidth, 'Homepage preview should not dominate the row')
        .toBeLessThan(writingRowBalance.rowWidth * 0.25);
    expect(Math.abs(writingRowBalance.copyCenter - writingRowBalance.previewCenter), 'Homepage copy and preview centers')
        .toBeLessThanOrEqual(2);
    expect(Math.abs(writingRowBalance.previewRightGap), 'Homepage preview should align to the row edge')
        .toBeLessThanOrEqual(1);

    await page.route('**/data/publications.json', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
        });
    });

    await page.goto('/publications/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.publications-status')).toBeVisible();

    const publicationsMainBox = await expectCenteredInViewport(
        page,
        'main#main-content[data-page="publications"]',
        'Publications main content'
    );
    const publicationsHeadingBox = await layoutBox(page, '#publications-header');
    const publicationsIntroBox = await layoutBox(page, 'main#main-content[data-page="publications"] .section-intro');
    const publicationsStatusBox = await layoutBox(page, '.publications-status');

    expectSharedAxis(publicationsMainBox, publicationsHeadingBox, 'Publications heading');
    expectSharedAxis(publicationsMainBox, publicationsIntroBox, 'Publications intro');
    expectSharedAxis(publicationsMainBox, publicationsStatusBox, 'Publications status');

    await page.goto('/projects/Torrentem/', { waitUntil: 'domcontentloaded' });

    const projectHeaderBox = await expectCenteredInViewport(page, '.project-note-header', 'Project detail header');
    const projectFactsBox = await layoutBox(page, '.project-facts');
    const projectGridBox = await layoutBox(page, '.project-note-grid');
    const projectCrosslinksBox = await layoutBox(page, '.content-crosslinks');

    expectSharedAxis(projectHeaderBox, projectFactsBox, 'Project facts');
    expectSharedAxis(projectHeaderBox, projectGridBox, 'Project section grid');
    expectSharedAxis(projectHeaderBox, projectCrosslinksBox, 'Project crosslinks');

    await page.goto('/resume/', { waitUntil: 'domcontentloaded' });
    await expectResumePdfSurface(page);

    const resumeIntroBox = await expectCenteredInViewport(page, '.resume-intro', 'Resume intro');
    const resumeActionsBox = await layoutBox(page, '.resume-actions');
    const resumePdfBox = await layoutBox(page, '.resume-pdf-only');
    const resumeSheetLinkBox = await layoutBox(page, '.resume-sheet-link');
    const resumeSheetBox = await layoutBox(page, '.resume-sheet');

    expectSharedAxis(resumeIntroBox, resumeActionsBox, 'Resume actions');
    expectSharedAxis(resumeIntroBox, resumePdfBox, 'Resume PDF section');
    expectSharedAxis(resumeIntroBox, resumeSheetLinkBox, 'Resume PDF link');
    expectSharedAxis(resumeIntroBox, resumeSheetBox, 'Resume PDF preview');

    await context.close();
});

test('dark theme activates, exposes its palette, and persists after reload', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    await page.emulateMedia({ colorScheme: 'light' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.theme-toggle');
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).not.toHaveClass(/dark-theme/);
    await expect(page.locator('.theme-toggle').first()).toHaveAttribute('aria-pressed', 'false');
    await page.locator('.theme-toggle').first().click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.classList.contains('dark-theme')))
        .toBe(true);
    await expect(page.locator('.theme-toggle').first()).toHaveAttribute('aria-pressed', 'true');

    const darkTheme = await page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        const properties = [
            '--page-bg-top',
            '--page-bg-bottom',
            '--surface-1',
            '--surface-2',
            '--text-color',
            '--muted-text',
            '--border-color',
            '--border-strong',
            '--link-color',
            '--link-hover-color',
            '--link-visited-color',
            '--accent-soft'
        ];

        return {
            storedTheme: localStorage.getItem('theme'),
            colorScheme: rootStyle.colorScheme,
            backgroundImage: getComputedStyle(document.body).backgroundImage,
            variables: Object.fromEntries(properties.map(property => [
                property,
                rootStyle.getPropertyValue(property).trim()
            ]))
        };
    });

    expect(darkTheme.storedTheme).toBe('dark');
    expect(darkTheme.colorScheme).toBe('dark');
    expect(darkTheme.backgroundImage).toBe('none');
    expect(darkTheme.variables).toEqual({
        '--page-bg-top': '#1b1b1b',
        '--page-bg-bottom': '#1b1b1b',
        '--surface-1': '#1b1b1b',
        '--surface-2': '#252525',
        '--text-color': '#f2f2f2',
        '--muted-text': '#b3b3b3',
        '--border-color': '#414141',
        '--border-strong': '#666666',
        '--link-color': '#e5e5e5',
        '--link-hover-color': '#ffffff',
        '--link-visited-color': '#cdcdcd',
        '--accent-soft': '#2a2a2a'
    });

    expectMinimumContrast('#f2f2f2', '#1b1b1b', 4.5, 'Primary text');
    expectMinimumContrast('#b3b3b3', '#1b1b1b', 4.5, 'Muted text');
    expectMinimumContrast('#e5e5e5', '#1b1b1b', 4.5, 'Links');
    expectMinimumContrast('#d7d7d7', '#2a2a2a', 3, 'Selected control border');
    expectMinimumContrast('#e5e5e5', '#1b1b1b', 3, 'Focus indicator');

    await expect(page.locator('.home-profile-links a').first())
        .toHaveCSS('color', 'rgb(229, 229, 229)');
    await expect(page.locator('header a[aria-current="page"]'))
        .toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('.home-recent')).toHaveCSS('border-bottom-width', '0px');

    const themeToggle = page.locator('.theme-toggle').first();
    await page.mouse.move(0, 500);
    await expect(themeToggle).toHaveCSS('background-color', 'rgb(37, 37, 37)');
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Tab');
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();
    await expect(themeToggle).toHaveCSS('outline-color', 'rgb(229, 229, 229)');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/dark-theme/);
    await expect(page.locator('.theme-toggle').first()).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

    const initialChinese = await page.evaluate(() => document.body.classList.contains('chinese'));
    await page.locator('.language-toggle').first().click();
    await expect.poll(async () => page.evaluate(() => document.body.classList.contains('chinese')))
        .toBe(!initialChinese);
    await expect(page.locator('html')).toHaveAttribute('lang', !initialChinese ? 'zh' : 'en');
});

test('dark theme covers representative pages at desktop and mobile widths', async ({ browser }) => {
    const routes = [
        '/',
        '/publications/',
        '/resume/',
        projectDetailRoutes[0],
        '/writings/vms_nse/',
        featuredWritingRoute
    ];
    const viewports = [wideDesktopViewport, { width: 390, height: 844 }];

    for (const viewport of viewports) {
        const context = await browser.newContext({ viewport });
        await context.addInitScript(() => localStorage.setItem('theme', 'dark'));
        const page = await context.newPage();
        await stubSharedThirdPartyRequests(page);

        for (const route of routes) {
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('html'), `Dark theme class on ${route}`).toHaveClass(/dark-theme/);
            await expect(page.locator('html'), `Native color scheme on ${route}`).toHaveCSS('color-scheme', 'dark');
            await expect(page.locator('body'), `Text color on ${route}`).toHaveCSS('color', 'rgb(242, 242, 242)');
            await expect(page.locator('.contentHeader-placeholder header'), `Header on ${route}`)
                .toHaveCSS('background-color', 'rgb(27, 27, 27)');
            await expect(page.locator('footer#footer-placeholder, #footer-placeholder footer').first(), `Footer on ${route}`)
                .toHaveCSS('background-color', 'rgb(27, 27, 27)');
            await expectNoHorizontalOverflow(page, route);
        }

        await page.goto('/resume/', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.resume-sheet-link')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await expect(page.locator('.resume-sheet')).toHaveCSS('filter', 'none');

        await page.goto('/writings/vms_nse/', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('main code').first())
            .toHaveCSS('background-color', 'rgb(37, 37, 37)');

        await page.goto(featuredWritingRoute, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.writing-figure .content-image'))
            .toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await expect(page.locator('.writing-figure .content-image')).toHaveCSS('filter', 'none');

        await context.close();
    }
});

test('published research and Scholar link are visible', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    await page.goto('/publications/', { waitUntil: 'domcontentloaded' });

    const publication = page.locator('.publications-list-item');
    await expect(publication).toHaveCount(1);
    await expect(publication).toContainText(
        'A multi-GPU-centric finite element multiphysics modeling framework for vat photopolymerization'
    );
    await expect(publication.locator('.publication-title')).toHaveAttribute(
        'href',
        'https://doi.org/10.1016/j.addma.2026.105361'
    );
    await expect(page.locator('#publications-toolbar')).toBeHidden();
    await expect(page.locator('#publications-scholar-link')).toHaveAttribute(
        'href',
        /scholar\.google\.com\/citations\?user=xpMzezsAAAAJ/
    );

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.home-feature')).toHaveCount(0);
    await expect(page.locator('#home-recent-heading')).toHaveText('Recent publication');
    await expect(page.locator('#home-paper-link')).toHaveAttribute(
        'href',
        'https://doi.org/10.1016/j.addma.2026.105361'
    );
    await expect(page.locator('#home-scholar-link')).toHaveAttribute(
        'href',
        /scholar\.google\.com\/citations\?user=xpMzezsAAAAJ/
    );
    await expect(page.locator('#home-resume-link')).toHaveAttribute('href', '/resume/');
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
    await expect(page.locator('#about-p1')).toContainText('I work with Jinhui Yan.');
    await expect(page.locator('#about-p1 a')).toHaveAttribute(
        'href',
        'https://yan.cee.illinois.edu/'
    );

    const writingRow = page.locator('#home-writings-directory .home-writing-row');
    await expect(writingRow).toHaveCount(1);
    await expect(writingRow.locator('.home-directory-title')).toHaveText(
        'Computational Modelling of Vat Photopolymerization — AM Bench 2025 Challenge'
    );
    await expect(writingRow.locator('.home-directory-title')).toHaveAttribute(
        'href',
        featuredWritingRoute
    );
    await expect(writingRow.locator('.home-directory-summary')).toHaveText(
        'A first-place computational modelling submission for the AM Bench 2025 vat photopolymerization cure-depth challenge.'
    );
    await expect(writingRow.locator('.home-writing-themes')).toHaveText(
        'Topic: Computational Mechanics'
    );
    await expect(page.locator('#home-writing-group-filters')).toBeHidden();
    await expect(page.locator('.home-writing-group-filter')).toHaveCount(0);
    await expect(writingRow.locator('.date .month-day')).toHaveText('Aug 4,');
    await expect(writingRow.locator('.date .year')).toHaveText('2026');
    await expect(writingRow.locator('.home-writing-preview')).toHaveAttribute('href', featuredWritingRoute);
    await expect(writingRow.locator('.home-writing-preview img')).toHaveAttribute(
        'src',
        /images\/writings\/am-bench-2025\/4\.3\.3_benchy_signed_deviation_rotations\.png$/
    );
    await expect(writingRow.locator('.home-writing-preview img')).toHaveAttribute(
        'alt',
        'Four views of signed deviation between the simulated cured surface and reference STL surface for 3DBenchy'
    );
    await expect(writingRow.locator('.home-writing-preview img')).toHaveAttribute('width', '2020');
    await expect(writingRow.locator('.home-writing-preview img')).toHaveAttribute('height', '1972');
    await expect(writingRow.locator('.home-writing-preview img')).toHaveCSS('object-fit', 'contain');
    expect(projectDataRequests).toEqual([]);
});

test('homepage writing groups filter in feed order and survive language changes', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    const multiGroupWritings = [
        writings[0],
        {
            id: 'river-note',
            title: { english: 'River Note', chinese: '河流笔记' },
            date: '2026-07-01',
            summary: { english: 'Environmental group fixture.', chinese: '环境分组测试。' },
            link: 'writings/river_morphodynamics/',
            group: {
                id: 'environmental-modelling',
                label: { english: 'Environmental Modelling', chinese: '环境建模' }
            },
            themes: []
        },
        {
            id: 'ungrouped-note',
            title: { english: 'Ungrouped Note', chinese: '未分组笔记' },
            date: '2026-06-01',
            summary: { english: 'Missing-group fixture.', chinese: '缺少分组的测试。' },
            link: 'writings/close_to_nowhere/',
            themes: []
        }
    ];

    await page.route('**/data/writings.json', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(multiGroupWritings)
        });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const filters = page.locator('.home-writing-group-filter');
    await expect(filters).toHaveText([
        'All',
        'Computational Mechanics',
        'Environmental Modelling',
        'Other'
    ]);
    await expect(page.locator('.home-writing-row:visible')).toHaveCount(3);
    await expect(page.getByRole('article').filter({ hasText: 'Ungrouped Note' }).locator('img'))
        .toHaveAttribute('src', /images\/about_me\/utah\.webp$/);

    await page.getByRole('button', { name: 'Environmental Modelling', exact: true }).click();
    await expect(page.locator('.home-writing-row:visible')).toHaveCount(1);
    await expect(page.locator('.home-writing-row:visible .home-directory-title')).toHaveText('River Note');
    await expect(page.getByRole('button', { name: 'Environmental Modelling', exact: true }))
        .toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'All', exact: true }))
        .toHaveAttribute('aria-pressed', 'false');

    await page.locator('.language-toggle').click();
    await expect(page.locator('#about-p1')).toContainText('我与 Jinhui Yan 合作');
    await expect(page.locator('#about-p1 a')).toHaveAttribute(
        'href',
        'https://yan.cee.illinois.edu/'
    );
    await expect(page.locator('.home-writing-group-filter')).toHaveText([
        '全部',
        '计算力学',
        '环境建模',
        '其他'
    ]);
    await expect(page.locator('.home-writing-group-filter-label')).toHaveText('按主题筛选');
    await expect(page.getByRole('button', { name: '环境建模', exact: true }))
        .toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.home-writing-row:visible .home-directory-title')).toHaveText('河流笔记');
    await expect(page.locator('.home-writing-row:visible .home-writing-themes')).toHaveText('主题：环境建模');
    await expect(page.locator('.home-writing-row').first().locator('img'))
        .toHaveAttribute('alt', writings[0].previewImageAlt.chinese);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: '全部', exact: true }))
        .toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.home-writing-row:visible')).toHaveCount(3);
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
    await expect(firstPreview.locator('img')).toHaveAttribute(
        'src',
        /images\/writings\/am-bench-2025\/4\.3\.3_benchy_signed_deviation_rotations\.png$/
    );
    await expect(firstPreview.locator('img')).toHaveAttribute('alt', writings[0].previewImageAlt.english);
    await expect(firstPreview.locator('img')).toHaveCSS('object-fit', 'contain');

    const rowLayout = await page.locator('.home-writing-row').first().evaluate(row => {
        const rowRect = row.getBoundingClientRect();
        const titleRect = row.querySelector('.home-directory-title').getBoundingClientRect();
        const previewRect = row.querySelector('.home-writing-preview').getBoundingClientRect();
        const summaryRect = row.querySelector('.home-directory-summary').getBoundingClientRect();

        return {
            rowWidth: rowRect.width,
            titleWidth: titleRect.width,
            previewWidth: previewRect.width,
            summaryWidth: summaryRect.width,
            titleBottom: titleRect.bottom,
            summaryTop: summaryRect.top,
            summaryBottom: summaryRect.bottom,
            previewTop: previewRect.top
        };
    });

    expect(rowLayout.titleWidth).toBeGreaterThan(rowLayout.rowWidth * 0.6);
    expect(rowLayout.summaryWidth).toBeGreaterThan(rowLayout.rowWidth * 0.95);
    expect(rowLayout.previewWidth).toBeGreaterThan(rowLayout.rowWidth * 0.95);
    expect(rowLayout.summaryTop).toBeGreaterThanOrEqual(rowLayout.titleBottom);
    expect(rowLayout.previewTop).toBeGreaterThan(rowLayout.summaryBottom);

    const alignments = await page.locator('.home-writing-row').first().evaluate(row => {
        const selectors = [
            '.home-directory-title',
            '.home-directory-summary',
            '.home-directory-meta'
        ];

        return selectors.map(selector => {
            const element = row.querySelector(selector);
            return element ? window.getComputedStyle(element).textAlign : null;
        }).filter(Boolean);
    });

    expect(alignments.length).toBeGreaterThan(0);
    expect(alignments.every(alignment => ['left', 'start'].includes(alignment))).toBe(true);
    await expectNoHorizontalOverflow(page, '/');

    await page.locator('.nav-toggle').click();
    const menuLayout = await page.evaluate(() => {
        const navRect = document.querySelector('.contentHeader-placeholder header nav')?.getBoundingClientRect();
        const mainRect = document.querySelector('#main-content')?.getBoundingClientRect();
        const languageRect = document.querySelector('.language-toggle')?.getBoundingClientRect();
        const toggleRect = document.querySelector('.nav-toggle')?.getBoundingClientRect();

        return {
            navBottom: navRect?.bottom || 0,
            mainTop: mainRect?.top || 0,
            languageTop: languageRect?.top || 0,
            toggleTop: toggleRect?.top || 0
        };
    });

    expect(menuLayout.navBottom).toBeLessThanOrEqual(menuLayout.mainTop + 1);
    expect(Math.abs(menuLayout.languageTop - menuLayout.toggleTop)).toBeLessThanOrEqual(1);

    await context.close();
});

test('featured AM Bench writing has accurate metadata and a figure-only article body', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);

    await page.goto(featuredWritingRoute, { waitUntil: 'domcontentloaded' });

    const title = 'Computational Modelling of Vat Photopolymerization — AM Bench 2025 Challenge';
    const pageTitle = `${title} | Adam Lawrence`;
    const description = 'A first-place computational modelling submission for the AM Bench 2025 vat photopolymerization cure-depth challenge.';
    await expect(page).toHaveTitle(pageTitle);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://adamrlawrence.com${featuredWritingRoute}`
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', pageTitle);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        `https://adamrlawrence.com${featuredWritingRoute}`
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', pageTitle);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[name="twitter:url"]')).toHaveAttribute(
        'content',
        `https://adamrlawrence.com${featuredWritingRoute}`
    );
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('main > section')).toHaveCount(1);
    await expect(page.locator('main > section > *')).toHaveCount(1);
    await expect(page.locator('main :is(h2, h3, p, code)')).toHaveCount(0);
    const articleFigures = page.locator('.writing-figure');
    await expect(articleFigures).toHaveCount(1);
    await expect(articleFigures.locator('img')).toHaveCount(1);
    for (const image of await articleFigures.locator('img').all()) {
        await expect(image).toHaveAttribute('loading', 'lazy');
    }
    await expect(articleFigures.nth(0).locator('img')).toHaveAttribute(
        'src',
        /images\/writings\/am-bench-2025\/04_L439_3\.2_gpu_framework\.png$/
    );
    await expect(articleFigures.locator('figcaption')).toHaveCount(1);
    await expect(page.locator('.writing-dummy-figure, .writing-video-figure, iframe')).toHaveCount(0);
    await expect(page.locator('link[href$="lightbox.css"], script[src$="lightbox.js"]')).toHaveCount(0);
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).not.toHaveAttribute(
        'content',
        /frame-src/
    );
});

test('unlisted writings remain available but discourage indexing', async ({ page, request }) => {
    await stubSharedThirdPartyRequests(page);

    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBe(true);
    const sitemap = await sitemapResponse.text();

    for (const route of unlistedWritingRoutes) {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response, `Missing response for ${route}`).not.toBeNull();
        expect(response.status(), `Unexpected status for ${route}`).toBeLessThan(400);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
        expect(sitemap, `${route} should be absent from sitemap.xml`).not.toContain(route);
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

test('writing image viewer has a name and returns keyboard focus', async ({ page }) => {
    await stubSharedThirdPartyRequests(page);
    await page.goto('/writings/photopolymerization/', { waitUntil: 'domcontentloaded' });

    const trigger = page.locator('.writing-dummy-media');
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Antelope Island placeholder image' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
});

test('writing article mobile nav opens with primary links visible', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await stubSharedThirdPartyRequests(page);

    for (const route of allWritingArticleRoutes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.nav-toggle')).toBeVisible();
        await page.locator('.nav-toggle').click();

        const navLinks = page.locator('#header-nav-list a');
        await expect(navLinks).toHaveText(['Home', 'Publications', 'Resume']);
        await expect(navLinks.nth(0)).toBeVisible();
        await expect(navLinks.nth(1)).toBeVisible();
        await expect(navLinks.nth(2)).toBeVisible();
        await expect(page.locator('#header-resume')).not.toHaveAttribute('target', '_blank');
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
    await expect(page.locator('#home-writings-directory .home-writing-preview img').first()).toHaveAttribute(
        'src',
        /images\/writings\/am-bench-2025\/4\.3\.3_benchy_signed_deviation_rotations\.png$/
    );
    await expect(page.locator('#header-nav-list a')).toHaveText(['Home', 'Publications', 'Resume']);
    await expect(page.locator('#header-resume')).not.toHaveAttribute('target', '_blank');

    await page.goto('/publications/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.publications-list-item')).toContainText('A multi-GPU-centric finite element multiphysics modeling framework');

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
    await expect(page.locator('#resume-heading')).toHaveText('Resume');
    await expect(page.locator('.resume-intro')).toContainText('Current PDF resume');
    const sheetBox = await page.locator('.resume-sheet-link').boundingBox();
    expect(sheetBox.width).toBeGreaterThan(350);
    expect(sheetBox.height).toBeGreaterThan(450);
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
        ...allWritingArticleRoutes,
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

test('long writing title fits a narrow phone viewport', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 700 }, isMobile: true });
    const page = await context.newPage();
    await stubSharedThirdPartyRequests(page);

    await page.goto('/writings/photopolymerization/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toHaveText('Photopolymerization');
    await expectNoHorizontalOverflow(page, '/writings/photopolymerization/ at 320px');

    await context.close();
});
