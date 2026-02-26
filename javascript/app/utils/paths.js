import { BASE_PATH } from '../config.js';

const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:)?\/\//i;
const SPECIAL_SCHEME_PATTERN = /^(?:mailto|tel|data|javascript):/i;

const stripLeadingSlashes = value => value.replace(/^\/+/, '');

export const isExternalUrl = value => ABSOLUTE_URL_PATTERN.test(value);

export function withBasePath(path) {
    const normalized = stripLeadingSlashes(path || '');
    if (!normalized) {
        return BASE_PATH || '/';
    }
    return BASE_PATH ? `${BASE_PATH}/${normalized}` : `/${normalized}`;
}

export function resolvePath(path) {
    if (!path) {
        return '';
    }

    const raw = String(path).trim();
    if (!raw) {
        return '';
    }

    if (isExternalUrl(raw) || SPECIAL_SCHEME_PATTERN.test(raw) || raw.startsWith('#')) {
        return raw;
    }

    if (raw.startsWith('/')) {
        return BASE_PATH ? `${BASE_PATH}${raw}` : raw;
    }

    return withBasePath(raw);
}

export function resolveSiteHref(href) {
    if (!href) {
        return '';
    }

    const raw = String(href).trim();
    if (!raw) {
        return '';
    }

    if (raw.startsWith('#') || isExternalUrl(raw) || SPECIAL_SCHEME_PATTERN.test(raw)) {
        return raw;
    }

    if (raw.startsWith('/')) {
        return BASE_PATH ? `${BASE_PATH}${raw}` : raw;
    }

    return withBasePath(raw);
}

export function resolvePublicationLink(rawLink) {
    if (!rawLink) {
        return '';
    }

    const raw = String(rawLink).trim();
    if (!raw) {
        return '';
    }

    if (isExternalUrl(raw) || raw.startsWith('mailto:')) {
        return raw;
    }

    if (raw.startsWith('doi:')) {
        return `https://doi.org/${raw.replace(/^doi:/i, '')}`;
    }

    if (/^10\.\d{4,9}\//.test(raw)) {
        return `https://doi.org/${raw}`;
    }

    return resolveSiteHref(raw);
}

export function slugify(value) {
    if (!value) {
        return '';
    }

    return value
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function normalizeRelativeAssets(rootNode) {
    if (!rootNode) {
        return;
    }

    rootNode.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        if (!src) {
            return;
        }
        img.setAttribute('src', resolvePath(src));
    });

    rootNode.querySelectorAll('a[href]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href) {
            return;
        }
        anchor.setAttribute('href', resolveSiteHref(href));
    });
}
