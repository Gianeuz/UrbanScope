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
    const statusBadge = document.querySelector('.status-badge');
    const mainImgEl = document.getElementById('mainGalleryImg');

    if (titleEl) titleEl.innerText = property.title;
    if (locEl) {
        locEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${property.location}`;
    }
    if (priceEl) priceEl.innerText = `₱${Number(property.price).toLocaleString()}`;
    
    if (statusBadge && property.status) {
        statusBadge.innerText = property.status;
        statusBadge.className = 'status-badge ' + (property.status.toLowerCase() === 'available' ? 'available' : 'reserved');
    }

    if (mainImgEl && property.image_url) {
        const fullImg = property.image_url.startsWith('http') ? property.image_url : '../../' + property.image_url.replace(/^(\.\.\/)+/, '');
        mainImgEl.src = fullImg;
        galleryImages[0] = fullImg;
        updateGallery();
    }

    // Dynamic Specs Bar for complete House & Lot Information
    const specsBar = document.querySelector('.specs-bar');
    if (specsBar) {
        specsBar.innerHTML = `
            <div class="spec-item">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>
                <div class="spec-info">
                    <strong>${property.bedrooms || 0}</strong>
                    <span>Bed Rooms</span>
                </div>
            </div>
            <div class="spec-item">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M2 12h20M7 12V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v7"/></svg>
                <div class="spec-info">
                    <strong>${property.bathrooms || 0}</strong>
                    <span>Bath Rooms</span>
                </div>
            </div>
            <div class="spec-item">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
                <div class="spec-info">
                    <strong>${property.lot_area || 0} sqm</strong>
                    <span>Lot Area</span>
                </div>
            </div>
            <div class="spec-item">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6"/></svg>
                <div class="spec-info">
                    <strong>${property.floor_area || 0} sqm</strong>
                    <span>Floor Area</span>
                </div>
            </div>
            <div class="spec-item">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3H8L4 7h16l-4-4z"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>
                <div class="spec-info">
                    <strong>${property.carports || 1} Car</strong>
                    <span>Garage / Carport</span>
                </div>
            </div>
            <div class="spec-item">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 22"/></svg>
                <div class="spec-info">
                    <strong>${property.property_type || 'Residential'}</strong>
                    <span>Property Type</span>
                </div>
            </div>
        `;
    }

    // Dynamic Description & Amenities
    const descBlock = document.querySelector('.detail-block p');
    if (descBlock && property.description) {
        descBlock.innerText = property.description;
    }

    if (property.amenities) {
        const amenitiesGrid = document.querySelector('.amenities-grid');
        if (amenitiesGrid) {
            const list = property.amenities.split(',').map(a => a.trim()).filter(Boolean);
            if (list.length > 0) {
                const half = Math.ceil(list.length / 2);
                const col1 = list.slice(0, half);
                const col2 = list.slice(half);
                amenitiesGrid.innerHTML = `
                    <ul>${col1.map(item => `<li><span class="bullet">&bull;</span> ${item}</li>`).join('')}</ul>
                    <ul>${col2.map(item => `<li><span class="bullet">&bull;</span> ${item}</li>`).join('')}</ul>
                `;
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initGallery();
    loadPropertyFromDb();
});
