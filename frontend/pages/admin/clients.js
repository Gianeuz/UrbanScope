// clients.js - Admin Client Inquiries Management
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth check
    const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token');
    const role = localStorage.getItem('user_role') || (localStorage.getItem('adminUser') ? 'admin' : '');
    if (!token && !localStorage.getItem('adminUser')) {
        window.location.href = '../auth/login.html';
        return;
    }

    // 2. Set Admin profile display
    try {
        const storedAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const adminNameDisplay = document.getElementById('adminNameDisplay');
        if (adminNameDisplay && storedAdmin.name) {
            adminNameDisplay.textContent = storedAdmin.name;
        }
    } catch (_) {}

    // 3. UI Toggles
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const profileBtn = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');

    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
    };
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if (backdrop) backdrop.addEventListener('click', toggleSidebar);

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }

    // Sign out handler
    document.querySelectorAll('.profile-signout, .logout-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('supabase_token');
            if (typeof apiSignOut === 'function') apiSignOut();
            window.location.href = '../auth/login.html?logout=1';
        });
    });

    // 4. State & Elements
    let inquiries = [];
    let propertiesMap = {};
    let activeFilter = 'All';
    let searchQuery = '';

    const tableBody = document.getElementById('clientsTableBody');
    const searchInput = document.getElementById('clientSearchInput');
    const statusTabs = document.getElementById('statusTabs');
    const statTotal = document.getElementById('statTotalInquiries');
    const statPending = document.getElementById('statPendingInquiries');
    const statApproved = document.getElementById('statApprovedInquiries');
    const statCompleted = document.getElementById('statCompletedInquiries');
    const notifCount = document.getElementById('topbarInquiryCount');

    // Parse URL parameter for status filter
    const urlParams = new URLSearchParams(window.location.search);
    const initialStatus = urlParams.get('status');
    if (initialStatus) {
        activeFilter = initialStatus;
        document.querySelectorAll('.status-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-status') === initialStatus) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Modal elements
    const modal = document.getElementById('inquiryModal');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.classList.remove('open'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    }

    // 5. Fetch Properties & Inquiries
    async function loadData() {
        try {
            // Load properties for title lookup
            const props = (typeof apiGetProperties === 'function') ? await apiGetProperties() : [];
            if (Array.isArray(props)) {
                props.forEach(p => {
                    propertiesMap[p.id] = p.title || p.property_name || `Property #${p.id}`;
                });
            }

            // Load inquiries
            let data = (typeof apiGetInquiries === 'function') ? await apiGetInquiries() : null;
            if (!data || !Array.isArray(data)) {
                data = JSON.parse(localStorage.getItem('inquiries') || '[]');
            }
            inquiries = data;

            updateKPIs();
            renderTable();
        } catch (err) {
            console.error('Error loading inquiries:', err);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e53e3e; padding: 30px;">Failed to load inquiries. Please check network connection.</td></tr>`;
        }
    }

    function updateKPIs() {
        const total = inquiries.length;
        const pending = inquiries.filter(i => {
            const s = (i.status || '').toLowerCase();
            return s === 'under review' || s === 'pending' || !s;
        }).length;
        const approved = inquiries.filter(i => (i.status || '').toLowerCase() === 'approved').length;
        const completed = inquiries.filter(i => (i.status || '').toLowerCase() === 'completed').length;

        if (statTotal) statTotal.textContent = total;
        if (statPending) statPending.textContent = pending;
        if (statApproved) statApproved.textContent = approved;
        if (statCompleted) statCompleted.textContent = completed;
        if (notifCount) notifCount.textContent = pending;
    }

    function getNormalizedStatus(status) {
        const s = (status || '').toLowerCase();
        if (s === 'approved') return 'Approved';
        if (s === 'completed') return 'Completed';
        return 'Under Review';
    }

    function getBadgeClass(normStatus) {
        if (normStatus === 'Approved') return 'approved';
        if (normStatus === 'Completed') return 'completed';
        return 'review';
    }

    function renderTable() {
        if (!tableBody) return;

        let filtered = inquiries.filter(inq => {
            const normStatus = getNormalizedStatus(inq.status);
            if (activeFilter !== 'All' && normStatus !== activeFilter) {
                return false;
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const name = (inq.client_name || inq.name || '').toLowerCase();
                const email = (inq.email || inq.client_email || '').toLowerCase();
                const phone = (inq.phone || inq.contact_number || '').toLowerCase();
                const prop = (inq.property_title || propertiesMap[inq.property_id] || '').toLowerCase();
                const msg = (inq.message || '').toLowerCase();
                return name.includes(q) || email.includes(q) || phone.includes(q) || prop.includes(q) || msg.includes(q);
            }
            return true;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 48px; color: var(--text-muted);">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; display: block; opacity: 0.5;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        No client inquiries found matching your criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(inq => {
            const id = inq.id;
            const name = inq.client_name || inq.name || 'Anonymous Client';
            const email = inq.email || inq.client_email || 'No email provided';
            const phone = inq.phone || inq.contact_number || 'N/A';
            const propTitle = inq.property_title || propertiesMap[inq.property_id] || (inq.property_id ? `Property #${inq.property_id}` : 'General Inquiry');
            const normStatus = getNormalizedStatus(inq.status);
            const badgeClass = getBadgeClass(normStatus);
            const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

            return `
                <tr data-id="${id}">
                    <td class="client-name-cell">
                        <strong>${escapeHtml(name)}</strong>
                        <small>${escapeHtml(email)}</small>
                    </td>
                    <td>
                        <span style="font-weight: 500; color: #334155;">${escapeHtml(phone)}</span>
                    </td>
                    <td>
                        <span style="font-weight: 600; color: var(--green);">${escapeHtml(propTitle)}</span>
                    </td>
                    <td>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">${dateStr}</span>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="status-badge ${badgeClass}" id="badge-${id}">${normStatus}</span>
                            <select class="status-select-inline" data-id="${id}" onchange="window.handleStatusChange(event, '${id}')">
                                <option value="Under Review" ${normStatus === 'Under Review' ? 'selected' : ''}>Under Review</option>
                                <option value="Approved" ${normStatus === 'Approved' ? 'selected' : ''}>Approved</option>
                                <option value="Completed" ${normStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                    </td>
                    <td style="text-align: right;">
                        <button class="action-btn view" onclick="window.viewInquiryDetails('${id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Status change handler
    window.handleStatusChange = async (event, inquiryId) => {
        const newStatus = event.target.value;
        const targetBadge = document.getElementById(`badge-${inquiryId}`);
        if (targetBadge) {
            targetBadge.textContent = newStatus;
            targetBadge.className = `status-badge ${getBadgeClass(newStatus)}`;
        }

        // Update local array
        const found = inquiries.find(i => String(i.id) === String(inquiryId));
        if (found) {
            found.status = newStatus;
        }
        updateKPIs();

        // Update DB
        try {
            if (typeof apiUpdateInquiryStatus === 'function') {
                await apiUpdateInquiryStatus(inquiryId, newStatus);
            }
        } catch (err) {
            console.error('Failed to update status in database:', err);
        }
    };

    // View inquiry details modal handler
    window.viewInquiryDetails = (inquiryId) => {
        const inq = inquiries.find(i => String(i.id) === String(inquiryId));
        if (!inq) return;

        const name = inq.client_name || inq.name || 'Anonymous Client';
        const email = inq.email || inq.client_email || 'N/A';
        const phone = inq.phone || inq.contact_number || 'N/A';
        const propTitle = inq.property_title || propertiesMap[inq.property_id] || (inq.property_id ? `Property #${inq.property_id}` : 'General Inquiry');
        const normStatus = getNormalizedStatus(inq.status);
        const schedule = inq.schedule_date || inq.preferred_date || 'No schedule requested';
        const message = inq.message || inq.notes || 'No message content provided.';
        const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleString() : 'N/A';

        modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="background: var(--light-green); padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: var(--dark-green); font-size: 1.1rem; display: block;">${escapeHtml(name)}</strong>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">Submitted on: ${dateStr}</span>
                    </div>
                    <span class="status-badge ${getBadgeClass(normStatus)}">${normStatus}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem;">
                    <div>
                        <strong style="display: block; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Email</strong>
                        <a href="mailto:${escapeHtml(email)}" style="color: var(--green); text-decoration: none; font-weight: 600;">${escapeHtml(email)}</a>
                    </div>
                    <div>
                        <strong style="display: block; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Phone Number</strong>
                        <a href="tel:${escapeHtml(phone)}" style="color: var(--green); text-decoration: none; font-weight: 600;">${escapeHtml(phone)}</a>
                    </div>
                    <div>
                        <strong style="display: block; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Property of Interest</strong>
                        <span style="font-weight: 600; color: #1e293b;">${escapeHtml(propTitle)}</span>
                    </div>
                    <div>
                        <strong style="display: block; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Preferred Tour Schedule</strong>
                        <span style="font-weight: 600; color: #1e293b;">${escapeHtml(schedule)}</span>
                    </div>
                </div>

                <div>
                    <strong style="display: block; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; margin-bottom: 6px;">Message / Client Notes</strong>
                    <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; font-size: 0.92rem; line-height: 1.6; color: #334155; white-space: pre-wrap;">${escapeHtml(message)}</div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; padding-top: 14px; border-top: 1px solid #edf2ee;">
                    <a href="mailto:${encodeURIComponent(email)}?subject=Re:%20Inquiry%20regarding%20${encodeURIComponent(propTitle)}" class="action-btn" style="background: var(--green); color: white; padding: 9px 18px; font-size: 0.9rem; text-decoration: none; border-radius: 8px;">
                        Reply via Email
                    </a>
                </div>
            </div>
        `;
        modal.classList.add('open');
    };

    // Filter tab listeners
    if (statusTabs) {
        statusTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.status-tab-btn');
            if (!btn) return;
            document.querySelectorAll('.status-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-status');
            renderTable();
        });
    }

    // Search input listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderTable();
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Initial load
    await loadData();
});
