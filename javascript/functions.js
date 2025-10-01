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

let activeLanguage = 'english';

const localizedCopy = {
    english: {
        publications: {
            filterYearLabel: 'Year',
            filterTypeLabel: 'Type',
            filterSearchLabel: 'Search',
            searchPlaceholder: 'Title, authors, venue',
            allYears: 'All Years',
            allTypes: 'All Types',
            noMatches: 'No publications match the selected filters.',
            undatedHeading: 'Undated',
            typeLabels: {
                journal: 'Journal',
                conference: 'Conference',
                poster: 'Poster',
                thesis: 'Thesis',
                book: 'Book',
                preprint: 'Preprint',
                other: 'Other'
            }
        },
        writings: {
            filterLabel: 'Filter by theme',
            allThemes: 'All Themes',
            topicPrefix: 'Topic: ',
            noMatches: 'No writings match the selected filter.'
        }
    },
    chinese: {
        publications: {
            filterYearLabel: '年份',
            filterTypeLabel: '类型',
            filterSearchLabel: '搜索',
            searchPlaceholder: '标题、作者或刊物',
            allYears: '全部年份',
            allTypes: '全部类型',
            noMatches: '没有符合筛选条件的出版物。',
            undatedHeading: '未注明年份',
            typeLabels: {
                journal: '期刊',
                conference: '会议',
                poster: '海报',
                thesis: '论文',
                book: '图书',
                preprint: '预印本',
                other: '其他'
            }
        },
        writings: {
            filterLabel: '按主题筛选',
            allThemes: '全部主题',
            topicPrefix: '主题：',
            noMatches: '暂无符合条件的文章。'
        }
    }
};

const setActiveLanguage = language => {
    activeLanguage = language === 'chinese' ? 'chinese' : 'english';
};

const getCopy = (section, key) => {
    const languageCopy = localizedCopy[activeLanguage] || localizedCopy.english;
    const fallbackCopy = localizedCopy.english;
    const sectionCopy = languageCopy?.[section] || {};
    const fallbackSection = fallbackCopy?.[section] || {};
    if (key === 'typeLabels') {
        return sectionCopy.typeLabels || fallbackSection.typeLabels || {};
    }
    return sectionCopy[key] || fallbackSection[key] || '';
};

const publicationTypeLabel = type => {
    const labels = getCopy('publications', 'typeLabels');
    const key = (type || 'other').toString().toLowerCase();
    if (labels[key]) {
        return labels[key];
    }
    return key.replace(/(^|[-_\s])(\w)/g, (_, __, ch) => ch.toUpperCase());
};

const getLocalizedText = (value, fallback = '') => {
    if (typeof value === 'string') {
        return value;
    }
    if (value && typeof value === 'object') {
        return value[activeLanguage] || value.english || value.en || fallback;
    }
    return fallback;
};

const resolvePath = path => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('data:')) {
        return path;
    }
    const sanitized = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_PATH}/${sanitized}`;
};

const resolvePublicationLink = raw => {
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || raw.startsWith('mailto:')) {
        return raw;
    }
    if (raw.startsWith('doi:')) {
        return `https://doi.org/${raw.replace(/^doi:/i, '')}`;
    }
    if (/^10\.\d{4,9}\//.test(raw)) {
        return `https://doi.org/${raw}`;
    }
    const sanitized = raw.startsWith('/') ? raw.slice(1) : raw;
    return `${BASE_PATH}/${sanitized}`;
};

const slugify = text => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
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
    const isDarkMode = document.documentElement.classList.contains('dark-theme');

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
    document.documentElement.classList.toggle('dark-theme');
    const isDarkMode = document.documentElement.classList.contains('dark-theme');

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
    const isCurrentlyChinese = document.body.classList.contains('chinese');
    const newLanguage = isCurrentlyChinese ? 'english' : 'chinese';

    // Update all language toggle icons (header + sidebar)
    document.querySelectorAll('.language-english').forEach(el => {
        el.style.display = newLanguage === 'chinese' ? 'inline' : 'none';
    });
    document.querySelectorAll('.language-chinese').forEach(el => {
        el.style.display = newLanguage === 'chinese' ? 'none' : 'inline';
    });

    // Update aria-pressed on all language toggles
    document.querySelectorAll('.language-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', String(newLanguage === 'chinese'));
    });

    localStorage.setItem('language', newLanguage);
    setActiveLanguage(newLanguage);
    await applyTranslations(newLanguage);
    document.body.classList.toggle('chinese', newLanguage === 'chinese');
    // Update document language for accessibility/SEO
    document.documentElement.setAttribute('lang', newLanguage === 'chinese' ? 'zh' : 'en');
    refreshDynamicContent();
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
    setActiveLanguage(language);
    const isChinese = language === 'chinese';

    // Apply saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
    } else if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark-theme');
    }
    const isDarkMode = document.documentElement.classList.contains('dark-theme');

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

function refreshDynamicContent() {
    loadProjectsData();
    loadPublicationsData();
    loadWritingsData();
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
            (projects || []).forEach(project => {
                const item = document.createElement('div');
                item.className = 'project-item';

                const link = document.createElement('a');
                const href = resolvePath(project.link);
                if (href) {
                    link.href = href;
                }

                const titleText = getLocalizedText(project.title, project.title?.english || project.title || '');
                const descText = getLocalizedText(project.description, project.description || '');
                const altText = getLocalizedText(project.imageAlt, `${titleText} image`);

                const title = document.createElement('h2');
                title.textContent = titleText;
                link.appendChild(title);

                if (descText) {
                    const desc = document.createElement('p');
                    desc.textContent = descText;
                    link.appendChild(desc);
                }

                if (project.image) {
                    const img = document.createElement('img');
                    img.src = resolvePath(project.image);
                    img.alt = altText;
                    img.className = 'content-image';
                    img.loading = 'lazy';
                    img.decoding = 'async';
                    link.appendChild(img);
                }

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
    const yearFilter = document.getElementById('publication-year-filter');
    const typeFilter = document.getElementById('publication-type-filter');
    const searchInput = document.getElementById('publication-search');
    if (!directory) {
        return; // Exit if not on the publications page
    }
    const yearLabel = document.querySelector('label[for="publication-year-filter"]');
    const typeLabel = document.querySelector('label[for="publication-type-filter"]');
    const searchLabel = document.querySelector('label[for="publication-search"]');

    if (yearLabel) yearLabel.textContent = getCopy('publications', 'filterYearLabel');
    if (typeLabel) typeLabel.textContent = getCopy('publications', 'filterTypeLabel');
    if (searchLabel) searchLabel.textContent = getCopy('publications', 'filterSearchLabel');

    const previousYear = yearFilter ? yearFilter.value : 'all';
    const previousType = typeFilter ? typeFilter.value : 'all';
    const previousSearch = searchInput ? searchInput.value : '';

    if (searchInput) {
        searchInput.placeholder = getCopy('publications', 'searchPlaceholder');
        searchInput.setAttribute('aria-label', getCopy('publications', 'filterSearchLabel'));
        searchInput.value = previousSearch;
    }

    let allPublications = [];

    fetch(`${BASE_PATH}/data/publications.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load publications.json');
            }
            return response.json();
        })
        .then(publications => {
            const sourcePublications = (publications || []).filter(pub => {
                if (!pub) {
                    return false;
                }
                if (pub.hidden === true) {
                    return false;
                }
                if (pub.visible === false) {
                    return false;
                }
                if (pub.draft === true) {
                    return false;
                }
                return true;
            });

            allPublications = sourcePublications.map(pub => {
                const yearNum = typeof pub.year === 'string' ? parseInt(pub.year, 10) : pub.year;
                const type = (pub.type || 'other').toString().toLowerCase();
                const link = resolvePublicationLink(pub.link || '');
                const title = pub.title || '';
                const authors = pub.authors || '';
                const venue = pub.venue || '';
                const typeLabel = publicationTypeLabel(type);
                return {
                    title,
                    authors,
                    venue,
                    year: Number.isFinite(yearNum) ? yearNum : null,
                    type,
                    typeLabel,
                    link,
                    searchText: [title, authors, venue, typeLabel].filter(Boolean).join(' ').toLowerCase()
                };
            }).sort((a, b) => {
                if (a.year && b.year && a.year !== b.year) {
                    return b.year - a.year;
                }
                return a.title.localeCompare(b.title);
            });

            const years = Array.from(new Set(allPublications.filter(pub => pub.year).map(pub => pub.year))).sort((a, b) => b - a);
            const types = Array.from(new Set(allPublications.map(pub => pub.type))).sort();

            if (yearFilter) {
                yearFilter.innerHTML = '';
                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = getCopy('publications', 'allYears');
                yearFilter.appendChild(allOption);
                years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = String(year);
                    option.textContent = String(year);
                    yearFilter.appendChild(option);
                });
                if (previousYear !== 'all' && years.includes(parseInt(previousYear, 10))) {
                    yearFilter.value = previousYear;
                } else {
                    yearFilter.value = 'all';
                }
            }

            if (typeFilter) {
                typeFilter.innerHTML = '';
                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = getCopy('publications', 'allTypes');
                typeFilter.appendChild(allOption);
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = publicationTypeLabel(type);
                    typeFilter.appendChild(option);
                });
                if (previousType !== 'all' && types.includes(previousType)) {
                    typeFilter.value = previousType;
                } else {
                    typeFilter.value = 'all';
                }
            }

            const render = () => {
                const selectedYear = yearFilter ? yearFilter.value : 'all';
                const selectedType = typeFilter ? typeFilter.value : 'all';
                const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

                const filtered = allPublications.filter(pub => {
                    const yearMatch = selectedYear === 'all' || (pub.year && String(pub.year) === selectedYear);
                    const typeMatch = selectedType === 'all' || pub.type === selectedType;
                    const searchMatch = !searchTerm || pub.searchText.includes(searchTerm);
                    return yearMatch && typeMatch && searchMatch;
                });

                directory.innerHTML = '';

                if (filtered.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'directory-empty-state';
                empty.textContent = getCopy('publications', 'noMatches');
                directory.appendChild(empty);
                return;
            }

            const grouped = filtered.reduce((map, pub) => {
                    const key = pub.year ? String(pub.year) : 'Other';
                    if (!map.has(key)) {
                        map.set(key, []);
                    }
                    map.get(key).push(pub);
                    return map;
                }, new Map());

                const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
                    if (a === 'Other') return 1;
                    if (b === 'Other') return -1;
                    return parseInt(b, 10) - parseInt(a, 10);
                });

                sortedKeys.forEach(yearKey => {
                const section = document.createElement('section');
                section.className = 'publications-year-group directory-group';
                section.dataset.year = yearKey;

                const heading = document.createElement('h2');
                heading.textContent = yearKey === 'Other' ? getCopy('publications', 'undatedHeading') : yearKey;
                section.appendChild(heading);

                const list = document.createElement('ul');
                list.className = 'publications-list directory-list';

                grouped.get(yearKey).sort((a, b) => a.title.localeCompare(b.title)).forEach(pub => {
                    const item = document.createElement('li');
                    item.className = 'publications-list-item directory-card';
                    item.dataset.type = pub.type;

                    const titleContainer = document.createElement('div');
                    titleContainer.className = 'publication-title-line directory-card-title-line';

                    const typeBadge = document.createElement('span');
                    typeBadge.className = 'publication-type directory-badge';
                    typeBadge.textContent = publicationTypeLabel(pub.type);
                    titleContainer.appendChild(typeBadge);

                    const titleEl = document.createElement(pub.link ? 'a' : 'span');
                    titleEl.className = 'publication-title directory-card-title';
                    if (pub.link) {
                        titleEl.href = pub.link;
                        if (/^https?:\/\//i.test(pub.link)) {
                            titleEl.rel = 'noopener';
                            titleEl.target = '_blank';
                            }
                        }
                        titleEl.textContent = pub.title;
                        titleContainer.appendChild(titleEl);

                        item.appendChild(titleContainer);

                        const meta = [];
                        if (pub.authors) meta.push(pub.authors);
                        if (pub.venue) meta.push(pub.venue);

                        if (meta.length > 0) {
                        const metaEl = document.createElement('p');
                        metaEl.className = 'publication-meta directory-muted';
                        metaEl.textContent = meta.join(' · ');
                        item.appendChild(metaEl);
                    }

                    list.appendChild(item);
                    });

                    section.appendChild(list);
                    directory.appendChild(section);
                });
            };

            if (yearFilter) yearFilter.onchange = render;
            if (typeFilter) typeFilter.onchange = render;
            if (searchInput) searchInput.oninput = render;

            render();
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

    if (filterContainer) {
        filterContainer.classList.add('directory-toolbar');
    }

    const previousFilterValue = filterContainer?.querySelector('select')?.value || 'all';

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
            const themeLabels = new Map();

            const normalizeThemes = themeList => {
                if (!Array.isArray(themeList)) {
                    return { ids: [], labels: [] };
                }
                const ids = [];
                const labels = [];
                themeList.forEach(theme => {
                    if (!theme) {
                        return;
                    }
                    if (typeof theme === 'string') {
                        const id = slugify(theme);
                        if (!id) return;
                        ids.push(id);
                        labels.push(getLocalizedText({ english: theme }, theme));
                    } else if (typeof theme === 'object') {
                        const labelSource = theme.label || theme;
                        const labelText = getLocalizedText(labelSource, labelSource?.english || '');
                        const id = theme.id || theme.slug || slugify(labelText);
                        if (!id) {
                            return;
                        }
                        ids.push(id);
                        labels.push(labelText);
                    }
                });
                return { ids, labels };
            };

            (writings || []).forEach(writing => {
                const item = document.createElement('div');
                item.className = 'writing-item directory-card';

                const { ids: themeIds, labels: themeLabelList } = normalizeThemes(writing.themes);
                if (themeIds.length > 0) {
                    item.dataset.themes = themeIds.join(',');
                }

                const content = document.createElement('div');
                content.className = 'writing-content';

                const link = document.createElement('a');
                const href = resolvePath(writing.link);
                if (href) {
                    link.href = href;
                }
                const titleText = getLocalizedText(writing.title, writing.title?.english || '');
                link.className = 'writing-title directory-card-title';
                link.textContent = titleText;
                content.appendChild(link);

                const summaryText = getLocalizedText(writing.summary, '');
                if (summaryText) {
                    const summary = document.createElement('p');
                    summary.className = 'explanatory-text directory-muted';
                    summary.textContent = summaryText;
                    content.appendChild(summary);
                }

                if (themeLabelList.length > 0) {
                    const themes = document.createElement('p');
                    themes.className = 'writing-themes directory-muted';
                    themes.textContent = getCopy('writings', 'topicPrefix') + themeLabelList.join(', ');
                    content.appendChild(themes);
                }

                const meta = document.createElement('div');
                meta.className = 'writing-meta directory-muted';

                const dateDiv = document.createElement('div');
                dateDiv.className = 'date';

                const dateObj = new Date(writing.date);
                if (isNaN(dateObj)) {
                    dateDiv.textContent = writing.date || '';
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

                themeIds.forEach((id, index) => {
                    if (!themeLabels.has(id)) {
                        themeLabels.set(id, themeLabelList[index]);
                    }
                });
            });

            const emptyState = document.createElement('p');
            emptyState.className = 'directory-empty-state';
            emptyState.textContent = getCopy('writings', 'noMatches');
            emptyState.style.display = 'none';
            directory.appendChild(emptyState);

            const applyThemeFilter = value => {
                let visibleCount = 0;
                items.forEach(item => {
                    if (value === 'all') {
                        item.style.display = 'flex';
                        visibleCount += 1;
                        return;
                    }
                    const itemThemes = item.dataset.themes ? item.dataset.themes.split(',') : [];
                    const match = itemThemes.includes(value);
                    item.style.display = match ? 'flex' : 'none';
                    if (match) {
                        visibleCount += 1;
                    }
                });
                emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
            };

            if (filterContainer) {
                filterContainer.innerHTML = '';
                if (themeLabels.size > 0) {
                    filterContainer.style.display = '';
                    const field = document.createElement('div');
                    field.className = 'toolbar-field';

                    const label = document.createElement('label');
                    label.setAttribute('for', 'theme-filter');
                    label.textContent = getCopy('writings', 'filterLabel');

                    const select = document.createElement('select');
                    select.id = 'theme-filter';

                    const allOption = document.createElement('option');
                    allOption.value = 'all';
                    allOption.textContent = getCopy('writings', 'allThemes');
                    select.appendChild(allOption);

                    Array.from(themeLabels.entries())
                        .sort((a, b) => a[1].localeCompare(b[1]))
                        .forEach(([id, labelText]) => {
                            const option = document.createElement('option');
                            option.value = id;
                            option.textContent = labelText;
                            select.appendChild(option);
                        });

                    const desiredValue = previousFilterValue !== 'all' && themeLabels.has(previousFilterValue)
                        ? previousFilterValue
                        : 'all';
                    select.value = desiredValue;

                    field.appendChild(label);
                    field.appendChild(select);
                    filterContainer.appendChild(field);

                    select.addEventListener('change', () => {
                        applyThemeFilter(select.value);
                    });

                    applyThemeFilter(select.value);
                } else {
                    filterContainer.style.display = 'none';
                    emptyState.style.display = items.length === 0 ? 'block' : 'none';
                }
            } else {
                applyThemeFilter('all');
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
                document.documentElement.classList.add('dark-theme');
            } else {
                document.documentElement.classList.remove('dark-theme');
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
