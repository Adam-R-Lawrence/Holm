'use strict';


// Constants for GitHub API
const GITHUB_USERNAME = 'Adam-R-Lawrence'; // Replace with your GitHub username
const GITHUB_REPO = 'Holm';               // Replace with your repository name
const BASE_PATH = window.location.pathname.startsWith(`/${GITHUB_REPO}`) ? `/${GITHUB_REPO}` : '';
// Limit results to the most recent commit to minimize payload size
const commitsApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits?per_page=1`;


// Cache for fetched translation data
const translationCache = {};

// Maps language keys to JSON files
const translationFiles = {
    english: `${BASE_PATH}/data/translations_en.json`,
    chinese: `${BASE_PATH}/data/translations_zh.json`
};

/**
 * Retrieves translation data for a language, fetching it once and caching the result.
 * @param {string} language
 * @returns {Promise<Object|null>}
 */
async function getTranslations(language) {
    if (translationCache[language]) {
        return translationCache[language];
    }

    const file = translationFiles[language];
    if (!file) {
        return null;
    }

    try {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error('Failed to load ' + file);
        }
        const data = await response.json();
        translationCache[language] = data;
        return data;
    } catch (error) {
        console.error('Error loading translations:', error);
        return null;
    }
}

/**
 * Applies translated text to elements based on the selected language.
 * @param {string} language - 'english' or 'chinese'
 */
async function applyTranslations(language) {
    const dict = await getTranslations(language);
    if (!dict) {
        return;
    }

    Object.entries(dict).forEach(([id, text]) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = text;
        }
    });
}

/**
 * Toggles the sidebar logo images based on the current theme (dark or light).
 */
function toggleImagesForDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-theme');

    // Select all logo images within the sidebar
    const logos = document.querySelectorAll('#sidebar-logos img');
    logos.forEach(img => {
        const src = img.getAttribute('src');
        let newSrc;

        if (isDarkMode) {
            // Replace '_black' with '_white', case-insensitive
            newSrc = src.replace(/_black/i, '_white');
        } else {
            // Replace '_white' with '_black', case-insensitive
            newSrc = src.replace(/_white/i, '_black');
        }

        // Update the image source if it has changed
        if (newSrc !== src) {
            img.src = newSrc;
        }
    });
}

/**
 * Toggles between dark and light themes for the website.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDarkMode = document.body.classList.contains('dark-theme');

    // Update all theme icons (header + sidebar)
    document.querySelectorAll('.theme-moon').forEach(el => {
        el.style.display = isDarkMode ? 'none' : 'inline';
    });
    document.querySelectorAll('.theme-sun').forEach(el => {
        el.style.display = isDarkMode ? 'inline' : 'none';
    });

    // Update aria-pressed on all theme toggles
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(isDarkMode));
    });

    toggleImagesForDarkMode();
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

/**
 * Toggles between English and Chinese languages for the website.
 */
async function toggleLanguage() {
    const isChinese = document.body.classList.contains('chinese');
    const newLanguage = isChinese ? 'english' : 'chinese';

    // Update all language toggle icons (header + sidebar)
    document.querySelectorAll('.language-english').forEach(el => {
        el.style.display = isChinese ? 'inline' : 'none';
    });
    document.querySelectorAll('.language-chinese').forEach(el => {
        el.style.display = isChinese ? 'none' : 'inline';
    });

    // Update aria-pressed on all language toggles
    document.querySelectorAll('.language-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(newLanguage === 'chinese'));
    });

    localStorage.setItem('language', newLanguage);
    await applyTranslations(newLanguage);
    document.body.classList.toggle('chinese', newLanguage === 'chinese');
    // Update document language for accessibility/SEO
    document.documentElement.setAttribute('lang', newLanguage === 'chinese' ? 'zh' : 'en');
    displayLastUpdated();
}

/**
 * Applies saved user preferences for theme and language upon page load.
 */
async function applyPreferences() {
    // Determine the preferred language from storage or browser settings
    let language = localStorage.getItem('language');
    if (!language) {
        let browserLang = '';
        if (navigator.languages && navigator.languages.length > 0) {
            browserLang = navigator.languages[0];
        } else if (navigator.language) {
            browserLang = navigator.language;
        }
        browserLang = browserLang.toLowerCase();
        language = browserLang.startsWith('zh') ? 'chinese' : 'english';
        localStorage.setItem('language', language);
    }
    const isChinese = language === 'chinese';

    // Apply saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
    }
    const isDarkMode = document.body.classList.contains('dark-theme');

    // Update all theme icons visibility
    document.querySelectorAll('.theme-moon').forEach(el => {
        el.style.display = isDarkMode ? 'none' : 'inline';
    });
    document.querySelectorAll('.theme-sun').forEach(el => {
        el.style.display = isDarkMode ? 'inline' : 'none';
    });

    // Toggle sidebar images to match the theme
    toggleImagesForDarkMode();

    // Update all language icons visibility
    document.querySelectorAll('.language-english').forEach(el => {
        el.style.display = isChinese ? 'inline' : 'none';
    });
    document.querySelectorAll('.language-chinese').forEach(el => {
        el.style.display = isChinese ? 'none' : 'inline';
    });

    // Initialize aria-pressed on toggles (buttons handle role/tabindex natively)
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(isDarkMode));
    });
    document.querySelectorAll('.language-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(isChinese));
    });

    // Apply translations and font for the chosen preference
    await applyTranslations(language);
    document.body.classList.toggle('chinese', isChinese);
    // Ensure root lang reflects active language
    document.documentElement.setAttribute('lang', isChinese ? 'zh' : 'en');

    // Update the footer year and last updated date after applying translations
    displayLastUpdated();
}

/**
 * Loads the sidebar HTML content and initializes its behaviors.
 * @returns {Promise<void>}
 */
function loadSidebar() {
    return fetch(`${BASE_PATH}/commonDivsHTML/sidebar.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load sidebar.html');
            }
            return response.text();
        })
        .then(data => {
            // Insert the sidebar content into the placeholder
            const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
            if (sidebarPlaceholder) {
                sidebarPlaceholder.innerHTML = data;
                sidebarPlaceholder.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src');
                    if (src && !src.startsWith('http') && !src.startsWith('/')) {
                        img.src = `${BASE_PATH}/${src}`;
                    }
                });
                sidebarPlaceholder.querySelectorAll('a').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                        a.href = `${BASE_PATH}/${href}`;
                    }
                });
            } else {
                console.warn('Sidebar placeholder not found.');
            }
            // Initialize IntersectionObserver for sidebar height adjustment
            initializeSidebarObserver();
        })
        .catch(error => {
            console.error('Error loading sidebar:', error);
        });
}


/**
 * Initializes the IntersectionObserver to adjust sidebar height based on footer visibility.
 */
function initializeSidebarObserver() {
    const footer = document.querySelector('footer');
    const sidebar = document.getElementById('sidebar');

    if (!footer) {
        console.warn('Footer element not found for IntersectionObserver.');
        return;
    }

    if (!sidebar) {
        console.warn('Sidebar element not found for IntersectionObserver.');
        return;
    }

    // On small or touch devices let the sidebar expand naturally without
    // dynamic height adjustments. This avoids content being clipped on
    // mobile where available viewport height is limited.
    const mobileQuery = window.matchMedia(
        '(max-width: 500px), (max-height: 500px), (pointer: none), (pointer: coarse)'
    );
    if (mobileQuery.matches) {
        sidebar.style.height = 'auto';
        return;
    }

    /**
     * Callback function for IntersectionObserver.
     * Adjusts the sidebar height based on whether the footer is visible.
     * @param {IntersectionObserverEntry[]} entries
     */
    const callback = function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Change the height of sidebar when the footer is visible
                sidebar.style.height = '94vh'; // Desired height when footer is visible
            } else {
                // Reset the height when the footer is not visible
                sidebar.style.height = '98vh'; // Original height
            }
        });
    };

    // Create the IntersectionObserver with the callback and options
    const observer = new IntersectionObserver(callback, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });

    // Start observing the footer element
    observer.observe(footer);
}

/**
 * Loads the footer HTML content.
 * @returns {Promise<void>}
 */
function loadFooter() {
    return fetch(`${BASE_PATH}/commonDivsHTML/footer.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load footer.html');
            }
            return response.text();
        })
        .then(data => {
            // Insert the footer content into the placeholder
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = data;
            } else {
                console.warn('Footer placeholder not found.');
            }

            // Display the last updated date
            displayLastUpdated();
        })
        .catch(error => {
            console.error('Error loading footer:', error);
        });
}

/**
 * Loads the content header HTML content.
 * @returns {Promise<void>}
 */
function loadContentHeader() {
    return fetch(`${BASE_PATH}/commonDivsHTML/contentHeader.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load contentHeader.html');
            }
            return response.text();
        })
        .then(data => {
            // Insert the content header into the placeholder
            const contentHeaderPlaceholder = document.getElementById('contentHeader-placeholder');
            if (contentHeaderPlaceholder) {
                contentHeaderPlaceholder.innerHTML = data;
                contentHeaderPlaceholder.querySelectorAll('a').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith('mailto:')) {
                        a.href = `${BASE_PATH}/${href}`;
                    }
                });
            } else {
                console.warn('Content header placeholder not found.');
            }

            // Display the last updated date
            displayLastUpdated();
        })
        .catch(error => {
            console.error('Error loading content header:', error);
        });
}

/**
 * Loads the Google Analytics script block and inserts it into the page head.
 * @returns {Promise<void>}
 */
function loadAnalytics() {
    return fetch(`${BASE_PATH}/commonDivsHTML/analytics.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load analytics.html');
            }
            return response.text();
        })
        .then(data => {
            document.head.insertAdjacentHTML('afterbegin', data);
        })
        .catch(error => {
            console.error('Error loading analytics:', error);
        });
}

/**
 * Displays the last updated date based on the latest GitHub commit.
 * Utilizes caching to minimize API requests.
 */
async function displayLastUpdated() {
    // Insert the current year into the footer text if a placeholder exists
    const currentYear = new Date().getFullYear();
    const footerTextElement = document.getElementById('footer-text');
    if (footerTextElement) {
        footerTextElement.innerHTML = footerTextElement.innerHTML.replace('%YEAR%', currentYear);
    }
    const cacheKey = 'lastUpdatedDate';
    const cacheTimeKey = 'lastUpdatedTime';
    const cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds

    const cachedDate = localStorage.getItem(cacheKey);
    const cachedTime = parseInt(localStorage.getItem(cacheTimeKey) || '0', 10);
    const now = Date.now();

    // Check if cached data is available and still valid
    if (cachedDate && cachedTime && (now - cachedTime) < cacheDuration) {
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = cachedDate;
        }
        return;
    }

    try {
        // Fetch the latest commits from GitHub
        const response = await fetch(commitsApiUrl);
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const commits = await response.json();
        if (commits.length === 0) {
            const lastUpdatedElement = document.getElementById('last-updated');
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = 'No commits found.';
            }
            return;
        }

        // Extract the date of the latest commit
        const latestCommitDate = new Date(commits[0].commit.committer.date);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = latestCommitDate.toLocaleDateString(undefined, options);

        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = formattedDate;
        }

        // Cache the result for future use
        localStorage.setItem(cacheKey, formattedDate);
        localStorage.setItem(cacheTimeKey, now);
    } catch (error) {
        console.error('Error fetching the latest commit:', error);
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = 'Unavailable';
        }
    }
}

/**
 * Loads project data from a JSON file and populates the projects grid.
 */
function loadProjectsData() {
    const grid = document.getElementById('projects-grid');
    if (!grid) {
        return; // Exit if not on the projects page
    }

    fetch(`${BASE_PATH}/data/projects.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load projects.json');
            }
            return response.json();
        })
        .then(projects => {
            grid.innerHTML = '';
            projects.forEach(project => {
                const item = document.createElement('div');
                item.className = 'project-item';

                const link = document.createElement('a');
                link.href = `${BASE_PATH}/${project.link}`;

                const title = document.createElement('h2');
                title.textContent = project.title;

                const desc = document.createElement('p');
                desc.textContent = project.description || '';

                const img = document.createElement('img');
                img.src = `${BASE_PATH}/${project.image}`;
                img.alt = project.title + ' image';
                img.className = 'content-image';
                img.loading = 'lazy';

                link.appendChild(title);
                if (project.description) {
                    link.appendChild(desc);
                }
                link.appendChild(img);

                item.appendChild(link);
                grid.appendChild(item);
            });
        })
        .catch(error => console.error('Error loading projects:', error));
}

/**
 * Loads publication data from a JSON file and populates the publications directory.
 */
function loadPublicationsData() {
    const directory = document.getElementById('publications-directory');
    if (!directory) {
        return; // Exit if not on the publications page
    }

    fetch(`${BASE_PATH}/data/publications.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load publications.json');
            }
            return response.json();
        })
        .then(publications => {
            directory.innerHTML = '';

            const list = document.createElement('ul');
            list.id = 'publications-list';

            publications.forEach(pub => {
                const item = document.createElement('li');

                const linkEl = document.createElement(pub.link ? 'a' : 'span');
                if (pub.link) {
                    linkEl.href = `${BASE_PATH}/${pub.link}`;
                }
                linkEl.textContent = pub.title;

                item.appendChild(linkEl);

                const details = [];
                if (pub.authors) details.push(pub.authors);
                if (pub.venue) details.push(pub.venue);
                if (pub.year) details.push(pub.year);

                if (details.length > 0) {
                    item.appendChild(document.createTextNode(' - ' + details.join(', ')));
                }

                list.appendChild(item);
            });

            directory.appendChild(list);
        })
        .catch(error => console.error('Error loading publications:', error));
}

/**
 * Loads writing data from a JSON file and populates the writings directory.
 */
function loadWritingsData() {
    const directory = document.getElementById('writings-directory');
    const filterContainer = document.getElementById('writing-filter-controls');
    if (!directory) {
        return; // Exit if not on the writings page
    }

    fetch(`${BASE_PATH}/data/writings.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load writings.json');
            }
            return response.json();
        })
        .then(writings => {
            directory.innerHTML = '';

            const items = [];
            writings.forEach(writing => {
                const item = document.createElement('div');
                item.className = 'writing-item';
                if (writing.themes) {
                    item.dataset.themes = writing.themes.join(',');
                }

                const content = document.createElement('div');
                content.className = 'writing-content';

                const link = document.createElement('a');
                link.href = `${BASE_PATH}/${writing.link}`;
                link.textContent = writing.title;

                content.appendChild(link);

                if (writing.summary) {
                    const summary = document.createElement('p');
                    summary.className = 'explanatory-text';
                    summary.textContent = writing.summary;
                    content.appendChild(summary);
                }

                if (writing.themes && writing.themes.length > 0) {
                    const themes = document.createElement('p');
                    themes.className = 'writing-themes';
                    themes.textContent = 'Topic: ' + writing.themes.join(', ');
                    content.appendChild(themes);
                }

                const meta = document.createElement('div');
                meta.className = 'writing-meta';

                const dateDiv = document.createElement('div');
                dateDiv.className = 'date';

                const dateObj = new Date(writing.date);
                if (isNaN(dateObj)) {
                    dateDiv.textContent = writing.date;
                } else {
                    const monthDay = document.createElement('span');
                    monthDay.className = 'month-day';
                    monthDay.textContent = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ',';

                    const year = document.createElement('span');
                    year.className = 'year';
                    year.textContent = dateObj.getFullYear();

                    dateDiv.appendChild(monthDay);
                    dateDiv.appendChild(year);
                }

                meta.appendChild(dateDiv);

                item.appendChild(content);
                item.appendChild(meta);
                directory.appendChild(item);
                items.push(item);
            });

            if (filterContainer) {
                const themes = [...new Set(writings.flatMap(w => w.themes || []))];
                const select = document.createElement('select');
                select.id = 'theme-filter';

                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = 'All Themes';
                select.appendChild(allOption);

                themes.forEach(theme => {
                    const opt = document.createElement('option');
                    opt.value = theme;
                    opt.textContent = theme;
                    select.appendChild(opt);
                });

                filterContainer.appendChild(select);

                select.addEventListener('change', () => {
                    const val = select.value;
                    items.forEach(item => {
                        if (val === 'all') {
                            item.style.display = 'flex';
                        } else {
                            const itemThemes = item.dataset.themes ? item.dataset.themes.split(',') : [];
                            item.style.display = itemThemes.includes(val) ? 'flex' : 'none';
                        }
                    });
                });
            }
        })
        .catch(error => console.error('Error loading writings:', error));
}

/**
 * Initializes the application by loading all common components
 * and applying user preferences.
 */
async function initialize() {
    try {
        // Set initial theme based on system preference if no saved value exists
        if (!localStorage.getItem('theme')) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }

        // Load Google Analytics snippet
        await loadAnalytics();

        // Load footer first to ensure it's available for the sidebar observer
        await loadFooter();

        // Load sidebar and content header in parallel
        await Promise.all([loadSidebar(), loadContentHeader()]);

        // Mark the active navigation item
        setActiveNav();

        // Apply user preferences for theme and language
        await applyPreferences();

        // Dynamically build project tiles if on the projects page
        loadProjectsData();

        // Load publication list if on the publications page
        loadPublicationsData();

        // Dynamically build writing entries if on the writings page
        loadWritingsData();

        // No fade-in animation to respect reduced motion preferences
        // Initialize highlight.js only if loaded
        if (window.hljs) {
            try {
                hljs.highlightAll();
                if (typeof highlightjsCopy === 'function') {
                    document.querySelectorAll('pre code').forEach(block => {
                        highlightjsCopy(block);
                    });
                }
            } catch (e) {
                console.warn('Highlight.js initialization skipped:', e);
            }
        }

        // Buttons already support keyboard activation; no extra handlers needed

    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);

/* Highlight.js plugin setup (guarded) */
if (window.hljs && typeof CopyButtonPlugin !== 'undefined' && typeof hljs.addPlugin === 'function') {
    try { hljs.addPlugin(new CopyButtonPlugin()); } catch (_) {}
}

/**
 * Sets aria-current="page" on the active navigation links (header + sidebar).
 */
function setActiveNav() {
    // Clear existing aria-current attributes
    document.querySelectorAll('#sidebar-navbar a, .contentHeader-placeholder nav a').forEach(a => {
        a.removeAttribute('aria-current');
    });

    // Determine current section
    const pageEl = document.querySelector('[data-page]');
    let page = pageEl ? pageEl.getAttribute('data-page') : '';

    // Map data-page to nav ids
    const map = {
        'about-me': ['nav-home', 'header-home'],
        'projects': ['nav-projects', 'header-projects'],
        'writings': ['nav-writings', 'header-writings'],
        'publications': ['nav-publications']
    };

    // Fallback: infer from path if data-page is missing
    if (!page) {
        const p = window.location.pathname;
        if (/\/projects\//.test(p)) page = 'projects';
        else if (/\/writings\//.test(p)) page = 'writings';
        else if (/\/publications\//.test(p)) page = 'publications';
        else page = 'about-me';
    }

    const ids = map[page] || [];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.tagName.toLowerCase() === 'a') {
            el.setAttribute('aria-current', 'page');
        }
    });
}
