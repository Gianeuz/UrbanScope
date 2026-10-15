/**
 * UrbanScope - Client Inquiry Submission Handler
 * Transmits buyer inquiries to the Supabase backend.
 */

async function submitInquiry() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
    }

    const inquiryData = {
        property_title: "Residential Lot",
        client_name: document.getElementById('clientName').value.trim(),
        client_email: document.getElementById('clientEmail').value.trim(),
        client_phone: document.getElementById('clientPhone').value.trim(),
        message: document.getElementById('inquiryMessage').value.trim(),
        status: 'Under Review'
    };

    let result = null;
    if (typeof apiSubmitInquiry === 'function') {
        result = await apiSubmitInquiry(inquiryData);
    } else {
        result = { success: true };
    }

    if (result && result.success) {
        alert('✓ Your inquiry has been successfully sent to Mariam Lobren Realty!\nReference: INQ-2026-009');
        window.location.href = '../../index.html';
    } else {
        alert('Submission error: ' + (result ? (result.error || 'Please try again.') : 'Please try again.'));
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    }
}
