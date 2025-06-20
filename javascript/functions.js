'use strict';
// Redirect to custom 404 page for invalid routes
document.addEventListener("DOMContentLoaded", () => {
    const validRoutes = [
        "",
        "index.html",
        "projects.html",
        "publications.html",
        "resume.html",
        "writings.html",
        "projects/Ostium.html",
        "projects/Torrentem.html",
        "projects/Vadum.html",
        "writings/numerical_modelling_of_photopolymerization.html",
        "404.html"
    ];
    let path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (!validRoutes.includes(path)) {
        window.location.replace("/404.html");
    }
});


// Constants for GitHub API
const GITHUB_USERNAME = 'Adam-R-Lawrence'; // Replace with your GitHub username
const GITHUB_REPO = 'Holm';               // Replace with your repository name
// Limit results to the most recent commit to minimize payload size
const commitsApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits?per_page=1`;


// Cache for fetched translation data
const translationCache = {};

// Maps language keys to JSON files
const translationFiles = {
    english: '/data/translations_en.json',
    chinese: '/data/translations_zh.json'
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
    // Toggle the 'dark-theme' class on the body element
    document.body.classList.toggle('dark-theme');
    const isDarkMode = document.body.classList.contains('dark-theme');

    // Select theme toggle icons
    const lightThemeIcon = document.getElementById('theme-moon');
    const darkThemeIcon = document.getElementById('theme-sun');

    // Update icon visibility based on the current theme
    lightThemeIcon.style.display = isDarkMode ? 'none' : 'inline';
    darkThemeIcon.style.display = isDarkMode ? 'inline' : 'none';

    // Toggle sidebar images to match the theme
    toggleImagesForDarkMode();

    // Save the current theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

/**
 * Toggles between English and Chinese languages for the website.
 */
async function toggleLanguage() {
    // Select language toggle icons
    const englishIcon = document.getElementById('language-english');
    const chineseIcon = document.getElementById('language-chinese');

    // Determine the current language from the body class
    const isChinese = document.body.classList.contains('chinese');

    // Show the icon for the language the user can switch to
    englishIcon.style.display = isChinese ? 'inline' : 'none';
    chineseIcon.style.display = isChinese ? 'none' : 'inline';

    const newLanguage = isChinese ? 'english' : 'chinese';

    // Save the current language preference to localStorage
    localStorage.setItem('language', newLanguage);

    // Apply the chosen language
    await applyTranslations(newLanguage);
    document.body.classList.toggle('chinese', newLanguage === 'chinese');

    // Refresh the "Last Updated" date after the footer text is re-rendered
    displayLastUpdated();
}

/**
 * Applies saved user preferences for theme and language upon page load.
 */
async function applyPreferences() {
    // Retrieve language preference from localStorage
    const isChinese = localStorage.getItem('language') === 'chinese';

    // Apply saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
    const isDarkMode = document.body.classList.contains('dark-theme');

    // Select theme toggle icons
    const darkThemeIcon = document.getElementById('theme-sun');
    const lightThemeIcon = document.getElementById('theme-moon');

    // Select language toggle icons
    const englishIcon = document.getElementById('language-english');
    const chineseIcon = document.getElementById('language-chinese');

    // Update theme icon visibility based on the current theme
    lightThemeIcon.style.display = isDarkMode ? 'none' : 'inline';
    darkThemeIcon.style.display = isDarkMode ? 'inline' : 'none';

    // Toggle sidebar images to match the theme
    toggleImagesForDarkMode();

    // Update language icon visibility so the user sees the alternate option
    englishIcon.style.display = isChinese ? 'inline' : 'none';
    chineseIcon.style.display = isChinese ? 'none' : 'inline';

    // Apply translations and font for the stored preference
    await applyTranslations(isChinese ? 'chinese' : 'english');
    document.body.classList.toggle('chinese', isChinese);

    // Update the footer year and last updated date after applying translations
    displayLastUpdated();
}

/**
 * Loads the sidebar HTML content and initializes its behaviors.
 * @returns {Promise<void>}
 */
function loadSidebar() {
    return fetch('/commonDivsHTML/sidebar.html')
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
            } else {
                console.warn('Sidebar placeholder not found.');
            }

            // Highlight the navigation item matching the current page
            highlightActiveNav();

            // Initialize IntersectionObserver for sidebar height adjustment
            initializeSidebarObserver();
        })
        .catch(error => {
            console.error('Error loading sidebar:', error);
        });
}

/**
 * Adds an 'active' class to the sidebar navigation item that
 * corresponds to the current page path.
 */
function highlightActiveNav() {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();

    let navId = '';
    if (path === '' || path === 'index.html') {
        navId = 'nav-home';
    } else if (path.startsWith('projects')) {
        navId = 'nav-projects';
    } else if (path.startsWith('writings')) {
        navId = 'nav-writings';
    } else if (path.startsWith('publications')) {
        navId = 'nav-publications';
    } else if (path.startsWith('resume')) {
        navId = 'nav-resume';
    }

    if (navId) {
        const navLink = document.getElementById(navId);
        if (navLink && navLink.parentElement) {
            navLink.parentElement.classList.add('active');
        }
    }
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
    return fetch('/commonDivsHTML/footer.html')
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
    return fetch('/commonDivsHTML/contentHeader.html')
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
    return fetch('/commonDivsHTML/analytics.html')
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
    const cachedTime = localStorage.getItem(cacheTimeKey);
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

    fetch('/data/projects.json')
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
                link.href = project.link;

                const title = document.createElement('h2');
                title.textContent = project.title;

                const desc = document.createElement('p');
                desc.textContent = project.description || '';

                const img = document.createElement('img');
                img.src = project.image;
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

    fetch('/data/publications.json')
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

                const link = document.createElement('a');
                link.href = pub.link;
                link.textContent = pub.title;

                item.appendChild(link);

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

    fetch('/data/writings.json')
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
                if (writing.year) {
                    item.dataset.year = writing.year;
                }

                const content = document.createElement('div');
                content.className = 'writing-content';

                const link = document.createElement('a');
                link.href = writing.link;
                link.textContent = writing.title;

                content.appendChild(link);

                if (writing.summary) {
                    const summary = document.createElement('p');
                    summary.className = 'explanatory-text';
                    summary.textContent = writing.summary;
                    content.appendChild(summary);
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
                const years = [...new Set(writings.map(w => w.year).filter(Boolean))];
                const select = document.createElement('select');
                select.id = 'year-filter';

                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = 'All Years';
                select.appendChild(allOption);

                years.forEach(year => {
                    const opt = document.createElement('option');
                    opt.value = year;
                    opt.textContent = year;
                    select.appendChild(opt);
                });

                filterContainer.appendChild(select);

                select.addEventListener('change', () => {
                    const val = select.value;
                    items.forEach(item => {
                        item.style.display = (val === 'all' || item.dataset.year === val) ? 'flex' : 'none';
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

        // Apply user preferences for theme and language
        await applyPreferences();

        // Dynamically build project tiles if on the projects page
        loadProjectsData();

        // Load publication list if on the publications page
        loadPublicationsData();

        // Dynamically build writing entries if on the writings page
        loadWritingsData();

        // Add a fade-in effect to the body for smooth visual transition
        document.body.classList.add('fade-in');
        // Initialize highlight.js after the content is loaded so that
        // theme preferences are applied correctly
        hljs.highlightAll();
        document.querySelectorAll('pre code').forEach(block => {
            highlightjsCopy(block);
        });

    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);

/* Highlight.js plugins and setup */
hljs.addPlugin(new CopyButtonPlugin());
