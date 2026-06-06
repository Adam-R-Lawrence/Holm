(() => {
    'use strict';

    let triggers = [];
    let modal = null;
    let image = null;
    let video = null;
    let caption = null;
    let closeButton = null;
    let currentIndex = -1;
    let previousActiveElement = null;
    let touchStartX = null;

    const isVideoSource = source => /\.(mp4|webm|ogg|m4v)$/i.test(source || '');

    const getTriggerSource = element => {
        if (!element) {
            return '';
        }

        return element.dataset.video
            || element.dataset.src
            || element.currentSrc
            || element.getAttribute('src')
            || element.getAttribute('href')
            || '';
    };

    const getTriggerCaption = element => {
        if (!element) {
            return '';
        }

        const nestedImage = element.querySelector ? element.querySelector('img') : null;
        return element.dataset.caption
            || element.getAttribute('alt')
            || nestedImage?.getAttribute('alt')
            || '';
    };

    const isExplicitTrigger = element => element.classList.contains('lightbox-trigger');

    const isAutoLightboxCandidate = imageElement => {
        if (!imageElement || isExplicitTrigger(imageElement)) {
            return false;
        }

        if (!imageElement.closest('main')) {
            return false;
        }

        if (imageElement.closest('a, button, .lightbox-trigger')) {
            return false;
        }

        if (imageElement.classList.contains('logo') || imageElement.classList.contains('resume-sheet')) {
            return false;
        }

        return Boolean(imageElement.currentSrc || imageElement.getAttribute('src'));
    };

    const prepareAutoTrigger = imageElement => {
        imageElement.classList.add('lightbox-trigger');
        imageElement.dataset.src = imageElement.currentSrc || imageElement.getAttribute('src');

        if (!imageElement.dataset.caption && imageElement.alt) {
            imageElement.dataset.caption = imageElement.alt;
        }

        if (!imageElement.hasAttribute('role')) {
            imageElement.setAttribute('role', 'button');
        }

        if (!imageElement.hasAttribute('aria-label')) {
            const captionText = getTriggerCaption(imageElement);
            imageElement.setAttribute('aria-label', captionText ? `Open image: ${captionText}` : 'Open image');
        }

        return imageElement;
    };

    const modalIsOpen = () => Boolean(modal && modal.classList.contains('is-open'));

    function navigate(direction) {
        if (triggers.length < 2 || currentIndex < 0) {
            return;
        }

        const nextIndex = (currentIndex + direction + triggers.length) % triggers.length;
        displayItem(nextIndex);
    }

    function closeLightbox() {
        if (!modal) {
            return;
        }

        modal.classList.remove('is-open');
        video.pause();
        video.removeAttribute('src');

        if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
            previousActiveElement.focus();
        }
    }

    function ensureLightboxModal() {
        if (modal) {
            return;
        }

        modal = document.createElement('div');
        modal.id = 'lightbox-modal';
        modal.className = 'lightbox';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');

        closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'lightbox-close';
        closeButton.setAttribute('aria-label', 'Close');
        closeButton.innerHTML = '&times;';

        image = document.createElement('img');
        image.className = 'lightbox-content';
        image.id = 'lightbox-img';
        image.alt = 'Enlarged Image';
        image.loading = 'lazy';

        video = document.createElement('video');
        video.className = 'lightbox-content';
        video.id = 'lightbox-video';
        video.controls = true;
        video.hidden = true;

        caption = document.createElement('div');
        caption.className = 'lightbox-caption';
        caption.id = 'lightbox-caption';

        const helpText = document.createElement('div');
        helpText.className = 'lightbox-help';
        helpText.textContent = 'Swipe or use \u2190 and \u2192 to navigate, ESC to close.';

        modal.appendChild(closeButton);
        modal.appendChild(image);
        modal.appendChild(video);
        modal.appendChild(caption);
        modal.appendChild(helpText);
        document.body.appendChild(modal);

        closeButton.addEventListener('click', closeLightbox);

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeLightbox();
            }
        });

        modal.addEventListener('keydown', event => {
            if (!modalIsOpen()) {
                return;
            }

            if (event.key === 'Tab') {
                event.preventDefault();
                closeButton.focus();
            }
        });

        modal.addEventListener('touchstart', event => {
            if (event.touches.length === 1) {
                touchStartX = event.touches[0].clientX;
            }
        }, { passive: true });

        modal.addEventListener('touchend', event => {
            if (touchStartX === null) {
                return;
            }

            const touchEndX = event.changedTouches[0].clientX;
            const delta = touchEndX - touchStartX;
            touchStartX = null;

            if (Math.abs(delta) <= 50) {
                return;
            }

            navigate(delta > 0 ? -1 : 1);
        }, { passive: true });
    }

    function displayItem(index) {
        if (index < 0 || index >= triggers.length) {
            return;
        }

        ensureLightboxModal();

        const trigger = triggers[index];
        const source = getTriggerSource(trigger);
        const text = getTriggerCaption(trigger);

        caption.textContent = text;

        if (isVideoSource(source)) {
            image.hidden = true;
            video.hidden = false;
            video.src = source;
            void video.play().catch(() => {
                // Ignore autoplay failures; controls are still available.
            });
        } else {
            video.pause();
            video.removeAttribute('src');
            video.hidden = true;
            image.hidden = false;
            image.src = source;
            image.alt = text || 'Enlarged image';
        }

        currentIndex = index;
    }

    function openLightbox(index) {
        if (index < 0 || index >= triggers.length) {
            return;
        }

        ensureLightboxModal();
        previousActiveElement = document.activeElement;
        modal.classList.add('is-open');
        displayItem(index);
        closeButton.focus();
    }

    function bindTrigger(trigger) {
        if (trigger.dataset.holmLightboxBound === 'true') {
            return;
        }

        if (!trigger.hasAttribute('tabindex')) {
            trigger.setAttribute('tabindex', '0');
        }

        trigger.addEventListener('click', event => {
            event.preventDefault();
            openLightbox(triggers.indexOf(trigger));
        });

        trigger.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(triggers.indexOf(trigger));
            }
        });

        trigger.dataset.holmLightboxBound = 'true';
    }

    function refreshLightboxTriggers() {
        const explicitTriggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
        const autoTriggers = Array.from(document.querySelectorAll('main img'))
            .filter(isAutoLightboxCandidate)
            .map(prepareAutoTrigger);

        triggers = Array.from(new Set([...explicitTriggers, ...autoTriggers]));
        triggers.forEach(bindTrigger);
    }

    document.addEventListener('keydown', event => {
        if (!modalIsOpen()) {
            return;
        }

        if (event.key === 'Escape') {
            closeLightbox();
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            navigate(-1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            navigate(1);
        }
    });

    window.refreshLightboxTriggers = refreshLightboxTriggers;
    refreshLightboxTriggers();

    const observer = new MutationObserver(() => {
        refreshLightboxTriggers();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
