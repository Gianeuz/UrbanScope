/**
 * UrbanScope - Property Detail & Gallery Controller
 * Powers the interactive photo carousel, thumbnail selector, and dynamic database loader.
 */

let currentSlide = 0;
let galleryImages = [];

function initGallery() {
    const mainImg = document.getElementById('mainGalleryImg');
    const thumbs = document.querySelectorAll('.thumb');

    // Use window.galleryImages if specified on the page, or collect from thumbnail elements
    if (Array.isArray(window.galleryImages) && window.galleryImages.length > 0) {
        galleryImages = window.galleryImages;
    } else if (thumbs.length > 0) {
        galleryImages = Array.from(thumbs).map(t => {
            const img = t.querySelector('img');
            return img ? img.getAttribute('src') : '';
        }).filter(Boolean);
    } else if (mainImg) {
        galleryImages = [mainImg.src];
    }
}

function updateGallery() {
    const mainImg = document.getElementById('mainGalleryImg');
    const thumbs = document.querySelectorAll('.thumb');
    if (!mainImg || galleryImages.length === 0) return;

    mainImg.src = galleryImages[currentSlide];
    thumbs.forEach((t, i) => {
        if (i === currentSlide) t.classList.add('active');
        else t.classList.remove('active');
    });
}

function changeSlide(direction) {
    if (galleryImages.length === 0) initGallery();
    if (galleryImages.length === 0) return;
    currentSlide = (currentSlide + direction + galleryImages.length) % galleryImages.length;
    updateGallery();
}

function selectThumb(index, src) {
    if (galleryImages.length === 0) initGallery();
    currentSlide = index;
    if (src && (!galleryImages[index] || galleryImages[index] !== src)) {
        galleryImages[index] = src;
    }
    updateGallery();
}

async function loadPropertyFromDb() {
    const urlParams = new URLSearchParams(window.location.search);
    const propId = urlParams.get('id');
    if (!propId || typeof apiGetPropertyById !== 'function') return;

    const property = await apiGetPropertyById(propId);
    if (!property) return;

    const titleEl = document.querySelector('.property-title');
    const locEl = document.querySelector('.property-loc');
    const priceEl = document.querySelector('.detail-price');
    const mainImgEl = document.getElementById('mainGalleryImg');

    if (titleEl) titleEl.innerText = property.title;
    if (locEl) {
        locEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${property.location}`;
    }
    if (priceEl) priceEl.innerText = `₱${Number(property.price).toLocaleString()}`;
    if (mainImgEl && property.image_url) {
        mainImgEl.src = property.image_url;
        galleryImages[0] = property.image_url;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initGallery();
    loadPropertyFromDb();
});
