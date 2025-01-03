// functions.js

function toggleImagesForDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-theme');

    const logos = document.querySelectorAll('#sidebar-logos img');
    logos.forEach(img => {
        const src = img.getAttribute('src');
        if (isDarkMode) {
            // Replace '_black' with '_white', case-insensitive
            const newSrc = src.replace(/_black/i, '_white');
            if (newSrc !== src) {
                img.src = newSrc;
            }
        } else {
            // Replace '_white' with '_black', case-insensitive
            const newSrc = src.replace(/_white/i, '_black');
            if (newSrc !== src) {
                img.src = newSrc;
            }
        }
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');

    const isDarkMode = document.body.classList.contains('dark-theme');

    const lightThemeIcon = document.getElementById('theme-moon');
    const darkThemeIcon = document.getElementById('theme-sun');

    lightThemeIcon.style.display = isDarkMode ? "none" : "inline";
    darkThemeIcon.style.display = isDarkMode ? "inline" : "none";

    toggleImagesForDarkMode();

    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

function toggleLanguage() {
    const englishIcon = document.getElementById('language-english');
    const chineseIcon = document.getElementById('language-chinese');

    // Determine if the current language is Chinese by checking the display style of the chineseIcon
    const isChinese = chineseIcon.style.display === 'inline';

    // Toggle the display styles
    englishIcon.style.display = isChinese ? 'inline' : 'none';
    chineseIcon.style.display = isChinese ? 'none' : 'inline';

    // Update the local storage setting
    localStorage.setItem('language', isChinese ? 'english' : 'chinese');
}

// Function to apply saved preferences
function applyPreferences() {
    const isChinese = localStorage.getItem('language') === "chinese";

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    const isDarkMode = document.body.classList.contains('dark-theme');


    const darkThemeIcon = document.getElementById('theme-sun');
    const lightThemeIcon = document.getElementById('theme-moon');
    const englishIcon = document.getElementById('language-english');
    const chineseIcon = document.getElementById('language-chinese');

    lightThemeIcon.style.display = isDarkMode ? "none" : "inline";
    darkThemeIcon.style.display = isDarkMode ? "inline" : "none";

    toggleImagesForDarkMode();

    englishIcon.style.display = isChinese ? 'none' : 'inline';
    chineseIcon.style.display = isChinese ? 'inline' : 'none';
}

document.addEventListener('DOMContentLoaded', (event) => {
    applyPreferences();
    document.body.classList.add('fade-in');
});

// JavaScript code

// Load the sidebar
document.addEventListener('DOMContentLoaded', function() {
    fetch('sidebar.html')
        .then(response => response.text())
        .then(data => {
            // Insert the sidebar content
            document.getElementById('sidebar-placeholder').innerHTML = data;

            // Now set up the IntersectionObserver
            // Select the elements
            const footer = document.querySelector('footer');
            const sidebar = document.getElementById('sidebar');

            // Callback function for IntersectionObserver
            const callback = function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Change the height of sidebar-placeholder when the footer is visible
                        sidebar.style.height = '94vh'; // Replace with the desired height
                    } else {
                        // Reset the height when the footer is not visible
                        sidebar.style.height = '98vh'; // Replace with the original height
                    }
                });
            };

            // Create the observer, with the callback function and options
            const observer = new IntersectionObserver(callback, {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            });

            // Start observing the footer
            observer.observe(footer);
        });
});

// footer.js

// Function to load the footer
function loadFooter() {
    fetch('footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
            // Optionally, initialize any scripts related to the footer here
            displayLastUpdated();
        })
        .catch(error => {
            console.error('Error loading footer:', error);
        });
}

// Inline Script for Last Updated (same as in your HTML)
const GITHUB_USERNAME = 'Adam-R-Lawrence'; // Replace with your GitHub username
const GITHUB_REPO = 'Holm'; // Replace with your repository name

const commitsApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`;

async function displayLastUpdated() {
    const cacheKey = 'lastUpdatedDate';
    const cacheTimeKey = 'lastUpdatedTime';
    const cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds

    const cachedDate = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const now = Date.now();

    if (cachedDate && cachedTime && (now - cachedTime) < cacheDuration) {
        document.getElementById('last-updated').textContent = cachedDate;
        return;
    }

    try {
        const response = await fetch(commitsApiUrl);
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        const commits = await response.json();
        if (commits.length === 0) {
            document.getElementById('last-updated').textContent = 'No commits found.';
            return;
        }
        const latestCommitDate = new Date(commits[0].commit.committer.date);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = latestCommitDate.toLocaleDateString(undefined, options);
        document.getElementById('last-updated').textContent = formattedDate;

        // Cache the result
        localStorage.setItem(cacheKey, formattedDate);
        localStorage.setItem(cacheTimeKey, now);
    } catch (error) {
        console.error('Error fetching the latest commit:', error);
        document.getElementById('last-updated').textContent = 'Unavailable';
    }
}

// Load the footer when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadFooter);
