/**
 * UrbanScope - Properties Catalog Script
 * Handles category browsing, filter drawer interactions, and dynamic database property listings.
 */

const filterDrawer = document.getElementById('filterDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const openFilterBtn = document.getElementById('openFilterBtn');
const closeFilterBtn = document.getElementById('closeFilterBtn');
const sortSelect = document.getElementById('sortSelect');

function toggleFilter(show) {
    if (!filterDrawer || !drawerBackdrop) return;
    if (show) {
        filterDrawer.classList.add('open');
        drawerBackdrop.classList.add('active');
    } else {
        filterDrawer.classList.remove('open');
        drawerBackdrop.classList.remove('active');
    }
}

if (openFilterBtn) openFilterBtn.addEventListener('click', () => toggleFilter(true));
if (closeFilterBtn) closeFilterBtn.addEventListener('click', () => toggleFilter(false));
if (drawerBackdrop) drawerBackdrop.addEventListener('click', () => toggleFilter(false));
const searchToggle = document.getElementById('searchToggle');
if (searchToggle) searchToggle.addEventListener('click', () => toggleFilter(true));

function scrollCat(direction) {
    const el = document.getElementById('catScroll');
    if (el) el.scrollBy({ left: direction * 140, behavior: 'smooth' });
}

// Active dataset and current filters
let activePropertiesData = [];
let currentFilterState = {};

async function loadProperties(filter = {}) {
    currentFilterState = { ...filter };
    if (typeof apiGetProperties === 'function') {
        const data = await apiGetProperties(filter);
        if (data !== null) {
            activePropertiesData = data;
            applyClientSortAndRender();
            return;
        }
    }
    // If apiGetProperties failed or returned null
    renderProperties([]);
}

function applyClientSortAndRender() {
    if (!activePropertiesData) return;
    let list = [...activePropertiesData];

    // Client-side bedroom filter if specified in drawer
    const beds = document.getElementById('filterBedrooms')?.value;
    if (beds && beds !== 'any') {
        const bedNum = parseInt(beds, 10);
        if (!isNaN(bedNum)) {
            list = list.filter(p => beds.includes('+') ? (p.bedrooms || 0) >= bedNum : (p.bedrooms || 0) === bedNum);
        }
    }

    // Client-side bathroom filter if specified
    const baths = document.getElementById('filterBathrooms')?.value;
    if (baths && baths !== 'any') {
        const bathNum = parseInt(baths, 10);
        if (!isNaN(bathNum)) {
            list = list.filter(p => baths.includes('+') ? (p.bathrooms || 0) >= bathNum : (p.bathrooms || 0) === bathNum);
        }
    }

    // Client-side price filtering if specified
    const minPVal = parsePrice(document.getElementById('minPrice')?.value);
    const maxPVal = parsePrice(document.getElementById('maxPrice')?.value);
    if (minPVal > 0) list = list.filter(p => (p.price || 0) >= minPVal);
    if (maxPVal > 0) list = list.filter(p => (p.price || 0) <= maxPVal);

    // Sorting
    const sortVal = sortSelect?.value || 'newest';
    if (sortVal === 'price-low') {
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortVal === 'price-high') {
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortVal === 'newest') {
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    renderProperties(list);
}

function parsePrice(str) {
    if (!str) return 0;
    const num = str.toString().replace(/[^0-9.]/g, '');
    return parseFloat(num) || 0;
}

function renderProperties(list) {
    const grid = document.getElementById('listingGrid');
    if (!grid) return;

    if (!list || list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #f9fbf9; border-radius: 12px; border: 1px dashed #cbd5e1; margin: 20px 0;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom: 12px;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h3 style="font-size: 1.25rem; color: #1e293b; margin-bottom: 8px;">No properties found</h3>
                <p style="font-size: 0.95rem; color: #64748b; margin-bottom: 16px;">We couldn't find any listings matching your search criteria.</p>
                <button onclick="clearFilters()" style="background: #1f4928; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">Reset Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = list.map(item => {
        const imgSrc = item.image_url ? 
            (item.image_url.startsWith('http') || item.image_url.startsWith('data:') ? item.image_url : '../../' + item.image_url.replace(/^(\.\.\/)+/, '')) : 
            '../../assets/images/property1.jpg';
        const specsText = `${item.bedrooms || 0} Beds &bull; ${item.bathrooms || 0} Baths &bull; ${item.lot_area || 0} sqm Lot` + 
            (item.floor_area ? ` (${item.floor_area} sqm Flr)` : '');

        const rawStatus = String(item.status || 'Available').trim().toLowerCase();
        const isSold = rawStatus === 'sold' || rawStatus === 'sold out';
        const statusLabel = isSold ? 'Sold Out' : 'Available';

        return `
        <article class="listing-card ${isSold ? 'card-sold' : ''}" onclick="location.href='property-detail.html?id=${item.id}'">
            <div class="listing-image" style="position: relative;">
                <span class="property-status-badge ${isSold ? 'badge-sold' : 'badge-available'}">
                    <span class="badge-dot"></span>
                    ${statusLabel}
                </span>
                <img src="${imgSrc}" alt="${item.title}" onerror="this.src='../../assets/images/property1.jpg'">
            </div>
            <div class="listing-info">
                <h3>${item.title}</h3>
                <p class="listing-location">${item.location}</p>
                <div class="listing-specs">${specsText}</div>
                <strong class="listing-price">₱${Number(item.price || 0).toLocaleString()}</strong>
            </div>
        </article>
        `;
    }).join('');
}

// Initialize properties and controls on load
window.addEventListener('DOMContentLoaded', () => {
    // Check URL search params (e.g. from homepage search bar or chatbot)
    const urlParams = new URLSearchParams(window.location.search);
    const locParam = urlParams.get('location');
    const typeParam = urlParams.get('type');
    const searchParam = urlParams.get('search') || urlParams.get('keyword');

    const initialFilter = {};
    if (locParam && locParam !== 'all') {
        initialFilter.location = locParam;
        const locSelect = document.getElementById('filterLocation');
        if (locSelect) locSelect.value = locParam;
    }
    if (typeParam && typeParam !== 'all') {
        initialFilter.type = typeParam;
        const typeSelect = document.getElementById('filterType');
        if (typeSelect) typeSelect.value = typeParam;
    }
    if (searchParam) {
        initialFilter.search = searchParam;
    }

    // Sync active category pill if type is passed
    if (typeParam) {
        document.querySelectorAll('.listing-category').forEach(b => {
            const cat = b.getAttribute('data-cat');
            if (cat === typeParam) {
                document.querySelectorAll('.listing-category').forEach(el => el.classList.remove('active'));
                b.classList.add('active');
            }
        });
    }

    loadProperties(initialFilter);

    // Category button clicks
    document.querySelectorAll('.listing-category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.listing-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-cat');
            const typeFilter = cat === 'all' ? '' : (cat === 'house-lot' ? 'house' : cat);
            const currentLoc = document.getElementById('filterLocation')?.value || '';
            loadProperties({ type: typeFilter, location: currentLoc });
        });
    });

    // Sort select change listener
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            applyClientSortAndRender();
        });
    }
});

function clearFilters() {
    const loc = document.getElementById('filterLocation');
    const type = document.getElementById('filterType');
    const minP = document.getElementById('minPrice');
    const maxP = document.getElementById('maxPrice');
    const beds = document.getElementById('filterBedrooms');
    const baths = document.getElementById('filterBathrooms');

    if (loc) loc.value = '';
    if (type) type.value = '';
    if (minP) minP.value = '';
    if (maxP) maxP.value = '';
    if (beds) beds.value = 'any';
    if (baths) baths.value = 'any';

    document.querySelectorAll('.listing-category').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-cat') === 'all');
    });

    loadProperties({});
}

function applyFilter() {
    toggleFilter(false);
    const loc = document.getElementById('filterLocation')?.value || '';
    const type = document.getElementById('filterType')?.value || '';
    loadProperties({ location: loc, type: type });
}
