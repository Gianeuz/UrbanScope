/**
 * UrbanScope - Homepage Controller
 * Handles category tabs carousel scrolling, dynamic database loading,
 * in-page search filtering without page navigation, and smooth scrolling.
 */

function scrollCategories(direction) {
    const tabs = document.getElementById('categoryTabs');
    if (tabs) {
        tabs.scrollBy({ left: direction * 150, behavior: 'smooth' });
    }
}

let allCachedProperties = [];
let activeCategory = 'all';
let activeLocation = 'all';
let activeKeyword = '';
let activeSort = 'featured';

function normalizeStr(val) {
    if (!val) return '';
    return String(val)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_]/g, ' ')
        .toLowerCase()
        .trim();
}

function resolveCardImage(url) {
    if (!url) return 'assets/images/property1.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('../')) return url.substring(3);
    return url;
}

function getPropertyDetailUrl(item) {
    const title = (item.title || item.propertyName || '').toLowerCase();
    if (title.includes('liora')) return 'pages/properties/Liora.html';
    if (title.includes('airmen')) return 'pages/properties/Airmen.html';
    return `pages/properties/property-detail.html?id=${item.id}`;
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
    activeCategory = 'all';
    activeLocation = 'all';
    activeKeyword = '';

    const typeSelect = document.getElementById('typeFilter');
    const locSelect = document.getElementById('locationFilter');
    const keywordInput = document.getElementById('keyword');
    if (typeSelect) typeSelect.value = 'all';
    if (locSelect) locSelect.value = 'all';
    if (keywordInput) keywordInput.value = '';

    syncCategoryTabs('all');
    applyCurrentFiltersAndRender();
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
                <h4 style="font-size: 1.15rem; color: #1e293b; margin-bottom: 6px;">No properties found matching your criteria</h4>
                <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 14px;">Try selecting a different property type, location, or clearing search keywords.</p>
                <button onclick="resetHomeCategory()" style="background: #1f4928; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.88rem; transition: background 0.2s;">Reset Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = list.map(item => {
        const imgSrc = resolveCardImage(item.image_url);
        const detailUrl = getPropertyDetailUrl(item);
        const specsLot = item.lot_area ? `${item.lot_area} sqm` : (item.floor_area ? `${item.floor_area} sqm` : 'N/A');
        const rawStatus = String(item.status || 'Available').trim().toLowerCase();
        const isSold = rawStatus === 'sold' || rawStatus === 'sold out';
        const statusLabel = isSold ? 'Sold Out' : 'Available';

        return `
        <article class="property-card ${isSold ? 'card-sold' : ''}" onclick="location.href='${detailUrl}'">
            <div class="property-image">
                <span class="property-status-badge ${isSold ? 'badge-sold' : 'badge-available'}">
                    ${statusLabel}
                </span>
                <img src="${imgSrc}" alt="${item.title}" onerror="this.src='assets/images/property1.jpg'">
                <div class="card-actions">
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

function filterPropertyList(list, category, location, keyword) {
    if (!list || !Array.isArray(list)) return [];

    const cat = (category || 'all').toLowerCase().trim();
    const loc = (location || 'all').toLowerCase().trim();
    const kw = (keyword || '').trim();

    return list.filter(item => {
        // 1. Category / Type filter
        if (cat !== 'all') {
            const type = (item.property_type || item.propertyType || '').toLowerCase();
            const title = (item.title || item.propertyName || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const price = Number(item.price) || 0;

            let matchesCat = false;
            if (cat === 'villas' || cat === 'villa') {
                matchesCat = type.includes('villa') || title.includes('villa');
            } else if (cat === 'apartments' || cat === 'apartment') {
                matchesCat = type.includes('apartment') || type.includes('condo') || title.includes('apartment') || title.includes('condo');
            } else if (cat === 'townhouses' || cat === 'townhouse') {
                matchesCat = type.includes('townhouse') || type.includes('triplex') || type.includes('single attached') || title.includes('townhouse');
            } else if (cat === 'luxury' || cat === 'luxury villas') {
                matchesCat = type.includes('villa') || price >= 5000000 || title.includes('luxury') || desc.includes('luxury');
            } else if (cat === 'house-lot' || cat === 'house & lot') {
                matchesCat = type.includes('house') || type.includes('townhouse') || type.includes('subdivision') || type.includes('single attached') || type.includes('triplex') || type.includes('villa');
            } else if (cat === 'subdivision') {
                matchesCat = type.includes('subdivision') || title.includes('subdivision') || (item.subdivision_name && item.subdivision_name.trim().length > 0);
            } else {
                matchesCat = type.includes(cat) || title.includes(cat);
            }

            if (!matchesCat) return false;
        }

        // 2. Location filter
        if (loc !== 'all') {
            const cleanLoc = normalizeStr(loc);
            const itemLoc = normalizeStr(item.location || '');
            if (!itemLoc.includes(cleanLoc)) return false;
        }

        // 3. Keyword filter
        if (kw) {
            const cleanKw = normalizeStr(kw);
            const fields = [
                item.title,
                item.propertyName,
                item.location,
                item.property_type,
                item.propertyType,
                item.description,
                item.amenities
            ];
            const hasMatch = fields.some(f => normalizeStr(f).includes(cleanKw));
            if (!hasMatch) return false;
        }

        return true;
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
    } else if (sortKey === 'type') {
        sorted.sort((a, b) => {
            const typeA = (a.property_type || a.propertyType || '').toLowerCase();
            const typeB = (b.property_type || b.propertyType || '').toLowerCase();
            return typeA.localeCompare(typeB);
        });
    }
    return sorted;
}

function applyCurrentFiltersAndRender() {
    let filtered = filterPropertyList(allCachedProperties, activeCategory, activeLocation, activeKeyword);
    filtered = sortPropertyList(filtered, activeSort);
    renderFeaturedGrid(filtered);
}

function syncCategoryTabs(cat) {
    const tabs = document.querySelectorAll('.cat-tab');
    if (!tabs || tabs.length === 0) return;

    let target = (cat || 'all').toLowerCase().trim();
    if (target === 'villa') target = 'villas';
    else if (target === 'apartment') target = 'apartments';
    else if (target === 'townhouse') target = 'townhouses';

    let matched = false;
    tabs.forEach(tab => {
        const tabCat = tab.getAttribute('data-category');
        if (tabCat === target) {
            tab.classList.add('active');
            matched = true;
            try {
                tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } catch (e) {}
        } else {
            tab.classList.remove('active');
        }
    });

    if (!matched) {
        const allTab = document.querySelector('.cat-tab[data-category="all"]');
        if (allTab) allTab.classList.add('active');
    }
}

function scrollToFeatured() {
    const target = document.getElementById('properties');
    if (!target) return;

    const nav = document.querySelector('.navbar');
    const navHeight = nav ? nav.offsetHeight : 90;
    const targetY = target.getBoundingClientRect().top + window.pageYOffset - navHeight + 10;

    window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
    });
}

function handleSearchSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const typeSelect = document.getElementById('typeFilter');
    const locSelect = document.getElementById('locationFilter');
    const keywordInput = document.getElementById('keyword');

    activeCategory = typeSelect ? typeSelect.value : 'all';
    activeLocation = locSelect ? locSelect.value : 'all';
    activeKeyword = keywordInput ? keywordInput.value.trim() : '';

    syncCategoryTabs(activeCategory);
    applyCurrentFiltersAndRender();
    scrollToFeatured();
}

async function loadHomeProperties(category = 'all') {
    activeCategory = category;

    // Fast-path: if properties are already loaded in memory, filter and render instantly
    if (allCachedProperties.length > 0) {
        applyCurrentFiltersAndRender();
        return;
    }

    // Try local storage cache immediately
    try {
        const cached = JSON.parse(localStorage.getItem('cached_live_properties') || localStorage.getItem('urbanScopeProperties') || '[]');
        if (Array.isArray(cached) && cached.length > 0) {
            allCachedProperties = cached;
            applyCurrentFiltersAndRender();
        }
    } catch (e) {}

    // Fetch from backend API
    if (typeof apiGetProperties === 'function') {
        try {
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

    // Fallback: parse initial static DOM property cards if data isn't in memory yet
    if (allCachedProperties.length === 0) {
        const staticArticles = document.querySelectorAll('#propertyGrid article.property-card');
        if (staticArticles.length > 0) {
            allCachedProperties = Array.from(staticArticles).map((art, idx) => {
                const title = art.querySelector('h3')?.textContent.trim() || `Property ${idx + 1}`;
                const location = art.querySelector('.property-location')?.textContent.trim() || 'Cavite';
                const priceText = art.querySelector('.property-price')?.textContent.replace(/[^0-9.]/g, '') || '0';
                const img = art.querySelector('img')?.getAttribute('src') || 'assets/images/property1.jpg';
                return {
                    id: idx + 1,
                    title: title,
                    location: location,
                    property_type: title.toLowerCase().includes('villa') ? 'Villa' : (title.toLowerCase().includes('triplex') ? 'Triplex' : 'Townhouse'),
                    price: parseFloat(priceText) || 0,
                    image_url: img
                };
            });
            applyCurrentFiltersAndRender();
        }
    }
}

// Category tabs click listeners and initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial load from live database
    loadHomeProperties('all');

    // 2. Intercept search bar form submission (prevents page reload / navigation)
    const searchForm = document.getElementById('propertySearch');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }

    // 3. Category tabs interaction
    document.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.getAttribute('data-category') || 'all';
            activeCategory = category;

            // Also keep search form type filter in sync
            const typeSelect = document.getElementById('typeFilter');
            if (typeSelect) {
                if (category === 'all') typeSelect.value = 'all';
                else if (category === 'villas') typeSelect.value = 'villa';
                else if (category === 'apartments') typeSelect.value = 'apartment';
                else if (category === 'townhouses') typeSelect.value = 'townhouse';
                else typeSelect.value = category;
            }

            applyCurrentFiltersAndRender();
        });
    });

    // 4. Sort dropdown
    const sortSelect = document.getElementById('homeSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            activeSort = e.target.value;
            applyCurrentFiltersAndRender();
        });
    }

    // 5. Check if query params were passed on page load
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');
    const urlLoc = urlParams.get('location');
    const urlKw = urlParams.get('keyword') || urlParams.get('search');

    if (urlType || urlLoc || urlKw) {
        if (urlType && urlType !== 'all') {
            activeCategory = urlType;
            const typeSelect = document.getElementById('typeFilter');
            if (typeSelect) typeSelect.value = urlType;
            syncCategoryTabs(urlType);
        }
        if (urlLoc && urlLoc !== 'all') {
            activeLocation = urlLoc;
            const locSelect = document.getElementById('locationFilter');
            if (locSelect) locSelect.value = urlLoc;
        }
        if (urlKw) {
            activeKeyword = urlKw;
            const kwInput = document.getElementById('keyword');
            if (kwInput) kwInput.value = urlKw;
        }
        applyCurrentFiltersAndRender();
    }

    // 6. Smooth scroll to Discover Our Featured Properties on "Properties" click
    document.querySelectorAll('a[href="#properties"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = document.getElementById('properties');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, null, '#properties');
            }
        });
    });

    // 7. FAQs Accordion Interactive Toggle
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        if (questionBtn) {
            questionBtn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close other items for a clean, focused accordion experience
                faqItems.forEach(other => {
                    other.classList.remove('active');
                    const otherBtn = other.querySelector('.faq-question');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                });

                if (!isActive) {
                    item.classList.add('active');
                    questionBtn.setAttribute('aria-expanded', 'true');
                }
            });
        }
    });

    // 8. Smooth scroll for FAQs anchor
    document.querySelectorAll('a[href="#faqs"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = document.getElementById('faqs');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, null, '#faqs');
            }
        });
    });

    // 9. Consultation Intent Modal Controller
    initConsultationIntentModal();

    // 10. Dynamic Agent Profile & Contact Information (synced with admin settings)
    initDynamicAgentDetails();
});

function initConsultationIntentModal() {
    const modal = document.getElementById('consultationIntentModal');
    const closeBtn = document.getElementById('closeIntentModalBtn');
    if (!modal) return;

    function openModal(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        }
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Capture clicks on all consultation triggers (CTA button, FAQs link, footer consultation)
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('#ctaConsultBtn, .cta-consult-btn, .faqs-contact-link, a[href="pages/inquiry/inquiry.html"]');
        if (trigger && !trigger.closest('#consultationIntentModal')) {
            openModal(e);
        }
    }, true);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

function renderHomepageAgentDetails(profile) {
    if (!profile) return;

    const rawName = profile.name || profile.full_name || 'Miriam Lobren';
    const cleanName = String(rawName).replace(/\s*\((?:Admin|Administrator)\)\s*$/i, '').trim() || rawName;
    const title = profile.title || 'Licensed Real Estate Broker / Agent';
    const brokerage = profile.brokerage || 'CD Miranda Realty';
    const phone = profile.phone || '+63 900 000 0000';
    const email = profile.email || 'admin.realestate@gmail.com';
    const bio = profile.bio || 'Serving Las Piñas, Cavite, and surrounding prime locations with high-integrity real estate solutions.';
    const avatarUrl = profile.avatar_url || 'assets/images/agent.jpg';
    const cleanDigits = phone.replace(/[^\d+]/g, '');

    // 1. Navigation Brand
    const navName = document.getElementById('navAgentName');
    if (navName) navName.textContent = cleanName;
    const navTitle = document.getElementById('navAgentTitle');
    if (navTitle) navTitle.textContent = title.toUpperCase();

    // 2. About Me Section
    const aboutName = document.getElementById('aboutAgentName');
    if (aboutName) aboutName.textContent = cleanName;
    const aboutBrokerage = document.getElementById('aboutAgentBrokerage');
    if (aboutBrokerage) aboutBrokerage.textContent = brokerage;
    const aboutBio = document.getElementById('aboutAgentBioText');
    if (aboutBio && bio) aboutBio.textContent = bio;
    const aboutPhoto = document.getElementById('aboutAgentPhoto');
    if (aboutPhoto && avatarUrl) {
        aboutPhoto.src = avatarUrl;
        aboutPhoto.alt = `${cleanName} - ${title}`;
    }

    // 3. FAQs Section
    const faqName = document.getElementById('faqAgentName');
    if (faqName) faqName.textContent = cleanName;
    const faqPhone = document.getElementById('faqAgentPhone');
    if (faqPhone) faqPhone.textContent = phone;
    const faqBtn = document.getElementById('faqContactBtnText');
    if (faqBtn) faqBtn.textContent = `Speak with ${cleanName}`;

    // 4. CTA Banner
    const ctaName = document.getElementById('ctaAgentName');
    if (ctaName) ctaName.textContent = cleanName;
    const ctaBrokerage = document.getElementById('ctaAgentBrokerage');
    if (ctaBrokerage) ctaBrokerage.textContent = brokerage;

    // 5. Footer Details
    const footerName = document.getElementById('footerAgentName');
    if (footerName) footerName.textContent = cleanName;
    const footerBio = document.getElementById('footerAgentBio');
    if (footerBio && bio) {
        footerBio.textContent = `Trusted real estate agent affiliated with ${brokerage}. ${bio}`;
    }
    const footerPhone = document.getElementById('footerAgentPhone');
    if (footerPhone) {
        footerPhone.textContent = phone;
        footerPhone.href = `tel:${cleanDigits}`;
    }
    const footerEmail = document.getElementById('footerAgentEmail');
    if (footerEmail) {
        footerEmail.textContent = email;
        footerEmail.href = `mailto:${email}`;
    }
}

async function initDynamicAgentDetails() {
    // Immediate render from localStorage (0ms latency, eliminates any flash of old details)
    let localProfile = null;
    try {
        localProfile = JSON.parse(localStorage.getItem('urbanscope_admin_profile') || 'null');
        if (!localProfile) {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
            if (adminUser && adminUser.email === 'admin.realestate@gmail.com') {
                localProfile = adminUser;
            }
        }
    } catch (e) {}

    if (localProfile) {
        renderHomepageAgentDetails(localProfile);
    }

    // Background fetch from API Gateway (FastAPI local backend + Supabase Cloud)
    if (typeof window.apiGetLeadAgentProfile === 'function') {
        try {
            const remoteProfile = await window.apiGetLeadAgentProfile();
            if (remoteProfile) {
                renderHomepageAgentDetails(remoteProfile);
            }
        } catch (err) {
            console.warn('Background agent profile fetch note:', err);
        }
    }

    // Real-time synchronization across browser tabs (when admin updates profile in admin settings)
    window.addEventListener('storage', (e) => {
        if (e.key === 'urbanscope_admin_profile' || e.key === 'adminUser') {
            try {
                const updated = JSON.parse(e.newValue || '{}');
                if (updated && (updated.name || updated.email || updated.phone)) {
                    renderHomepageAgentDetails(updated);
                }
            } catch (err) {}
        }
    });
}

