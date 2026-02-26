(() => {
    'use strict';

    const triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
    if (!triggers.length) {
        return;
    }

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
            || element.getAttribute('src')
            || element.getAttribute('href')
            || '';
    };

    const getTriggerCaption = element => {
        if (!element) {
            return '';
        }

        return element.getAttribute('alt') || element.dataset.caption || '';
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

    triggers.forEach((trigger, index) => {
        if (!trigger.hasAttribute('tabindex')) {
            trigger.setAttribute('tabindex', '0');
        }

        trigger.addEventListener('click', event => {
            event.preventDefault();
            openLightbox(index);
        });

        trigger.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openLightbox(index);
            }
        });
    });

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
})();
