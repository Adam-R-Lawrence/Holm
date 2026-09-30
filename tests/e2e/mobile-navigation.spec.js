const { test, expect } = require('@playwright/test');

const phoneViewport = { width: 390, height: 844 };

test.use({ viewport: phoneViewport });

test.beforeEach(async ({ page }) => {
    await page.route('**/repos/Adam-R-Lawrence/Holm/commits?**', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ commit: { committer: { date: '2026-02-20T12:00:00Z' } } }])
    }));
    await page.route(/^https:\/\/www\.youtube-nocookie\.com\/embed(?:\/|\?)/, route => route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Stubbed YouTube embed</title>'
    }));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#last-updated')).toHaveText('February 20, 2026');
    await expect(page.locator('.nav-toggle')).toBeVisible();
});

test('mobile primary links use the current tab and Resume opens its page', async ({ page }) => {
    await page.locator('.nav-toggle').click();
    for (const id of ['header-home', 'header-publications', 'header-resume']) {
        await expect(page.locator(`#${id}`)).not.toHaveAttribute('target', '_blank');
    }

    await Promise.all([
        page.waitForURL('**/resume/'),
        page.locator('#header-resume').click()
    ]);
    await expect(page.getByRole('heading', { name: 'Resume', exact: true })).toBeVisible();
    expect(page.context().pages()).toHaveLength(1);
});

test('Escape closes the mobile menu and returns keyboard focus to its toggle', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#header-nav-menu');
    await toggle.click();
    await page.locator('#header-publications').focus();
    await expect(page.locator('#header-publications')).toBeFocused();
    await page.keyboard.press('Escape');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.language-toggle')).toBeFocused();
});

test('an outside click closes the mobile menu without taking focus from the clicked link', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    const outsideLink = page.locator('#home-resume-link');
    // Keep this click on the current page to inspect its resulting focus.
    await outsideLink.evaluate(link => link.addEventListener('click', event => event.preventDefault()));
    await toggle.click();
    await page.locator('#header-home').focus();
    await outsideLink.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#header-nav-menu')).toBeHidden();
    await expect(outsideLink).toBeFocused();
});

test('resizing to desktop closes the mobile disclosure and keeps primary links available', async ({ page }) => {
    const toggle = page.locator('.nav-toggle');
    const nav = page.locator('#header-nav-menu');
    await toggle.click();
    await page.locator('#header-publications').focus();
    await page.setViewportSize({ width: 1280, height: 900 });

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeHidden();
    await expect(nav).toBeVisible();
    await expect(page.locator('#header-publications')).toBeFocused();
    for (const id of ['header-home', 'header-publications', 'header-resume']) {
        await expect(page.locator(`#${id}`)).toBeVisible();
    }

    await page.setViewportSize(phoneViewport);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
});
