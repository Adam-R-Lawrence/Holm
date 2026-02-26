import { appState } from '../state.js';

async function fetchWithCheck(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url} (${response.status})`);
    }
    return response;
}

export async function fetchJsonCached(url, options = {}) {
    const { cacheKey = url, force = false } = options;
    if (!force && appState.jsonCache.has(cacheKey)) {
        return appState.jsonCache.get(cacheKey);
    }

    const response = await fetchWithCheck(url);
    const data = await response.json();
    appState.jsonCache.set(cacheKey, data);
    return data;
}

export async function fetchTextCached(url, options = {}) {
    const { cacheKey = url, force = false } = options;
    if (!force && appState.textCache.has(cacheKey)) {
        return appState.textCache.get(cacheKey);
    }

    const response = await fetchWithCheck(url);
    const data = await response.text();
    appState.textCache.set(cacheKey, data);
    return data;
}
