function toggleImagesForDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-theme');

    const logos = document.querySelectorAll('#sidebar-logos img');
    logos.forEach(img => {
        if (isDarkMode) {
            img.src = img.src.replace('_black', '_white');
        } else {
            img.src = img.src.replace('_white', '_black');
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
        document.body.classList.toggle('dark-theme');
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


