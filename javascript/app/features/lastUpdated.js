import { COMMITS_API_URL, LAST_UPDATED_CACHE_MS, STORAGE_KEYS } from '../config.js';
import { byId } from '../utils/dom.js';

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

function getCachedLastUpdatedDate() {
    const cachedDate = localStorage.getItem(STORAGE_KEYS.lastUpdatedDate);
    const cachedTime = Number.parseInt(localStorage.getItem(STORAGE_KEYS.lastUpdatedTime) || '0', 10);
    const isFresh = cachedDate && cachedTime && (Date.now() - cachedTime) < LAST_UPDATED_CACHE_MS;
    return isFresh ? cachedDate : null;
}

function cacheLastUpdatedDate(formattedDate) {
    localStorage.setItem(STORAGE_KEYS.lastUpdatedDate, formattedDate);
    localStorage.setItem(STORAGE_KEYS.lastUpdatedTime, String(Date.now()));
}

async function fetchLatestCommitDate() {
    const response = await fetch(COMMITS_API_URL);
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits = await response.json();
    if (!Array.isArray(commits) || commits.length === 0) {
        return 'No commits found.';
    }

    const latestCommitDate = new Date(commits[0].commit.committer.date);
    return latestCommitDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export async function displayLastUpdated() {
    replaceFooterYearPlaceholder();

    const cachedDate = getCachedLastUpdatedDate();
    if (cachedDate) {
        setLastUpdatedText(cachedDate);
        return cachedDate;
    }

    try {
        const latestDate = await fetchLatestCommitDate();
        setLastUpdatedText(latestDate);
        cacheLastUpdatedDate(latestDate);
        return latestDate;
    } catch (error) {
        console.error('Error fetching the latest commit:', error);
        setLastUpdatedText('Unavailable');
        return null;
    }
}
