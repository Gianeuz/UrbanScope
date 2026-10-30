/**
 * UrbanScope - Client Inquiry History Controller
 * Handles loading, filtering, real-time searching, modifying, cancelling,
 * and deleting a client's submitted inquiries.
 */

(function () {
    let currentUser = null;
    let allInquiries = [];
    let currentFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const inquiriesListEl = document.getElementById('inquiriesList');
    const emptyStateEl = document.getElementById('emptyState');
    const searchInputEl = document.getElementById('searchInquiriesInput');
    const filterTabs = document.querySelectorAll('.filter-tab');

    const statTotalEl = document.getElementById('statTotal');
    const statUnderReviewEl = document.getElementById('statUnderReview');
    const statScheduledEl = document.getElementById('statScheduled');
    const statCancelledEl = document.getElementById('statCancelled');

    // Modals
    const modifyModal = document.getElementById('modifyModal');
    const cancelModal = document.getElementById('cancelModal');
    const deleteModal = document.getElementById('deleteModal');
    const toastNotice = document.getElementById('toastNotice');
    const toastMessage = document.getElementById('toastMessage');

    // ==========================================
    // INITIALIZATION & USER SESSION
    // ==========================================
    async function initHistoryPage() {
        if (window.UrbanSession && typeof window.UrbanSession.getUser === 'function') {
            currentUser = await window.UrbanSession.getUser();
        }

        if (!currentUser) {
            try {
                currentUser = JSON.parse(localStorage.getItem('urbanscope_demo_user'));
            } catch (e) {}
        }

        if (!currentUser) {
            // Give session.js a moment to resolve, otherwise it handles redirect
            document.addEventListener('urbanscope:user', function (e) {
                if (e.detail) {
                    currentUser = e.detail;
                    loadInquiries();
                }
            }, { once: true });
            return;
        }

        loadInquiries();
    }

    // ==========================================
    // FETCH INQUIRIES
    // ==========================================
    async function loadInquiries() {
        if (!currentUser) return;
        inquiriesListEl.innerHTML = `
            <div style="text-align:center; padding: 48px; color: var(--text-muted);">
                <div class="empty-state-icon" style="animation: spin 1s linear infinite;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                </div>
                <p style="font-weight:700; color:var(--dark-green);">Loading your inquiries...</p>
            </div>
        `;

        const email = currentUser.email || '';
        if (typeof window.apiGetMyInquiries === 'function') {
            try {
                allInquiries = await window.apiGetMyInquiries(email);
            } catch (err) {
                console.warn('Notice loading inquiries:', err);
                allInquiries = [];
            }
        } else {
            // Fallback from localStorage
            try {
                const cached = JSON.parse(localStorage.getItem('inquiries') || '[]');
                allInquiries = cached.filter(i => (i.client_email || i.clientEmail || '').trim().toLowerCase() === email.toLowerCase());
            } catch (e) {
                allInquiries = [];
            }
        }

        updateStats();
        renderInquiries();
    }

    // ==========================================
    // UPDATE STATS COUNTERS
    // ==========================================
    function updateStats() {
        const total = allInquiries.length;
        const underReview = allInquiries.filter(i => (i.status || '').toLowerCase() === 'under review').length;
        const scheduled = allInquiries.filter(i => (i.status || '').toLowerCase() === 'scheduled' || (i.status || '').toLowerCase() === 'contacted').length;
        const cancelled = allInquiries.filter(i => (i.status || '').toLowerCase() === 'cancelled').length;

        if (statTotalEl) statTotalEl.textContent = total;
        if (statUnderReviewEl) statUnderReviewEl.textContent = underReview;
        if (statScheduledEl) statScheduledEl.textContent = scheduled;
        if (statCancelledEl) statCancelledEl.textContent = cancelled;
    }

    // ==========================================
    // RENDER INQUIRIES LIST
    // ==========================================
    function renderInquiries() {
        const filtered = allInquiries.filter(item => {
            const statusMatch = (currentFilter === 'all') ||
                (item.status && item.status.toLowerCase() === currentFilter.toLowerCase());

            if (!statusMatch) return false;

            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const title = (item.property_title || item.propertyTitle || '').toLowerCase();
            const message = (item.message || '').toLowerCase();
            const phone = (item.client_phone || item.clientPhone || '').toLowerCase();
            const idStr = String(item.id || '');
            return title.includes(q) || message.includes(q) || phone.includes(q) || idStr.includes(q);
        });

        if (filtered.length === 0) {
            inquiriesListEl.innerHTML = '';
            emptyStateEl.style.display = 'block';

            const emptyTitle = document.getElementById('emptyStateTitle');
            const emptyDesc = document.getElementById('emptyStateDesc');
            if (searchQuery || currentFilter !== 'all') {
                if (emptyTitle) emptyTitle.textContent = 'No Matching Inquiries';
                if (emptyDesc) emptyDesc.textContent = 'No inquiries match your current filter or search criteria. Try clearing the search or switching filter tabs.';
            } else {
                if (emptyTitle) emptyTitle.textContent = 'No Inquiries Found';
                if (emptyDesc) emptyDesc.textContent = "You haven't submitted any inquiries or consultation requests yet. Looking for a home or need financing guidance?";
            }
            return;
        }

        emptyStateEl.style.display = 'none';

        inquiriesListEl.innerHTML = filtered.map(item => {
            const rawStatus = item.status || 'Under Review';
            const statusClass = getStatusClass(rawStatus);
            const formattedDate = formatDate(item.created_at);
            const title = escHtml(item.property_title || item.propertyTitle || 'General Consultation');
            const phone = escHtml(item.client_phone || item.clientPhone || 'Not specified');
            const email = escHtml(item.client_email || item.clientEmail || currentUser.email || '');
            const message = escHtml(item.message || 'No details provided.');
            const isCancelled = rawStatus.toLowerCase() === 'cancelled';
            const isClosed = rawStatus.toLowerCase() === 'closed';

            return `
                <article class="inquiry-card" data-id="${item.id}">
                    <div class="card-top-row">
                        <div class="card-topic-group">
                            <div class="topic-icon-badge">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="card-title">${title}</h3>
                                <div class="card-meta-line">
                                    <span>Inquiry #${item.id}</span>
                                    <span>&bull;</span>
                                    <span>Submitted ${formattedDate}</span>
                                </div>
                            </div>
                        </div>

                        <div class="status-pill ${statusClass}">
                            <span class="status-dot"></span>
                            <span>${rawStatus}</span>
                        </div>
                    </div>

                    <div class="card-contact-row">
                        <div class="contact-item">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            <span>${phone}</span>
                        </div>
                        <div class="contact-item">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            <span>${email}</span>
                        </div>
                    </div>

                    <div class="card-message-box">
                        <div class="card-message-label">Inquiry Message / Request Details</div>
                        <p class="card-message-text">${message}</p>
                    </div>

                    <div class="card-actions-row">
                        ${!isClosed ? `
                            <button type="button" class="card-btn btn-modify" onclick="openModifyModal(${item.id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                <span>Modify Details</span>
                            </button>
                        ` : ''}

                        ${(!isCancelled && !isClosed) ? `
                            <button type="button" class="card-btn btn-cancel" onclick="openCancelModal(${item.id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                <span>Cancel Inquiry</span>
                            </button>
                        ` : ''}

                        <button type="button" class="card-btn btn-delete" onclick="openDeleteModal(${item.id})">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            <span>Delete</span>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    // ==========================================
    // MODAL TRIGGERS & HANDLERS
    // ==========================================

    // 1. MODIFY MODAL
    window.openModifyModal = function (id) {
        const item = allInquiries.find(i => String(i.id) === String(id));
        if (!item) return;

        document.getElementById('modifyInquiryId').value = item.id;
        document.getElementById('modifyPropertyTitle').value = item.property_title || item.propertyTitle || 'General Consultation';
        document.getElementById('modifyClientPhone').value = item.client_phone || item.clientPhone || '';
        document.getElementById('modifyMessage').value = item.message || '';

        modifyModal.classList.add('active');
        document.getElementById('modifyMessage').focus();
    };

    window.closeModifyModal = function () {
        modifyModal.classList.remove('active');
    };

    window.handleSaveModify = async function (e) {
        e.preventDefault();
        const id = document.getElementById('modifyInquiryId').value;
        const property_title = document.getElementById('modifyPropertyTitle').value.trim();
        const client_phone = document.getElementById('modifyClientPhone').value.trim();
        const message = document.getElementById('modifyMessage').value.trim();
        const saveBtn = document.getElementById('modifySaveBtn');

        if (!property_title || !message) {
            alert('Please provide both a property/topic title and your inquiry details.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const updates = { property_title, client_phone, message };
        let success = false;

        if (typeof window.apiUpdateMyInquiry === 'function') {
            const res = await window.apiUpdateMyInquiry(id, updates, currentUser.email);
            success = res && res.success;
        } else {
            // Local fallback
            const idx = allInquiries.findIndex(i => String(i.id) === String(id));
            if (idx !== -1) {
                allInquiries[idx] = { ...allInquiries[idx], ...updates };
                localStorage.setItem('inquiries', JSON.stringify(allInquiries));
                success = true;
            }
        }

        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';

        if (success) {
            const idx = allInquiries.findIndex(i => String(i.id) === String(id));
            if (idx !== -1) {
                allInquiries[idx] = { ...allInquiries[idx], ...updates };
            }
            closeModifyModal();
            renderInquiries();
            showToast('✓ Inquiry details successfully updated');
        } else {
            alert('Failed to update inquiry. Please try again.');
        }
    };

    // 2. CANCEL MODAL
    window.openCancelModal = function (id) {
        const item = allInquiries.find(i => String(i.id) === String(id));
        if (!item) return;

        document.getElementById('cancelInquiryId').value = item.id;
        document.getElementById('cancelPropertyTitle').textContent = item.property_title || item.propertyTitle || 'Inquiry';
        cancelModal.classList.add('active');
    };

    window.closeCancelModal = function () {
        cancelModal.classList.remove('active');
    };

    window.handleConfirmCancel = async function () {
        const id = document.getElementById('cancelInquiryId').value;
        const confirmBtn = document.getElementById('confirmCancelBtn');

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Cancelling...';

        let success = false;
        if (typeof window.apiCancelMyInquiry === 'function') {
            const res = await window.apiCancelMyInquiry(id, currentUser.email);
            success = res && res.success;
        } else {
            const idx = allInquiries.findIndex(i => String(i.id) === String(id));
            if (idx !== -1) {
                allInquiries[idx].status = 'Cancelled';
                localStorage.setItem('inquiries', JSON.stringify(allInquiries));
                success = true;
            }
        }

        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Yes, Cancel Inquiry';

        if (success) {
            const idx = allInquiries.findIndex(i => String(i.id) === String(id));
            if (idx !== -1) {
                allInquiries[idx].status = 'Cancelled';
            }
            closeCancelModal();
            updateStats();
            renderInquiries();
            showToast('✓ Inquiry marked as Cancelled');
        } else {
            alert('Failed to cancel inquiry. Please try again.');
        }
    };

    // 3. DELETE MODAL
    window.openDeleteModal = function (id) {
        document.getElementById('deleteInquiryId').value = id;
        deleteModal.classList.add('active');
    };

    window.closeDeleteModal = function () {
        deleteModal.classList.remove('active');
    };

    window.handleConfirmDelete = async function () {
        const id = document.getElementById('deleteInquiryId').value;
        const confirmBtn = document.getElementById('confirmDeleteBtn');

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';

        let success = false;
        if (typeof window.apiDeleteMyInquiry === 'function') {
            const res = await window.apiDeleteMyInquiry(id, currentUser.email);
            success = res && res.success;
        } else {
            allInquiries = allInquiries.filter(i => String(i.id) !== String(id));
            localStorage.setItem('inquiries', JSON.stringify(allInquiries));
            success = true;
        }

        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Permanently Delete';

        if (success) {
            allInquiries = allInquiries.filter(i => String(i.id) !== String(id));
            closeDeleteModal();
            updateStats();
            renderInquiries();
            showToast('✓ Inquiry permanently removed');
        } else {
            alert('Failed to delete inquiry. Please try again.');
        }
    };

    // ==========================================
    // TOAST HELPER
    // ==========================================
    function showToast(message) {
        if (!toastNotice) return;
        toastMessage.textContent = message;
        toastNotice.classList.add('show');
        setTimeout(() => {
            toastNotice.classList.remove('show');
        }, 3200);
    }

    // ==========================================
    // FILTER & SEARCH LISTENERS
    // ==========================================
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter') || 'all';
            renderInquiries();
        });
    });

    if (searchInputEl) {
        searchInputEl.addEventListener('input', function (e) {
            searchQuery = e.target.value.trim();
            renderInquiries();
        });
    }

    // Close modals on overlay backdrop click
    [modifyModal, cancelModal, deleteModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Close modals on Escape key
    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            [modifyModal, cancelModal, deleteModal].forEach(modal => {
                if (modal && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                }
            });
        }
    });

    // ==========================================
    // FORMATTING HELPERS
    // ==========================================
    function getStatusClass(status) {
        const s = (status || '').toLowerCase().trim();
        if (s === 'scheduled') return 'status-scheduled';
        if (s === 'contacted') return 'status-contacted';
        if (s === 'cancelled') return 'status-cancelled';
        if (s === 'closed') return 'status-closed';
        return 'status-under-review';
    }

    function formatDate(raw) {
        if (!raw) return 'Recently';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return String(raw);
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return String(raw);
        }
    }

    function escHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHistoryPage);
    } else {
        initHistoryPage();
    }
})();
