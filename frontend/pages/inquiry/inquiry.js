/**
 * UrbanScope - Client Inquiry Submission Handler
 * Supports two distinct consultation pathways:
 * 1. General Consultation & Inquiries (Site viewing, loans, advice)
 * 2. Specific Property Inquiry (Dynamic catalog selection)
 */

let currentInquiryMode = 'general';
let loadedProperties = [];
let selectedProperty = null;

function resolvePropImage(url) {
    if (!url) return '../../assets/images/property1.jpg';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('../../')) return url;
    if (url.startsWith('../')) return '../' + url;
    return '../../' + url.replace(/^(\.\.\/)+/, '');
}

function switchInquiryMode(mode) {
    currentInquiryMode = mode;
    const tabGeneral = document.getElementById('tabGeneral');
    const tabProperty = document.getElementById('tabProperty');
    const consultationSection = document.getElementById('consultationSection');
    const propertySection = document.getElementById('propertySection');
    const messageLabel = document.getElementById('inquiryMessageLabel');
    const messageTextarea = document.getElementById('inquiryMessage');

    if (mode === 'general') {
        if (tabGeneral) {
            tabGeneral.classList.add('active');
            tabGeneral.setAttribute('aria-selected', 'true');
        }
        if (tabProperty) {
            tabProperty.classList.remove('active');
            tabProperty.setAttribute('aria-selected', 'false');
        }
        if (consultationSection) consultationSection.style.display = 'block';
        if (propertySection) propertySection.style.display = 'none';

        if (messageLabel) {
            messageLabel.textContent = 'What would you like to discuss or ask Miriam Lobren?*';
        }
        if (messageTextarea) {
            messageTextarea.placeholder = "Tell us what you'd like to ask or discuss, any questions about financing or locations, or your preferred site viewing schedule...";
            // If the textarea currently has the property default text, clear it for user convenience
            if (messageTextarea.value.includes("I'm interested and would like to know more about this property")) {
                messageTextarea.value = "";
            }
        }
    } else {
        if (tabGeneral) {
            tabGeneral.classList.remove('active');
            tabGeneral.setAttribute('aria-selected', 'false');
        }
        if (tabProperty) {
            tabProperty.classList.add('active');
            tabProperty.setAttribute('aria-selected', 'true');
        }
        if (consultationSection) consultationSection.style.display = 'none';
        if (propertySection) propertySection.style.display = 'block';

        if (messageLabel) {
            messageLabel.textContent = 'Message*';
        }
        if (messageTextarea) {
            messageTextarea.placeholder = "I'm interested and would like to know more about this property. Are there any available units and what are the payment terms?";
            if (!messageTextarea.value.trim()) {
                messageTextarea.value = "I'm interested and would like to know more about this property. Are there any available units and what are the payment terms?";
            }
        }

        // Render current selection
        if (selectedProperty) {
            renderSelectedProperty(selectedProperty);
        }
    }
}

function renderSelectedProperty(prop) {
    if (!prop) return;
    const thumbEl = document.getElementById('propSummaryThumb');
    const titleEl = document.getElementById('propSummaryTitle');
    const locEl = document.getElementById('propSummaryLocText');
    const lotVal = document.getElementById('propLotVal');
    const typeVal = document.getElementById('propTypeVal');
    const priceVal = document.getElementById('propPriceVal');

    if (thumbEl) {
        thumbEl.src = resolvePropImage(prop.image_url);
        thumbEl.alt = prop.title || prop.propertyName || 'Property';
    }
    if (titleEl) titleEl.textContent = prop.title || prop.propertyName || 'Property Listing';
    if (locEl) locEl.textContent = prop.location || 'Cavite / Las Piñas';
    if (lotVal) lotVal.textContent = (prop.lot_area || prop.floor_area || 120) + ' sqm';
    if (typeVal) typeVal.textContent = prop.property_type || 'Residential';
    if (priceVal) priceVal.textContent = '₱' + Number(prop.price || 0).toLocaleString();
}

function onPropertySelectionChange() {
    const select = document.getElementById('propertySelect');
    if (!select || !select.value) return;

    const propId = String(select.value);
    const found = loadedProperties.find(p => String(p.id) === propId);
    if (found) {
        selectedProperty = found;
        renderSelectedProperty(found);
    }
}

async function loadPropertiesCatalog() {
    try {
        if (typeof apiGetProperties === 'function') {
            const list = await apiGetProperties();
            if (Array.isArray(list) && list.length > 0) {
                loadedProperties = list;
            }
        }
    } catch (err) {
        console.warn('Error fetching live properties catalog:', err);
    }

    // Fallback if needed
    if (loadedProperties.length === 0) {
        try {
            const cached = JSON.parse(localStorage.getItem('cached_live_properties') || localStorage.getItem('urbanScopeProperties') || '[]');
            if (Array.isArray(cached) && cached.length > 0) {
                loadedProperties = cached;
            }
        } catch (e) {}
    }

    if (loadedProperties.length === 0) {
        loadedProperties = [
            {
                id: 1,
                title: "Residential Lot",
                location: "Manuyo, Las Piñas City",
                property_type: "Residential Lot",
                price: 3500000,
                lot_area: 200,
                image_url: "assets/images/property1.jpg"
            },
            {
                id: 2,
                title: "Liora Homes",
                location: "Pasong Buaya II, Imus, Cavite",
                property_type: "Townhouse",
                price: 2850000,
                lot_area: 72,
                image_url: "assets/images/liora.png"
            },
            {
                id: 3,
                title: "Airmen's Village",
                location: "Pulang Lupa Dos, Las Piñas City",
                property_type: "Subdivision",
                price: 4200000,
                lot_area: 120,
                image_url: "assets/images/airmen.png"
            }
        ];
    }

    // Populate propertySelect dropdown
    const select = document.getElementById('propertySelect');
    if (select) {
        select.innerHTML = loadedProperties.map(p => {
            const title = p.title || p.propertyName || 'Property';
            const loc = p.location ? ` - ${p.location}` : '';
            const price = p.price ? ` (₱${Number(p.price).toLocaleString()})` : '';
            return `<option value="${p.id}">${title}${loc}${price}</option>`;
        }).join('');
    }

    // Read URL params to determine initial mode & property
    const urlParams = new URLSearchParams(window.location.search);
    const paramType = (urlParams.get('type') || '').toLowerCase();
    const paramId = urlParams.get('id') || urlParams.get('property_id');
    const paramTitle = (urlParams.get('title') || '').toLowerCase();

    let matched = null;
    if (paramId) {
        matched = loadedProperties.find(p => String(p.id) === String(paramId));
    }
    if (!matched && paramTitle) {
        matched = loadedProperties.find(p => (p.title || p.propertyName || '').toLowerCase().includes(paramTitle));
    }

    if (matched) {
        selectedProperty = matched;
        if (select) select.value = String(matched.id);
        renderSelectedProperty(matched);
        switchInquiryMode('property');
    } else if (paramType === 'property') {
        selectedProperty = loadedProperties[0] || null;
        if (select && selectedProperty) select.value = String(selectedProperty.id);
        if (selectedProperty) renderSelectedProperty(selectedProperty);
        switchInquiryMode('property');
    } else {
        // Default to General Consultation (eliminates forced/unwanted property selection)
        selectedProperty = loadedProperties[0] || null;
        if (selectedProperty) renderSelectedProperty(selectedProperty);
        switchInquiryMode('general');
    }
}

async function submitInquiry() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
    }

    const clientName = document.getElementById('clientName').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const rawMessage = document.getElementById('inquiryMessage').value.trim();

    let propertyTitle = "General Consultation";
    let formattedMessage = rawMessage;

    if (currentInquiryMode === 'general') {
        const topic = document.getElementById('consultationTopic').value;
        const prefDate = document.getElementById('preferredDate').value;
        const prefTime = document.getElementById('preferredTime').value;

        propertyTitle = `General Consultation: ${topic}`;
        let scheduleNote = '';
        if (prefDate) {
            scheduleNote = `[Preferred Schedule: ${prefDate} | ${prefTime}]\n\n`;
        } else if (prefTime && prefTime !== 'Flexible / Any Time') {
            scheduleNote = `[Preferred Slot: ${prefTime}]\n\n`;
        }
        formattedMessage = scheduleNote + rawMessage;
    } else {
        propertyTitle = selectedProperty ? (selectedProperty.title || selectedProperty.propertyName || "Property Inquiry") : "Property Inquiry";
    }

    const inquiryData = {
        property_title: propertyTitle,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        message: formattedMessage,
        status: 'Under Review'
    };

    let result = null;
    try {
        if (typeof apiSubmitInquiry === 'function') {
            result = await apiSubmitInquiry(inquiryData);
        } else {
            result = { success: true };
        }
    } catch (err) {
        console.error('Submission request failed:', err);
        result = { success: false, error: err.message };
    }

    if (result && result.success) {
        alert(`✓ Your consultation request has been successfully sent to Miriam Lobren Realty!\n\nSubject: ${propertyTitle}\nWe will contact you shortly.`);
        window.location.href = '../../index.html';
    } else {
        alert('Submission error: ' + (result ? (result.error || 'Please try again.') : 'Please try again.'));
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Set min date on datepicker to today
    const dateInput = document.getElementById('preferredDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    loadPropertiesCatalog();
});
