'use strict';

(() => {
    const detectBasePath = () => {
        const scripts = Array.from(document.scripts || []);
        const scriptElement = document.currentScript
            || scripts.find(script => /\/javascript\/functions\.js(?:[?#].*)?$/.test(script.src || ''));

        if (!scriptElement || !scriptElement.src) {
            return '';
        }

        try {
            const scriptUrl = new URL(scriptElement.src, window.location.href);
            const basePath = scriptUrl.pathname.replace(/\/javascript\/functions\.js$/, '');
            return basePath === '/' ? '' : basePath;
        } catch {
            return '';
        }
    };

    window.__HOLM_BASE_PATH__ = detectBasePath();

    let appApi = {
        toggleTheme: () => {},
        toggleLanguage: async () => {},
        refreshDynamicContent: async () => {},
        displayLastUpdated: async () => {}
    };

    window.toggleTheme = () => {
        if (appApi && typeof appApi.toggleTheme === 'function') {
            appApi.toggleTheme();
        }
    };

    window.toggleLanguage = () => {
        if (appApi && typeof appApi.toggleLanguage === 'function') {
            return appApi.toggleLanguage();
        }
        return Promise.resolve();
    };

    window.refreshDynamicContent = () => {
        if (appApi && typeof appApi.refreshDynamicContent === 'function') {
            return appApi.refreshDynamicContent();
        }
        return Promise.resolve();
    };

    window.displayLastUpdated = () => {
        if (appApi && typeof appApi.displayLastUpdated === 'function') {
            return appApi.displayLastUpdated();
        }
        return Promise.resolve();
    };

    const boot = async () => {
        try {
            const { initializeSiteApp } = await import('./app/bootstrap.js');
            appApi = await initializeSiteApp();
        } catch (error) {
            console.error('Failed to initialize site scripts:', error);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            void boot();
        }, { once: true });
    } else {
        void boot();
    }
})();
