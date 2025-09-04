document.addEventListener('DOMContentLoaded', function () {
    // Get the button
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');

    // Function to check scroll position and toggle button visibility
    function toggleScrollToTopBtn() {
        const scrollPosition = window.scrollY;
        const viewportHeight = window.innerHeight;
        if (scrollPosition > 1.5 * viewportHeight) {
            scrollToTopBtn.classList.add('show');
            scrollToTopBtn.setAttribute('aria-hidden', 'false');
        } else {
            scrollToTopBtn.classList.remove('show');
            scrollToTopBtn.setAttribute('aria-hidden', 'true');
        }
    }

    // Function to smoothly scroll to top
    function scrollToTop() {
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
            top: 0,
            behavior: prefersReduced ? 'auto' : 'smooth'
        });
    }

    // Ensure an accessible initial state and correct visibility on load
    if (scrollToTopBtn && !scrollToTopBtn.hasAttribute('aria-hidden')) {
        scrollToTopBtn.setAttribute('aria-hidden', 'true');
    }
    toggleScrollToTopBtn();

    // Event listeners
    window.addEventListener('scroll', toggleScrollToTopBtn);
    scrollToTopBtn.addEventListener('click', scrollToTop);
});
