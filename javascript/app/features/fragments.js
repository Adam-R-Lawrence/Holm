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
            const contactNode = template.content.querySelector('.site-contact');
            const footerNode = template.content.querySelector('footer');

            if (contactNode && !placeholder.previousElementSibling?.classList.contains('site-contact')) {
                placeholder.insertAdjacentElement('beforebegin', contactNode.cloneNode(true));
            }

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
