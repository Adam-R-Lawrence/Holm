import { STORAGE_KEYS } from '../config.js';
import { all } from '../utils/dom.js';

const DARK_THEME_CLASS = 'dark-theme';

export function isDarkThemeEnabled() {
    return document.documentElement.classList.contains(DARK_THEME_CLASS);
}

export function updateThemeToggleVisuals() {
    const isDarkMode = isDarkThemeEnabled();

    all('.theme-moon').forEach(element => {
        element.hidden = isDarkMode;
    });

    all('.theme-sun').forEach(element => {
        element.hidden = !isDarkMode;
    });

    all('.theme-toggle').forEach(button => {
        button.setAttribute('aria-pressed', String(isDarkMode));
    });

    return isDarkMode;
}

export function applyInitialThemePreference() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme === 'dark') {
        document.documentElement.classList.add(DARK_THEME_CLASS);
    } else if (savedTheme === 'light') {
        document.documentElement.classList.remove(DARK_THEME_CLASS);
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle(DARK_THEME_CLASS, Boolean(prefersDark));
    }

    return updateThemeToggleVisuals();
}

export function toggleTheme() {
    document.documentElement.classList.toggle(DARK_THEME_CLASS);
    const isDarkMode = updateThemeToggleVisuals();
    localStorage.setItem(STORAGE_KEYS.theme, isDarkMode ? 'dark' : 'light');
    return isDarkMode;
}
