import { COMMITS_API_URL, LAST_UPDATED_CACHE_MS, STORAGE_KEYS } from '../config.js';
import { getActiveLanguage } from '../i18n/localization.js';
import { byId } from '../utils/dom.js';
import { getStoredValue, setStoredValue } from '../utils/storage.js';

function replaceFooterYearPlaceholder() {
    const footerText = byId('footer-text');
    if (!footerText) {
        return;
    }

    const currentYear = new Date().getFullYear();
    const markup = footerText.innerHTML;
    if (markup.includes('%YEAR%')) {
        footerText.innerHTML = markup.replace(/%YEAR%/g, String(currentYear));
    }
}

function setLastUpdatedText(value) {
    const label = byId('last-updated');
    if (label) {
        label.textContent = value;
    }
}

function formatLastUpdatedDate(isoDate) {
    const locale = getActiveLanguage() === 'chinese' ? 'zh-CN' : 'en-US';
    return new Date(isoDate).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getCachedLastUpdatedDate() {
    const cachedDate = getStoredValue(STORAGE_KEYS.lastUpdatedDate);
    const cachedTime = Number.parseInt(getStoredValue(STORAGE_KEYS.lastUpdatedTime) || '0', 10);
    const cacheAge = Date.now() - cachedTime;
    const isIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(cachedDate || '');
    return isIsoDate && Number.isFinite(Date.parse(cachedDate))
        && cacheAge >= 0 && cacheAge < LAST_UPDATED_CACHE_MS ? cachedDate : null;
}

function cacheLastUpdatedDate(isoDate) {
    setStoredValue(STORAGE_KEYS.lastUpdatedDate, isoDate);
    setStoredValue(STORAGE_KEYS.lastUpdatedTime, String(Date.now()));
}

async function fetchLatestCommitDate() {
    const response = await fetch(COMMITS_API_URL);
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();
    if (!Array.isArray(commits) || commits.length === 0) {
        throw new Error('No commits found.');
    }

    return new Date(commits[0]?.commit?.committer?.date).toISOString();
}

export async function displayLastUpdated() {
    replaceFooterYearPlaceholder();

    const cachedDate = getCachedLastUpdatedDate();
    if (cachedDate) {
        const formattedDate = formatLastUpdatedDate(cachedDate);
        setLastUpdatedText(formattedDate);
        return formattedDate;
    }

    try {
        const isoDate = await fetchLatestCommitDate();
        const formattedDate = formatLastUpdatedDate(isoDate);
        setLastUpdatedText(formattedDate);
        cacheLastUpdatedDate(isoDate);
        return formattedDate;
    } catch (error) {
        console.error('Error fetching the latest commit:', error);
        setLastUpdatedText('Unavailable');
        return null;
    }
}
