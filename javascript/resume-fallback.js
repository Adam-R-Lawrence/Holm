(() => {
    'use strict';

    const frame = document.querySelector('.resume-frame');
    const fallback = document.getElementById('resume-fallback');

    if (!frame || !fallback) {
        return;
    }

    const timer = window.setTimeout(() => {
        fallback.hidden = false;
    }, 3000);

    frame.addEventListener('load', () => {
        window.clearTimeout(timer);
    });

    frame.addEventListener('error', () => {
        fallback.hidden = false;
    });
})();
