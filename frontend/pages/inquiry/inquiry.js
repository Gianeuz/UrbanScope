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

function showSuccessModal(inquiryData, scheduleDetails) {
    const modal = document.getElementById('inquirySuccessModal');
    if (!modal) return;

    const propTitleEl = document.getElementById('successPropertyTitle');
    if (propTitleEl) propTitleEl.textContent = inquiryData.property_title || 'General Consultation';

    const nameEl = document.getElementById('successClientName');
    if (nameEl) nameEl.textContent = inquiryData.client_name || '--';

    const emailEl = document.getElementById('successClientEmail');
    if (emailEl) emailEl.textContent = inquiryData.client_email || '--';

    const phoneEl = document.getElementById('successClientPhone');
    if (phoneEl) phoneEl.textContent = inquiryData.client_phone || 'None provided';

    const dateStampEl = document.getElementById('successDateStamp');
    if (dateStampEl) {
        const now = new Date();
        dateStampEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    const scheduleBox = document.getElementById('successScheduleBox');
    const scheduleText = document.getElementById('successScheduleText');
    if (scheduleDetails) {
        if (scheduleBox) scheduleBox.style.display = 'inline-flex';
        if (scheduleText) scheduleText.textContent = `Schedule: ${scheduleDetails}`;
    } else {
        if (scheduleBox) scheduleBox.style.display = 'none';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    const modal = document.getElementById('inquirySuccessModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function resetFormAndCloseModal() {
    closeSuccessModal();
    const textarea = document.getElementById('inquiryMessage');
    if (textarea) textarea.value = '';
    const prefDate = document.getElementById('preferredDate');
    if (prefDate) prefDate.value = '';
    showToastNotice('You can submit another consultation inquiry below.', false);
}

function showToastNotice(message, isError = false) {
    const toast = document.getElementById('toastNotice');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');
    if (!toast) return;

    if (msgEl) msgEl.textContent = message;
    if (isError) {
        toast.classList.add('error');
        if (iconEl) {
            iconEl.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
        }
    } else {
        toast.classList.remove('error');
        if (iconEl) {
            iconEl.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
        }
    }

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4500);
}

async function submitInquiry() {
    const submitBtn = document.querySelector('.submit-btn');
    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-spinner"></span> <span>Sending Request...</span>';
        submitBtn.style.opacity = '0.85';
    }

    const clientName = document.getElementById('clientName').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const rawMessage = document.getElementById('inquiryMessage').value.trim();

    let propertyTitle = "General Consultation";
    let formattedMessage = rawMessage;
    let scheduleDetails = null;

    if (currentInquiryMode === 'general') {
        const topic = document.getElementById('consultationTopic').value;
        const prefDate = document.getElementById('preferredDate').value;
        const prefTime = document.getElementById('preferredTime').value;

        propertyTitle = `General Consultation: ${topic}`;
        let scheduleNote = '';
        if (prefDate) {
            scheduleDetails = `${prefDate} (${prefTime})`;
            scheduleNote = `[Preferred Schedule: ${prefDate} | ${prefTime}]\n\n`;
        } else if (prefTime && prefTime !== 'Flexible / Any Time') {
            scheduleDetails = `${prefTime}`;
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

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
        submitBtn.style.opacity = '1';
    }

    if (result && result.success) {
        showSuccessModal(inquiryData, scheduleDetails);
    } else {
        const errMsg = result ? (result.error || 'Unable to submit inquiry. Please try again.') : 'Unable to submit inquiry. Please try again.';
        showToastNotice(errMsg, true);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Set min date on datepicker to today
    const dateInput = document.getElementById('preferredDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Modal close handlers
    const closeBtn = document.getElementById('closeSuccessModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeSuccessModal);

    const submitAnotherBtn = document.getElementById('submitAnotherBtn');
    if (submitAnotherBtn) submitAnotherBtn.addEventListener('click', resetFormAndCloseModal);

    const modal = document.getElementById('inquirySuccessModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeSuccessModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSuccessModal();
    });

    loadPropertiesCatalog();
});
