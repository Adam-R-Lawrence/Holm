function toggleImagesForDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-theme');
    console.log("Toggling images for dark mode:", isDarkMode); // Debugging

    const logos = document.querySelectorAll('#logos img');
    logos.forEach(img => {
        if (isDarkMode) {
            img.src = img.src.replace('_black', '_white');
        } else {
            img.src = img.src.replace('_white', '_black');
        }
    });
}

function toggleTheme() {
    const lightThemeIcon = document.getElementById('theme-sun');
    const darkThemeIcon = document.getElementById('theme-moon');
    document.body.classList.toggle('dark-theme');

    const isDarkMode = document.body.classList.contains('dark-theme');
    console.log("Dark mode after toggle:", isDarkMode); // Debugging

    lightThemeIcon.style.display = isDarkMode ? "none" : "inline";
    darkThemeIcon.style.display = isDarkMode ? "inline" : "none";

    toggleImagesForDarkMode();

    localStorage.setItem('darkMode', isDarkMode.toString());
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
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    const isChinese = localStorage.getItem('language') === "chinese";

    console.log("Applying preferences - Dark Mode:", isDarkMode, ", Language is Chinese:", isChinese); // Debugging

    const darkThemeIcon = document.getElementById('theme-sun');
    const lightThemeIcon = document.getElementById('theme-moon');
    const englishIcon = document.getElementById('language-english');
    const chineseIcon = document.getElementById('language-chinese');

    lightThemeIcon.style.display = isDarkMode ? "none" : "inline";
    darkThemeIcon.style.display = isDarkMode ? "inline" : "none";

    document.body.classList.toggle('dark-theme', isDarkMode);
    toggleImagesForDarkMode();

    englishIcon.style.display = isChinese ? 'none' : 'inline';
    chineseIcon.style.display = isChinese ? 'inline' : 'none';
}


document.addEventListener('DOMContentLoaded', (event) => {
    applyPreferences();
    document.body.classList.add('fade-in');
});