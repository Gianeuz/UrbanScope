/**
 * UrbanScope - Properties Catalog Script
 * Handles category browsing, filter drawer interactions, and Supabase property listings.
 */

const filterDrawer = document.getElementById('filterDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const openFilterBtn = document.getElementById('openFilterBtn');
const closeFilterBtn = document.getElementById('closeFilterBtn');

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

function scrollCat(direction) {
    const el = document.getElementById('catScroll');
    if (el) el.scrollBy({ left: direction * 140, behavior: 'smooth' });
}

// Dynamic Property Fetching & Category Filtering
let activePropertiesData = null;

async function loadProperties(filter = {}) {
    if (typeof apiGetProperties === 'function') {
        const data = await apiGetProperties(filter);
        if (data && data.length > 0) {
            activePropertiesData = data;
            renderProperties(data);
        }
    }
}

function renderProperties(list) {
    const grid = document.getElementById('listingGrid');
    if (!grid || !list || list.length === 0) return;

    grid.innerHTML = list.map(item => `
        <article class="listing-card" onclick="location.href='property-detail.html?id=${item.id}'">
            <div class="listing-image">
                <img src="${item.image_url || '../assets/images/property1.jpg'}" alt="${item.title}" onerror="this.src='../assets/images/property1.jpg'">
            </div>
            <div class="listing-info">
                <h3>${item.title}</h3>
                <p class="listing-location">${item.location}</p>
                <div class="listing-specs">${item.bedrooms || 3} Beds &bull; ${item.bathrooms || 2} Baths &bull; ${item.lot_area || 120} sqm</div>
                <strong class="listing-price">₱${Number(item.price || 0).toLocaleString()}</strong>
            </div>
        </article>
    `).join('');
}

// Initialize properties on load
window.addEventListener('DOMContentLoaded', () => {
    // Check URL search params (e.g. from chatbot or search bar)
    const urlParams = new URLSearchParams(window.location.search);
    const locParam = urlParams.get('location');
    const typeParam = urlParams.get('type');
    const searchParam = urlParams.get('search');

    const initialFilter = {};
    if (locParam) initialFilter.location = locParam;
    if (typeParam) initialFilter.type = typeParam;
    if (searchParam) initialFilter.search = searchParam;

    loadProperties(initialFilter);

    document.querySelectorAll('.listing-category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.listing-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-cat');
            const typeFilter = cat === 'all' ? '' : (cat === 'house-lot' ? 'house' : cat);
            loadProperties({ type: typeFilter });
        });
    });
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
    loadProperties();
}

function applyFilter() {
    toggleFilter(false);
    const loc = document.getElementById('filterLocation') ? document.getElementById('filterLocation').value : '';
    const type = document.getElementById('filterType') ? document.getElementById('filterType').value : '';
    loadProperties({ location: loc, type: type });
}
