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


function checkFooterVisibility() {
    const footer = document.querySelector('footer'); // Replace 'footer' with the correct selector for your footer
    const sidebar = document.querySelector('#sidebar');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Footer is visible, adjust sidebar height
                sidebar.style.height = '93.5vh';
            } else {
                // Footer is not visible, set sidebar height back to original
                sidebar.style.height = '97vh';
            }
        });
    });

    observer.observe(footer);
}

// Run the function when the document is ready
document.addEventListener('DOMContentLoaded', checkFooterVisibility);
