// Custom Lightbox JavaScript

// Function to create the Lightbox modal HTML and append it to the body
function createLightboxModal() {
    // Check if the modal already exists to avoid duplicates
    if (document.getElementById('lightbox-modal')) return;

    // Create the modal container
    const modal = document.createElement('div');
    modal.id = 'lightbox-modal';
    modal.className = 'lightbox';

    // Create the close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';

    // Create the image element
    const img = document.createElement('img');
    img.className = 'lightbox-content';
    img.id = 'lightbox-img';
    img.alt = 'Enlarged Image';
    img.loading = 'lazy';

    // Create the video element (hidden by default)
    const video = document.createElement('video');
    video.className = 'lightbox-content';
    video.id = 'lightbox-video';
    video.controls = true;
    video.style.display = 'none';

    // Create the caption
    const caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    caption.id = 'lightbox-caption';

    // Create help text for keyboard navigation
    const help = document.createElement('div');
    help.className = 'lightbox-help';
    help.textContent = 'Use \u2190 and \u2192 to navigate, ESC to close.';

    // Append elements to the modal
    modal.appendChild(closeBtn);
    modal.appendChild(img);
    modal.appendChild(video);
    modal.appendChild(caption);
    modal.appendChild(help);

    // Append the modal to the body
    document.body.appendChild(modal);
}

// Call the function to create the modal
createLightboxModal();

// Get the modal elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.querySelector('.lightbox-close');

// Get all elements that should trigger the lightbox in the order they appear
const lightboxTriggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
let currentIndex = -1;

function getTriggerSource(el) {
    return el.dataset.video || el.dataset.src || el.src || el.href;
}

function isVideoTrigger(el) {
    const src = getTriggerSource(el);
    return src ? /\.(mp4|webm|ogg|m4v)$/i.test(src) : false;
}

function displayItem(index) {
    const el = lightboxTriggers[index];
    if (!el) return;
    const src = getTriggerSource(el);
    const caption = el.alt || el.dataset.caption || '';
    lightboxCaption.textContent = caption;

    if (isVideoTrigger(el)) {
        lightboxImg.style.display = 'none';
        lightboxVideo.style.display = 'block';
        lightboxVideo.src = src;
        lightboxVideo.play();
    } else {
        lightboxVideo.pause();
        lightboxVideo.style.display = 'none';
        lightboxImg.style.display = 'block';
        lightboxImg.src = src;
    }
    currentIndex = index;
}

function openLightbox(el) {
    lightboxModal.style.display = 'flex';
    displayItem(lightboxTriggers.indexOf(el));
}

// Open the modal when a trigger is clicked
lightboxTriggers.forEach(trigger => {
    trigger.addEventListener('click', e => {
        e.preventDefault();
        openLightbox(trigger);
    });
});

function closeLightbox() {
    lightboxModal.style.display = 'none';
    lightboxVideo.pause();
}

// Close the modal when clicking the close button
closeBtn.addEventListener('click', closeLightbox);

// Close the modal when clicking outside the image
lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) {
        closeLightbox();
    }
});

// Optional: Close the modal with the ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
        return;
    }

    if (lightboxModal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            displayItem((currentIndex - 1 + lightboxTriggers.length) % lightboxTriggers.length);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            displayItem((currentIndex + 1) % lightboxTriggers.length);
        }
    }
});
