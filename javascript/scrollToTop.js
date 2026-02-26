(() => {
    'use strict';

    function initializeScrollToTop() {
        const scrollToTopButton = document.getElementById('scroll-to-top-btn');
        if (!scrollToTopButton) {
            return;
        }

        const updateVisibility = () => {
            const scrollPosition = window.scrollY;
            const viewportHeight = window.innerHeight;
            const shouldShow = scrollPosition > 1.5 * viewportHeight;
            scrollToTopButton.classList.toggle('show', shouldShow);
            scrollToTopButton.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        };

        const scrollToTop = () => {
            const prefersReducedMotion = window.matchMedia
                && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        };

        let queued = false;
        const handleScroll = () => {
            if (queued) {
                return;
            }
            queued = true;
            window.requestAnimationFrame(() => {
                updateVisibility();
                queued = false;
            });
        };

        if (!scrollToTopButton.hasAttribute('aria-hidden')) {
            scrollToTopButton.setAttribute('aria-hidden', 'true');
        }

        updateVisibility();
        window.addEventListener('scroll', handleScroll, { passive: true });
        scrollToTopButton.addEventListener('click', scrollToTop);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScrollToTop, { once: true });
    } else {
        initializeScrollToTop();
    }
})();
