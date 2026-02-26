import { loadAnalytics, loadContentHeader, loadFooter } from './features/fragments.js';
import { displayLastUpdated } from './features/lastUpdated.js';
import { applyInitialThemePreference, toggleTheme } from './features/theme.js';
import {
    applyLanguageDomState,
    applyTranslations,
    getActiveLanguage,
    getPreferredLanguage,
    persistLanguage,
    setActiveLanguage,
    updateLanguageToggleVisuals
} from './i18n/localization.js';
import { loadProjectsPage } from './pages/projectsPage.js';
import { loadPublicationsPage } from './pages/publicationsPage.js';
import { loadWritingsPage } from './pages/writingsPage.js';
import { all } from './utils/dom.js';

function inferPageFromPath(pathname) {
    const path = pathname.toLowerCase();

    if (/\/projects\//.test(path)) {
        return 'projects';
    }
    if (/\/writings\//.test(path)) {
        return 'writings';
    }
    if (/\/publications\//.test(path)) {
        return 'publications';
    }
    if (/\/resume\//.test(path)) {
        return 'resume';
    }

    return 'about-me';
}

function setActiveNav() {
    all('.contentHeader-placeholder nav a').forEach(anchor => {
        anchor.removeAttribute('aria-current');
    });

    const pageElement = document.querySelector('[data-page]');
    const page = pageElement?.getAttribute('data-page') || inferPageFromPath(window.location.pathname);

    const navMap = {
        'about-me': ['header-home'],
        projects: ['header-projects'],
        writings: ['header-writings'],
        publications: ['header-publications'],
        resume: ['header-resume']
    };

    (navMap[page] || []).forEach(id => {
        const anchor = document.getElementById(id);
        if (anchor && anchor.tagName.toLowerCase() === 'a') {
            anchor.setAttribute('aria-current', 'page');
        }
    });
}

function initializeHighlighting() {
    if (!window.hljs) {
        return;
    }

    if (!window.__holmCopyButtonRegistered
        && typeof window.CopyButtonPlugin !== 'undefined'
        && typeof window.hljs.addPlugin === 'function') {
        try {
            window.hljs.addPlugin(new window.CopyButtonPlugin());
            window.__holmCopyButtonRegistered = true;
        } catch (_) {
            // Ignore plugin failures and continue with base highlighting.
        }
    }

    try {
        window.hljs.highlightAll();
        if (typeof window.highlightjsCopy === 'function') {
            document.querySelectorAll('pre code').forEach(block => {
                window.highlightjsCopy(block);
            });
        }
    } catch (error) {
        console.warn('Highlight.js initialization skipped:', error);
    }
}

function bindShellControls() {
    all('.theme-toggle').forEach(button => {
        if (button.dataset.holmBoundTheme === 'true') {
            return;
        }
        button.addEventListener('click', () => {
            handleThemeToggle();
        });
        button.dataset.holmBoundTheme = 'true';
    });

    all('.language-toggle').forEach(button => {
        if (button.dataset.holmBoundLanguage === 'true') {
            return;
        }
        button.addEventListener('click', () => {
            void handleLanguageToggle();
        });
        button.dataset.holmBoundLanguage = 'true';
    });

    bindMobileNavToggle();
}

function bindMobileNavToggle() {
    const header = document.querySelector('.contentHeader-placeholder header');
    const toggle = header?.querySelector('.nav-toggle');
    const nav = header?.querySelector('nav');

    if (!header || !toggle || !nav || toggle.dataset.holmBoundNav === 'true') {
        return;
    }

    const openIcon = toggle.querySelector('.menu-open');
    const closeIcon = toggle.querySelector('.menu-close');

    const setOpenState = isOpen => {
        header.classList.toggle('nav-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        if (openIcon) {
            openIcon.hidden = isOpen;
        }
        if (closeIcon) {
            closeIcon.hidden = !isOpen;
        }
    };

    const closeMenu = () => {
        setOpenState(false);
    };

    toggle.addEventListener('click', () => {
        const isOpen = header.classList.contains('nav-open');
        setOpenState(!isOpen);
    });

    nav.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', () => {
            closeMenu();
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    document.addEventListener('click', event => {
        if (!header.contains(event.target)) {
            closeMenu();
        }
    });

    const mobileQuery = window.matchMedia('(max-width: 58rem)');
    const syncWithViewport = () => {
        if (!mobileQuery.matches) {
            closeMenu();
        }
    };

    if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', syncWithViewport);
    } else if (typeof mobileQuery.addListener === 'function') {
        mobileQuery.addListener(syncWithViewport);
    }

    setOpenState(false);
    toggle.dataset.holmBoundNav = 'true';
}

export async function refreshDynamicContent() {
    await Promise.all([
        loadProjectsPage(),
        loadPublicationsPage(),
        loadWritingsPage()
    ]);
}

async function applyUserPreferences() {
    const language = setActiveLanguage(getPreferredLanguage());
    applyLanguageDomState(language);
    updateLanguageToggleVisuals(language);

    applyInitialThemePreference();
    await applyTranslations(language);
}

export async function handleLanguageToggle() {
    const newLanguage = getActiveLanguage() === 'chinese' ? 'english' : 'chinese';
    persistLanguage(newLanguage);
    setActiveLanguage(newLanguage);

    applyLanguageDomState(newLanguage);
    updateLanguageToggleVisuals(newLanguage);
    await applyTranslations(newLanguage);

    await refreshDynamicContent();
    await displayLastUpdated();
}

export function handleThemeToggle() {
    toggleTheme();
}

export async function initializeSiteApp() {
    try {
        await loadAnalytics();
        await loadFooter();
        await loadContentHeader();
        bindShellControls();

        setActiveNav();
        await applyUserPreferences();
        await refreshDynamicContent();
        await displayLastUpdated();
        initializeHighlighting();
    } catch (error) {
        console.error('Error during initialization:', error);
    }

    return {
        toggleTheme: handleThemeToggle,
        toggleLanguage: handleLanguageToggle,
        refreshDynamicContent,
        displayLastUpdated
    };
}
