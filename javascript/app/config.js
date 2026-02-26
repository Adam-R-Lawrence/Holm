export const GITHUB_USERNAME = 'Adam-R-Lawrence';
export const GITHUB_REPO = 'Holm';

function normalizeBasePath(path) {
    if (!path || path === '/') {
        return '';
    }
    return path.endsWith('/') ? path.slice(0, -1) : path;
}

function deriveBasePath() {
    const injectedBasePath = normalizeBasePath(window.__HOLM_BASE_PATH__);
    if (injectedBasePath) {
        return injectedBasePath;
    }

    if (window.location.pathname === `/${GITHUB_REPO}` || window.location.pathname.startsWith(`/${GITHUB_REPO}/`)) {
        return `/${GITHUB_REPO}`;
    }

    return '';
}

export const BASE_PATH = deriveBasePath();

export const COMMITS_API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits?per_page=1`;

export const STORAGE_KEYS = Object.freeze({
    theme: 'theme',
    language: 'language',
    lastUpdatedDate: 'lastUpdatedDate',
    lastUpdatedTime: 'lastUpdatedTime'
});

export const LAST_UPDATED_CACHE_MS = 60 * 60 * 1000;

export const FRAGMENT_FILES = Object.freeze({
    analytics: `${BASE_PATH}/commonDivsHTML/analytics.html`,
    footer: `${BASE_PATH}/commonDivsHTML/footer.html`,
    contentHeader: `${BASE_PATH}/commonDivsHTML/contentHeader.html`
});

export const DATA_FILES = Object.freeze({
    projects: `${BASE_PATH}/data/projects.json`,
    publications: `${BASE_PATH}/data/publications.json`,
    writings: `${BASE_PATH}/data/writings.json`
});

export const TRANSLATION_FILES = Object.freeze({
    english: `${BASE_PATH}/data/translations_en.json`,
    chinese: `${BASE_PATH}/data/translations_zh.json`
});
