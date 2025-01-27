document.addEventListener('DOMContentLoaded', function () {
    // Get the button
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');

    // Function to check scroll position and toggle button visibility
    function toggleScrollToTopBtn() {
        const scrollPosition = window.scrollY;
        const viewportHeight = window.innerHeight;
        if (scrollPosition > 1.5 * viewportHeight) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    }

    // Function to smoothly scroll to top
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Event listeners
    window.addEventListener('scroll', toggleScrollToTopBtn);
    scrollToTopBtn.addEventListener('click', scrollToTop);
});
