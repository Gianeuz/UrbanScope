/**
 * UrbanScope - Homepage Controller
 * Handles category tabs carousel scrolling, dynamic database loading,
 * and featured properties filtering from the Python/SQLite backend.
 */

function scrollCategories(direction) {
    const tabs = document.getElementById('categoryTabs');
    if (tabs) {
        tabs.scrollBy({ left: direction * 150, behavior: 'smooth' });
    }
}

let homepageProperties = [];

function resolveCardImage(url) {
    if (!url) return 'assets/images/property1.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('../')) return url.substring(3);
    return url;
}

function copyPropertyLink(id) {
    const url = window.location.origin + '/pages/properties/property-detail.html?id=' + id;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            alert('Property link copied to clipboard!');
        }).catch(() => {
            alert('Property link: ' + url);
        });
    } else {
        alert('Property link: ' + url);
    }
}

function resetHomeCategory() {
    const allTab = document.querySelector('.cat-tab[data-category="all"]');
    if (allTab) {
        allTab.click();
    } else {
        loadHomeProperties('all');
    }
}

function renderFeaturedGrid(list) {
    const grid = document.getElementById('propertyGrid');
    if (!grid) return;

    if (!list || list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: #fdfdfd; border-radius: 12px; border: 1px dashed #cbd5e1; margin: 10px 0;">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" style="margin-bottom: 10px;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h4 style="font-size: 1.15rem; color: #1e293b; margin-bottom: 6px;">No properties found in this category</h4>
                <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 14px;">Explore our other categories or check back soon.</p>
                <button onclick="resetHomeCategory()" style="background: #1f4928; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">View All Categories</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = list.map(item => {
        const imgSrc = resolveCardImage(item.image_url);
        const detailUrl = `pages/properties/property-detail.html?id=${item.id}`;
        const specsLot = item.lot_area ? `${item.lot_area} sqm` : (item.floor_area ? `${item.floor_area} sqm` : 'N/A');

        return `
        <article class="property-card" onclick="location.href='${detailUrl}'">
            <div class="property-image">
                <img src="${imgSrc}" alt="${item.title}" onerror="this.src='assets/images/property1.jpg'">
                <div class="card-actions">
                    <button class="card-icon-btn fav-btn" type="button" aria-label="Add to favorites"
                        onclick="event.stopPropagation(); this.classList.toggle('active')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
                            </path>
                        </svg>
                    </button>
                    <button class="card-icon-btn share-btn" type="button" aria-label="Share property"
                        onclick="event.stopPropagation(); copyPropertyLink('${item.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="property-info">
                <h3>${item.title}</h3>
                <p class="property-location">${item.location}</p>
                <div class="property-details">
                    <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
                        </svg> ${item.bedrooms || 0} Beds</span>
                    <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M9 6h6a2 2 0 0 1 2 2v10H7V8a2 2 0 0 1 2-2z" />
                        </svg> ${item.bathrooms || 0} Baths</span>
                    <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg> ${specsLot}</span>
                </div>
                <strong class="property-price">₱${Number(item.price || 0).toLocaleString()}</strong>
            </div>
        </article>
        `;
    }).join('');
}

let allCachedProperties = [];
let activeCategory = 'all';
let activeSort = 'featured';

function filterPropertyList(list, category) {
    if (!list || !Array.isArray(list)) return [];
    if (!category || category === 'all') return [...list];

    const c = category.toLowerCase().trim();
    return list.filter(item => {
        const type = (item.property_type || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const price = Number(item.price) || 0;

        if (c === 'villas' || c === 'villa') {
            return type.includes('villa') || title.includes('villa');
        }
        if (c === 'apartments' || c === 'apartment') {
            return type.includes('apartment') || type.includes('condo') || title.includes('apartment') || title.includes('condo');
        }
        if (c === 'townhouses' || c === 'townhouse') {
            return type.includes('townhouse') || type.includes('triplex') || title.includes('townhouse');
        }
        if (c === 'luxury') {
            return type.includes('villa') || price >= 5000000 || title.includes('luxury') || desc.includes('luxury');
        }
        if (c === 'house-lot' || c === 'house & lot') {
            return type.includes('house') || type.includes('townhouse') || type.includes('subdivision') || type.includes('single attached') || type.includes('triplex') || type.includes('villa');
        }
        if (c === 'subdivision') {
            return type.includes('subdivision') || title.includes('subdivision') || (item.subdivision_name && item.subdivision_name.trim().length > 0);
        }
        return type.includes(c) || title.includes(c);
    });
}

function sortPropertyList(list, sortKey) {
    const sorted = [...list];
    if (sortKey === 'price-low') {
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortKey === 'price-high') {
        sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortKey === 'newest') {
        sorted.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    }
    return sorted;
}

function applyCurrentFiltersAndRender() {
    let filtered = filterPropertyList(allCachedProperties, activeCategory);
    filtered = sortPropertyList(filtered, activeSort);
    renderFeaturedGrid(filtered);
}

async function loadHomeProperties(category = 'all') {
    activeCategory = category;

    // If we already have cached properties, render immediately for instant feedback
    if (allCachedProperties.length > 0) {
        applyCurrentFiltersAndRender();
    }

    if (typeof apiGetProperties === 'function') {
        try {
            // Fetch live dataset from Supabase
            const data = await apiGetProperties({});
            if (data && Array.isArray(data) && data.length > 0) {
                allCachedProperties = data;
                applyCurrentFiltersAndRender();
                return;
            }
        } catch (e) {
            console.warn('Live property fetch notice:', e);
        }
    }
}

// Category tabs click listeners and initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initial load from live database
    loadHomeProperties('all');

    // Category tabs interaction
    document.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.getAttribute('data-category') || 'all';
            loadHomeProperties(category);
        });
    });

    // Optional sort dropdown if present
    const sortSelect = document.getElementById('homeSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            activeSort = e.target.value;
            applyCurrentFiltersAndRender();
        });
    }
});
