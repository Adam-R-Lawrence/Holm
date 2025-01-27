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

    // Create the caption
    const caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    caption.id = 'lightbox-caption';

    // Append elements to the modal
    modal.appendChild(closeBtn);
    modal.appendChild(img);
    modal.appendChild(caption);

    // Append the modal to the body
    document.body.appendChild(modal);
}

// Call the function to create the modal
createLightboxModal();

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
