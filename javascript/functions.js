'use strict';

// Constants for GitHub API
const GITHUB_USERNAME = 'Adam-R-Lawrence'; // Replace with your GitHub username
const GITHUB_REPO = 'Holm';               // Replace with your repository name
const commitsApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`;

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
function toggleLanguage() {
    // Select language toggle icons
    const englishIcon = document.getElementById('language-english');
    const chineseIcon = document.getElementById('language-chinese');

    // Determine if the current language is Chinese by checking the display style
    const isChinese = chineseIcon.style.display === 'inline';

    // Toggle the display styles of the language icons
    englishIcon.style.display = isChinese ? 'inline' : 'none';
    chineseIcon.style.display = isChinese ? 'none' : 'inline';

    // Save the current language preference to localStorage
    localStorage.setItem('language', isChinese ? 'english' : 'chinese');
}

/**
 * Applies saved user preferences for theme and language upon page load.
 */
function applyPreferences() {
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

    // Update language icon visibility based on the current language
    englishIcon.style.display = isChinese ? 'none' : 'inline';
    chineseIcon.style.display = isChinese ? 'inline' : 'none';
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
 * Displays the last updated date based on the latest GitHub commit.
 * Utilizes caching to minimize API requests.
 */
async function displayLastUpdated() {
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
 * Initializes the application by loading all common components
 * and applying user preferences.
 */
async function initialize() {
    try {
        // Load footer first to ensure it's available for the sidebar observer
        await loadFooter();

        // Load sidebar and content header in parallel
        await Promise.all([loadSidebar(), loadContentHeader()]);

        // Apply user preferences for theme and language
        applyPreferences();

        // Add a fade-in effect to the body for smooth visual transition
        document.body.classList.add('fade-in');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initialize);

/* Highlight.js plugins and setup */
hljs.addPlugin(new CopyButtonPlugin());
hljs.highlightAll();

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre code').forEach(block => {
        highlightjsCopy(block);
    });
});
