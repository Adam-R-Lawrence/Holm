
<!-- Custom Lightbox JavaScript -->

// Get the modal elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const closeBtn = document.querySelector('.lightbox-close');

// Get all images with class 'lightbox-trigger'
const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');

// Open the modal when an image is clicked
lightboxTriggers.forEach(img => {
    img.addEventListener('click', () => {
        lightboxModal.style.display = 'flex'; // Show the modal
        lightboxImg.src = img.src;             // Use the clicked image's source
        lightboxCaption.textContent = img.alt; // Use the clicked image's alt as the caption
    });
});

// Close the modal when clicking the close button
closeBtn.addEventListener('click', () => {
    lightboxModal.style.display = 'none';
});

// Close the modal when clicking outside the image
lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) {
        lightboxModal.style.display = 'none';
    }
});

// Optional: Close the modal with the ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        lightboxModal.style.display = 'none';
    }
});

