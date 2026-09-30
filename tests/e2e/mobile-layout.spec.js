const { test, expect } = require('@playwright/test');

const viewports = [
    { width: 320, height: 700 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 }
];

async function stubExternalContent(page) {
    await page.route('**/repos/Adam-R-Lawrence/Holm/commits?**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ commit: { committer: { date: '2026-02-20T12:00:00Z' } } }])
    }));
    await page.route(/^https:\/\/www\.youtube-nocookie\.com\/embed(?:\/|\?)/, route => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Video fixture</title>'
    }));
}

for (const viewport of viewports) {
    test(`mobile layouts preserve content and touch controls at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await stubExternalContent(page);
        const routes = ['/', '/publications/', '/resume/', '/writings/numerical_modelling_of_photopolymerization/'];
        for (const route of routes) {
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');
            for (const selector of ['.theme-toggle', '.nav-toggle', '.language-toggle']) {
                const control = await page.locator(selector).boundingBox();
                expect(control.width, `${selector} width on ${route}`).toBeGreaterThanOrEqual(44);
                expect(control.height, `${selector} height on ${route}`).toBeGreaterThanOrEqual(44);
            }
            const bounds = await page.evaluate(() => ({
                viewport: document.documentElement.clientWidth,
                document: document.documentElement.scrollWidth,
                body: document.body.scrollWidth,
                main: document.querySelector('main').getBoundingClientRect().toJSON()
            }));
            expect(Math.max(bounds.document, bounds.body), route).toBeLessThanOrEqual(bounds.viewport + 1);
            expect(bounds.main.left, `${route} left gutter`).toBeGreaterThanOrEqual(16);
            expect(bounds.main.right, `${route} right gutter`).toBeLessThanOrEqual(bounds.viewport - 15);

            if (route === '/') {
                for (const link of await page.locator('.home-profile-links a').all()) {
                    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
                }
                const frame = await page.locator('.home-video-frame').boundingBox();
                expect(frame.width / frame.height).toBeCloseTo(16 / 9, 1);
            }

            if (route === '/resume/') {
                await expect.poll(() => page.locator('.resume-sheet').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
                const image = await page.locator('.resume-sheet').boundingBox();
                const link = await page.locator('.resume-sheet-link').boundingBox();
                expect(image.x).toBeGreaterThanOrEqual(link.x - 1);
                expect(image.x + image.width).toBeLessThanOrEqual(link.x + link.width + 1);
                expect(image.y + image.height).toBeLessThanOrEqual(link.y + link.height + 1);
                await expect(page.locator('.resume-sheet')).toHaveCSS('margin-left', '0px');
                for (const action of await page.locator('.resume-action').all()) {
                    expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(44);
                }
            }

            await page.locator('.nav-toggle').click();
            for (const link of await page.locator('#header-nav-menu a').all()) {
                await expect(link).toBeVisible();
                expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
            }
            await page.locator('.nav-toggle').click();
        }
    });
}

test('mobile header stays available while scrolling and its menu label translates', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubExternalContent(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');
    await expect(page.locator('#header-menu-label')).toHaveText('Menu');
    await page.evaluate(() => window.scrollTo(0, 350));
    await expect.poll(() => page.locator('#contentHeader-placeholder').evaluate(header =>
        Math.abs(header.getBoundingClientRect().top)
    )).toBeLessThanOrEqual(1);
    await expect(page.locator('.nav-toggle')).toBeInViewport();
    await page.locator('.language-toggle').click();
    await expect(page.locator('#header-menu-label')).toHaveText('菜单');
    await page.locator('.nav-toggle').click();
    await expect(page.getByRole('link', { name: '出版物', exact: true })).toBeVisible();
});
