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

    if (mainImg) {
        mainImg.style.cursor = 'zoom-in';
        mainImg.setAttribute('title', 'Click to zoom image');
        mainImg.onclick = () => openLightbox(currentSlide);
    }

    const carousel = document.querySelector('.main-carousel');
    if (carousel && !carousel.querySelector('.carousel-zoom-btn')) {
        const zoomBtn = document.createElement('button');
        zoomBtn.className = 'carousel-zoom-btn';
        zoomBtn.type = 'button';
        zoomBtn.setAttribute('aria-label', 'Zoom image');
        zoomBtn.setAttribute('title', 'Click to zoom image');
        zoomBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <span>Zoom</span>
        `;
        zoomBtn.onclick = (e) => {
            e.stopPropagation();
            openLightbox(currentSlide);
        };
        carousel.appendChild(zoomBtn);
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

    if (lightboxOpen) {
        syncLightboxImage();
    }
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
        const isAvail = String(property.status).trim().toLowerCase() === 'available';
        statusBadge.className = 'status-badge ' + (isAvail ? 'available' : 'sold');
    }

    if (mainImgEl && property.image_url) {
        const fullImg = (property.image_url.startsWith('http') || property.image_url.startsWith('data:')) ? property.image_url : '../../' + property.image_url.replace(/^(\.\.\/)+/, '');
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

    // Update submit inquiry button to target this specific property
    const inquiryBtn = document.querySelector('.submit-inquiry-btn');
    if (inquiryBtn && property && property.id) {
        inquiryBtn.href = `../inquiry/inquiry.html?type=property&id=${property.id}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initGallery();
    loadPropertyFromDb();
    const searchToggle = document.getElementById('searchToggle');
    if (searchToggle) {
        searchToggle.addEventListener('click', () => {
            location.href = 'properties.html';
        });
    }
});

/* ========================================================
   FULLSCREEN IMAGE LIGHTBOX & INTERACTIVE ZOOM CONTROLLER
   ======================================================== */
let lightboxOpen = false;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

function ensureLightboxDom() {
    if (document.getElementById('imageLightbox')) return;

    const lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.className = 'image-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', 'Photo Zoom Viewer');
    lightbox.innerHTML = `
        <div class="lightbox-header">
            <span class="lightbox-counter" id="lightboxCounter">1 / 1</span>
            <div class="lightbox-controls">
                <button type="button" class="lightbox-btn" id="lightboxZoomOutBtn" title="Zoom out (-)" aria-label="Zoom out">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button type="button" class="lightbox-btn" id="lightboxResetBtn" title="Reset zoom (0)" aria-label="Reset zoom" style="width: auto; padding: 0 12px; border-radius: 999px;">
                    100%
                </button>
                <button type="button" class="lightbox-btn" id="lightboxZoomInBtn" title="Zoom in (+)" aria-label="Zoom in">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button type="button" class="lightbox-btn close-btn" id="lightboxCloseBtn" title="Close (Esc)" aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
        <div class="lightbox-viewport zoom-1" id="lightboxViewport">
            <button type="button" class="lightbox-nav prev" id="lightboxPrevBtn" aria-label="Previous image">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div class="lightbox-img-stage" id="lightboxImgStage">
                <img id="lightboxImg" src="" alt="Property Zoomed View">
            </div>
            <button type="button" class="lightbox-nav next" id="lightboxNextBtn" aria-label="Next image">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
        </div>
        <div class="lightbox-footer">
            <div class="lightbox-thumbs" id="lightboxThumbs"></div>
            <div class="lightbox-hint">Scroll or double-click to zoom • Drag to pan when zoomed • Esc to close</div>
        </div>
    `;

    document.body.appendChild(lightbox);

    // Button actions
    document.getElementById('lightboxCloseBtn').addEventListener('click', closeLightbox);
    document.getElementById('lightboxZoomInBtn').addEventListener('click', () => zoomLightbox(0.5));
    document.getElementById('lightboxZoomOutBtn').addEventListener('click', () => zoomLightbox(-0.5));
    document.getElementById('lightboxResetBtn').addEventListener('click', resetLightboxZoom);
    document.getElementById('lightboxPrevBtn').addEventListener('click', () => changeLightboxSlide(-1));
    document.getElementById('lightboxNextBtn').addEventListener('click', () => changeLightboxSlide(1));

    const viewport = document.getElementById('lightboxViewport');

    // Close on backdrop click (outside navigation buttons and stage)
    viewport.addEventListener('click', (e) => {
        if (e.target === viewport) {
            closeLightbox();
        }
    });

    // Mouse wheel zoom
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            zoomLightbox(0.25);
        } else {
            zoomLightbox(-0.25);
        }
    }, { passive: false });

    // Double-click toggle (1x <-> 2.5x)
    const stage = document.getElementById('lightboxImgStage');
    stage.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (zoomLevel > 1) {
            resetLightboxZoom();
        } else {
            zoomLevel = 2.5;
            panX = 0;
            panY = 0;
            applyLightboxTransform();
        }
    });

    // Mouse drag to pan
    viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (zoomLevel <= 1) return;
        isPanning = true;
        panStartX = e.clientX - panX;
        panStartY = e.clientY - panY;
        viewport.classList.add('is-panning');
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = e.clientX - panStartX;
        panY = e.clientY - panStartY;
        applyLightboxTransform();
    });

    window.addEventListener('mouseup', () => {
        if (!isPanning) return;
        isPanning = false;
        viewport.classList.remove('is-panning');
    });

    // Touch drag support
    let touchStartX = 0;
    let touchStartY = 0;
    viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && zoomLevel > 1) {
            isPanning = true;
            touchStartX = e.touches[0].clientX - panX;
            touchStartY = e.touches[0].clientY - panY;
            viewport.classList.add('is-panning');
        }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
        if (isPanning && e.touches.length === 1) {
            panX = e.touches[0].clientX - touchStartX;
            panY = e.touches[0].clientY - touchStartY;
            applyLightboxTransform();
        }
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
        isPanning = false;
        viewport.classList.remove('is-panning');
    });
}

function openLightbox(index) {
    if (galleryImages.length === 0) initGallery();
    if (typeof index === 'number') {
        currentSlide = index;
        updateGallery();
    }
    ensureLightboxDom();
    syncLightboxImage();
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        lightboxOpen = true;
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxOpen = false;
        resetLightboxZoom();
    }
}

function resetLightboxZoom() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    applyLightboxTransform();
}

function applyLightboxTransform() {
    const stage = document.getElementById('lightboxImgStage');
    const viewport = document.getElementById('lightboxViewport');
    const resetBtn = document.getElementById('lightboxResetBtn');
    if (!stage) return;

    stage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;

    if (viewport) {
        if (zoomLevel === 1) {
            viewport.classList.add('zoom-1');
            viewport.classList.remove('is-zoomed');
        } else {
            viewport.classList.remove('zoom-1');
            viewport.classList.add('is-zoomed');
        }
    }

    if (resetBtn) {
        resetBtn.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
}

function zoomLightbox(delta) {
    const newZoom = Math.max(1, Math.min(4, Math.round((zoomLevel + delta) * 100) / 100));
    if (newZoom === zoomLevel) return;
    zoomLevel = newZoom;
    if (zoomLevel === 1) {
        panX = 0;
        panY = 0;
    }
    applyLightboxTransform();
}

function syncLightboxImage() {
    const img = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    const thumbsContainer = document.getElementById('lightboxThumbs');
    if (galleryImages.length === 0) return;

    const currentSrc = galleryImages[currentSlide] || '';
    if (img) img.src = currentSrc;
    if (counter) counter.textContent = `${currentSlide + 1} / ${galleryImages.length}`;

    if (thumbsContainer) {
        thumbsContainer.innerHTML = galleryImages.map((src, i) => `
            <div class="lightbox-thumb ${i === currentSlide ? 'active' : ''}" onclick="selectLightboxSlide(${i})">
                <img src="${src}" alt="Slide ${i + 1}">
            </div>
        `).join('');
    }
    resetLightboxZoom();
}

function selectLightboxSlide(index) {
    currentSlide = index;
    updateGallery();
    syncLightboxImage();
}

function changeLightboxSlide(direction) {
    changeSlide(direction);
    syncLightboxImage();
}

window.addEventListener('keydown', (e) => {
    if (!lightboxOpen) return;
    if (e.key === 'Escape') {
        closeLightbox();
    } else if (e.key === 'ArrowLeft') {
        changeLightboxSlide(-1);
    } else if (e.key === 'ArrowRight') {
        changeLightboxSlide(1);
    } else if (e.key === '+' || e.key === '=') {
        zoomLightbox(0.5);
    } else if (e.key === '-' || e.key === '_') {
        zoomLightbox(-0.5);
    } else if (e.key === '0') {
        resetLightboxZoom();
    }
});

// Expose globals for onclick bindings
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.changeLightboxSlide = changeLightboxSlide;
window.selectLightboxSlide = selectLightboxSlide;
window.zoomLightbox = zoomLightbox;
window.resetLightboxZoom = resetLightboxZoom;

