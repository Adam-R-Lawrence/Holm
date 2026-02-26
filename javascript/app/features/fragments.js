import { FRAGMENT_FILES } from '../config.js';
import { byId } from '../utils/dom.js';
import { fetchTextCached } from '../utils/fetch.js';
import { normalizeRelativeAssets } from '../utils/paths.js';

async function loadIntoPlaceholder(placeholderId, fragmentPath, options = {}) {
    const { cacheKey = fragmentPath, normalizeAssets = false } = options;
    const placeholder = byId(placeholderId);
    if (!placeholder) {
        return null;
    }

    const html = await fetchTextCached(fragmentPath, { cacheKey });
    placeholder.innerHTML = html;

    if (normalizeAssets) {
        normalizeRelativeAssets(placeholder);
    }

    return placeholder;
}

export async function loadAnalytics() {
    if (document.head.dataset.holmAnalyticsLoaded === 'true') {
        return;
    }

    try {
        const analyticsHtml = await fetchTextCached(FRAGMENT_FILES.analytics, { cacheKey: 'fragment:analytics' });
        document.head.insertAdjacentHTML('afterbegin', analyticsHtml);
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() {
            window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', 'G-4PHH3RMS01');
        document.head.dataset.holmAnalyticsLoaded = 'true';
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

export async function loadFooter() {
    const placeholder = byId('footer-placeholder');
    if (!placeholder) {
        return;
    }

    try {
        const footerHtml = await fetchTextCached(FRAGMENT_FILES.footer, { cacheKey: 'fragment:footer' });

        if (placeholder.tagName.toLowerCase() === 'footer') {
            const template = document.createElement('template');
            template.innerHTML = footerHtml.trim();
            const footerNode = template.content.querySelector('footer');
            placeholder.innerHTML = footerNode ? footerNode.innerHTML : footerHtml;
        } else {
            placeholder.innerHTML = footerHtml;
        }
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

export async function loadContentHeader() {
    try {
        await loadIntoPlaceholder('contentHeader-placeholder', FRAGMENT_FILES.contentHeader, {
            cacheKey: 'fragment:content-header',
            normalizeAssets: true
        });
    } catch (error) {
        console.error('Error loading content header:', error);
    }
}
