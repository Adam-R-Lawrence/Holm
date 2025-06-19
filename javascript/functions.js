'use strict';

// Constants for GitHub API
const GITHUB_USERNAME = 'Adam-R-Lawrence'; // Replace with your GitHub username
const GITHUB_REPO = 'Holm';               // Replace with your repository name
const commitsApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/commits`;

// Translation dictionary mapping element IDs to text in different languages
const translations = {
    english: {
        'sidebar-name': 'Adam Lawrence',
        'sidebar-my-current-status': 'PhD Candidate at UIUC',
        'sidebar-bio-1': 'Computational Mechanics',
        'sidebar-bio-2': 'Environmental Modelling',
        'sidebar-bio-3': 'History and Geography',
        'nav-home': 'Home',
        'nav-projects': 'Projects',
        'nav-writings': 'Writings',
        'nav-publications': 'Publications',
        'nav-resume': 'Resume',

        'header-home': 'Home',
        'header-projects': 'Projects',
        'header-writings': 'Writings',
        'header-resume': 'Resume',

        'footer-text': '&copy; 2025 Adam Lawrence | Last updated on <span id="last-updated"></span>',

        'about-header': 'About Me',
        'about-p1': 'I am a first year PhD student at the University of Illinois Urbana-Champaign, within the department of Civil and Environmental Engineering. My research entails all aspects of computational mechanics and modelling, mainly in free surface hydrodynamics, but also on more unique applications such as photopolymerization. I am under the guidance of Professor <a href="https://yan.cee.illinois.edu/">Jinhui Yan</a>.',
        'about-p2': 'I hail from the Melbourne, Australia, where I completed my undergraduate and master\'s in environmental engineering, specializing in hydraulic engineering with a minor in computer science. I am an AUKUS fellow, awarded by the Australian-American Association, to strengthen ties between our two great countries.',
        'about-p3': 'Here on this website, you will find a collection of my ongoing work, not just from my current research, but also personal projects and interests.',
        'about-p4': 'To aid in my PhD research, I have developed a plethora of currently closed source projects. <a href="projects/Torrentem.html">Torrentem</a>; a general numerical PDE solver, solving multiscale problems from large hydrodynamic flows to minuscule additive manufacturing processes. <a href="projects/Ostium.html">Ostium</a>; a library to process and integrate geospatial data, that can work with Torrentem. <a href="projects/Vadum.html">Vadum</a>; a visualisation library for results from Torrentem.',
        'about-p5': 'I have a keen interest in Literature, History, Geography, and the Environment. I believe current teaching standards are lacking, and incorporating these elements into my projects through visual storytelling helps to effectively engage people, especially when communicating complex scientific concepts. Examples of my approach can be found on my <a href="writings.html">writings</a> page and my <a href="https://www.youtube.com/@arlawrence">YouTube</a>.',
        'about-p6': 'For any enquiries or collaboration, including summer internship opportunities, feel free to reach out via email at <a href="mailto:adamrl3@illinois.edu" class="content-link">adamrl3@illinois.edu</a>.' ,

        'projects-header': 'Projects',
        'writings-header': 'Writings',
        'publications-header': 'Publications'
    },
    chinese: {
        // Sidebar
        'sidebar-name': '亚当·劳伦斯',
        'sidebar-my-current-status': '伊利诺伊大学香槟分校博士生',
        'sidebar-bio-1': '计算力学',
        'sidebar-bio-2': '环境建模',
        'sidebar-bio-3': '历史与地理',
        'nav-home': '主页',
        'nav-projects': '项目',
        'nav-writings': '文章',
        'nav-publications': '出版物',
        'nav-resume': '简历',

        // Header navigation
        'header-home': '主页',
        'header-projects': '项目',
        'header-writings': '文章',
        'header-resume': '简历',

        // Footer
        'footer-text': '© 2025 亚当·劳伦斯 | 最近更新：<span id="last-updated"></span>',

        // Index page
        'about-header': '自我介绍',
        'about-p1': '我是伊利诺伊大学香槟分校土木与环境工程系的一年级博士生。我的研究涵盖计算力学与建模的各个方面，主要集中于自由表面水动力学，也涉及光聚合等独特应用。导师是 <a href="https://yan.cee.illinois.edu/">闫金辉教授</a>。',
        'about-p2': '我来自澳大利亚墨尔本，在那里完成了环境工程的本科和硕士学位，主修水利工程，辅修计算机科学。我是由澳美协会授予的 AUKUS 奖学金得主，旨在增进两国的合作。',
        'about-p3': '在这个网站上，你可以看到我正在进行的各项工作，不仅有当前的研究，也有个人的项目和兴趣。',
        'about-p4': '为了推动我的博士研究，我开发了许多目前尚未开源的项目。<a href="projects/Torrentem.html">Torrentem</a>：通用数值 PDE 求解器，能够解决从大尺度水动力到微尺度增材制造等多尺度问题。<a href="projects/Ostium.html">Ostium</a>：处理并整合地理空间数据的库，可与 Torrentem 协同使用。<a href="projects/Vadum.html">Vadum</a>：用于展示 Torrentem 结果的可视化库。',
        'about-p5': '我对文学、历史、地理和环境有着浓厚的兴趣。我认为当前的教学标准有所欠缺，通过视觉化叙事将这些元素融入我的项目，可以更有效地吸引人们，尤其在传达复杂科学概念时。相关实例可以在我的 <a href="writings.html">文章</a> 页面和我的 <a href="https://www.youtube.com/@arlawrence">YouTube</a> 上找到。',
        'about-p6': '如有任何咨询或合作，包括暑期实习机会，欢迎通过邮箱 adamrl3@illinois.edu 与我联系。',

        // Other page headers
        'projects-header': '项目',
        'writings-header': '文章',
        'publications-header': '出版物'
    }
};

/**
 * Applies translated text to elements based on the selected language.
 * @param {string} language - 'english' or 'chinese'
 */
function applyTranslations(language) {
    const dict = translations[language];
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
function toggleLanguage() {
    // Select language toggle icons
    const englishIcon = document.getElementById('language-english');
    const chineseIcon = document.getElementById('language-chinese');

    // Determine if the current language is Chinese by checking the display style
    const isChinese = chineseIcon.style.display === 'inline';

    // Toggle the display styles of the language icons
    englishIcon.style.display = isChinese ? 'inline' : 'none';
    chineseIcon.style.display = isChinese ? 'none' : 'inline';

    const newLanguage = isChinese ? 'english' : 'chinese';

    // Save the current language preference to localStorage
    localStorage.setItem('language', newLanguage);

    // Apply the chosen language
    applyTranslations(newLanguage);
    document.body.classList.toggle('chinese', newLanguage === 'chinese');
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

    // Apply translations and font for the stored preference
    applyTranslations(isChinese ? 'chinese' : 'english');
    document.body.classList.toggle('chinese', isChinese);
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
