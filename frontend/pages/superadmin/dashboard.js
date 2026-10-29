/**
 * UrbanScope - Superadmin Executive Console Controller
 * High-performance vanilla ES6 controller connecting to FastAPI & Supabase Client.
 */

(function () {
    'use strict';

    // State
    let currentSuperadmin = null;
    let allUsers = [];
    let allProperties = [];
    let allInquiries = [];
    let pendingRoleChange = null;

    // DOM Elements
    const elements = {
        sidebar: document.getElementById('saSidebar'),
        sidebarToggle: document.getElementById('saSidebarToggle'),
        closeSidebar: document.getElementById('saCloseSidebar'),
        backdrop: document.getElementById('saBackdrop'),
        profileBtn: document.getElementById('saProfileDropdownBtn'),
        profileMenu: document.getElementById('saDropdownMenu'),
        adminName: document.getElementById('saAdminName'),
        adminEmail: document.getElementById('saAdminEmail'),
        signOutBtn: document.getElementById('saSignOutBtn'),
        liveTime: document.getElementById('saLiveTime'),
        
        // Nav tabs
        navItems: document.querySelectorAll('.sa-nav-item'),
        tabPanes: document.querySelectorAll('.sa-tab-pane'),

        // Badges
        usersCountBadge: document.getElementById('saUsersCountBadge'),
        propsCountBadge: document.getElementById('saPropsCountBadge'),
        inqCountBadge: document.getElementById('saInqCountBadge'),

        // KPIs
        kpiTotalUsers: document.getElementById('kpiTotalUsers'),
        kpiUsersBreakdown: document.getElementById('kpiUsersBreakdown'),
        kpiTotalProperties: document.getElementById('kpiTotalProperties'),
        kpiPropertiesBreakdown: document.getElementById('kpiPropertiesBreakdown'),
        kpiTotalInquiries: document.getElementById('kpiTotalInquiries'),
        kpiInquiriesBreakdown: document.getElementById('kpiInquiriesBreakdown'),
        kpiDbSize: document.getElementById('kpiDbSize'),
        diagDbSize: document.getElementById('diagDbSize'),
        saDbFileStatus: document.getElementById('saDbFileStatus'),

        // Tables & Filters
        usersTableBody: document.getElementById('usersTableBody'),
        userFilterInput: document.getElementById('userFilterInput'),
        userRoleFilter: document.getElementById('userRoleFilter'),
        
        propertiesTableBody: document.getElementById('propertiesTableBody'),
        propFilterInput: document.getElementById('propFilterInput'),
        propStatusFilter: document.getElementById('propStatusFilter'),

        inquiriesTableBody: document.getElementById('inquiriesTableBody'),
        inqFilterInput: document.getElementById('inqFilterInput'),

        // Global search
        globalSearch: document.getElementById('saGlobalSearch'),

        // Modals & Forms
        createUserModal: document.getElementById('createUserModal'),
        createUserForm: document.getElementById('createUserForm'),
        btnOpenCreateUserModal: document.getElementById('btnOpenCreateUserModal'),
        btnCreateUserFromTable: document.getElementById('btnCreateUserFromTable'),
        btnQuickAddUser: document.getElementById('btnQuickAddUser'),
        btnCloseCreateUserModal: document.getElementById('btnCloseCreateUserModal'),
        btnCancelCreateUser: document.getElementById('btnCancelCreateUser'),

        roleChangeModal: document.getElementById('roleChangeModal'),
        roleChangeMessage: document.getElementById('roleChangeMessage'),
        btnCloseRoleModal: document.getElementById('btnCloseRoleModal'),
        btnCancelRoleChange: document.getElementById('btnCancelRoleChange'),
        btnConfirmRoleChange: document.getElementById('btnConfirmRoleChange'),

        // Actions
        btnRefreshStats: document.getElementById('btnRefreshStats'),
        btnQuickManageRoles: document.getElementById('btnQuickManageRoles'),
        btnQuickReviewInquiries: document.getElementById('btnQuickReviewInquiries'),
        btnQuickRunIntegrity: document.getElementById('btnQuickRunIntegrity'),
        btnRunIntegrity: document.getElementById('btnRunIntegrity'),

        // Diagnostics
        diagIntegrity: document.getElementById('diagIntegrity'),
        diagFkViolations: document.getElementById('diagFkViolations'),
        diagTriggerStatus: document.getElementById('diagTriggerStatus'),
        saTriggerOnlineBadge: document.getElementById('saTriggerOnlineBadge'),
        saTriggerStatusBadge: document.getElementById('saTriggerStatusBadge'),

        // Toast
        toastContainer: document.getElementById('saToastContainer')
    };

    // Helper: Base API URL
    function getApiBase() {
        return (window.location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
    }

    // Helper: Request headers with Bearer token
    function getAuthHeaders() {
        const token = localStorage.getItem('urbanscope_jwt_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    // Toast Notification
    function showToast(message, isError = false) {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        const iconSvg = isError
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        toast.innerHTML = iconSvg + ' ' + escapeHtml(message);
        elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3600);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatCurrency(amount) {
        return '₱' + Number(amount || 0).toLocaleString('en-PH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Clock
    function startClock() {
        function tick() {
            if (!elements.liveTime) return;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false }) + ' GMT+8';
            elements.liveTime.querySelector('.time-text').textContent = timeStr;
        }
        tick();
        setInterval(tick, 1000);
    }

    // ==============================================================
    // AUTH & ROLE VERIFICATION
    // ==============================================================
    async function verifySuperadminAccess() {
        try {
            // First check local session
            let user = null;
            if (typeof apiGetCurrentUser === 'function') {
                user = await apiGetCurrentUser();
            }

            if (!user) {
                const storedUser = localStorage.getItem('urbanscope_user');
                if (storedUser) {
                    user = JSON.parse(storedUser);
                }
            }

            // Verify with FastAPI backend /api/auth/me
            try {
                const res = await fetch(`${getApiBase()}/auth/me`, {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    user = await res.json();
                }
            } catch (e) {}

            if (!user) {
                window.location.href = '../auth/login.html?redirect=pages/superadmin/dashboard.html';
                return false;
            }

            const cleanEmail = (user.email || '').trim().toLowerCase();
            const role = (user.role || '').trim().toLowerCase();

            // Strict check: only urbanscope.cvsu@gmail.com with superadmin role
            if (cleanEmail !== 'urbanscope.cvsu@gmail.com' || role !== 'superadmin') {
                alert('Access Restricted: Exclusive Superadministrator access required.');
                window.location.href = '../admin/dashboard.html';
                return false;
            }

            currentSuperadmin = user;

            if (elements.adminName) elements.adminName.textContent = user.full_name || 'Superadmin CVSU';
            if (elements.adminEmail) elements.adminEmail.textContent = user.email;

            return true;
        } catch (err) {
            console.error('Superadmin verification error:', err);
            window.location.href = '../auth/login.html';
            return false;
        }
    }

    // ==============================================================
    // DATA LOADERS
    // ==============================================================

    // 1. Overview KPIs
    async function loadOverview() {
        try {
            const res = await fetch(`${getApiBase()}/superadmin/overview`, {
                headers: getAuthHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                const m = data.metrics || {};

                if (elements.kpiTotalUsers) elements.kpiTotalUsers.textContent = m.total_users ?? '--';
                if (elements.kpiUsersBreakdown) {
                    elements.kpiUsersBreakdown.textContent = `${m.superadmins || 1} Superadmin · ${m.admins || 1} Admin · ${m.regular_users || 0} Clients`;
                }

                if (elements.kpiTotalProperties) elements.kpiTotalProperties.textContent = m.total_properties ?? '--';
                if (elements.kpiPropertiesBreakdown) {
                    elements.kpiPropertiesBreakdown.textContent = `${m.available_properties || 0} Available · ${m.sold_properties || 0} Sold`;
                }

                if (elements.kpiTotalInquiries) elements.kpiTotalInquiries.textContent = m.total_inquiries ?? '--';
                if (elements.kpiInquiriesBreakdown) {
                    elements.kpiInquiriesBreakdown.textContent = `${m.pending_inquiries || 0} Pending · ${m.approved_inquiries || 0} Approved`;
                }

                if (elements.kpiDbSize) elements.kpiDbSize.textContent = `${m.db_size_kb || 0} KB`;
                if (elements.diagDbSize) elements.diagDbSize.textContent = `${m.db_size_kb || 0} KB`;
                if (elements.saDbFileStatus) {
                    elements.saDbFileStatus.textContent = `Database: urbanscope.db (${m.db_size_kb || 0} KB)`;
                }

                if (elements.usersCountBadge) elements.usersCountBadge.textContent = m.total_users ?? '--';
                if (elements.propsCountBadge) elements.propsCountBadge.textContent = m.total_properties ?? '--';
                if (elements.inqCountBadge) elements.inqCountBadge.textContent = m.total_inquiries ?? '--';

                if (elements.saTriggerOnlineBadge) {
                    elements.saTriggerOnlineBadge.textContent = m.trigger_active ? 'Trigger Online' : 'Trigger Inactive';
                    elements.saTriggerOnlineBadge.className = m.trigger_active ? 'sa-badge-green' : 'sa-badge-gray';
                }
                if (elements.saTriggerStatusBadge) {
                    elements.saTriggerStatusBadge.textContent = m.trigger_active ? 'Trigger: Active' : 'Trigger: Inactive';
                }
            }
        } catch (err) {
            console.warn('Overview fetch notice:', err);
        }
    }

    // 1b. Real Database Integrity Check
    async function executeIntegrityCheck(silent = false) {
        try {
            if (!silent) showToast('Running SQLite integrity checks...');
            const res = await fetch(`${getApiBase()}/superadmin/integrity`, {
                headers: getAuthHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                if (elements.diagIntegrity) {
                    if (data.success) {
                        elements.diagIntegrity.className = 'sa-badge-green';
                        elements.diagIntegrity.textContent = 'OK (0 Errors)';
                    } else {
                        elements.diagIntegrity.className = 'sa-badge-red';
                        elements.diagIntegrity.textContent = data.integrity || 'Issues Found';
                    }
                }
                if (elements.diagFkViolations) {
                    elements.diagFkViolations.textContent = `${data.foreign_key_violations || 0} Violations`;
                    elements.diagFkViolations.style.color = (data.foreign_key_violations === 0) ? '#15803d' : '#b91c1c';
                }
                if (elements.diagTriggerStatus) {
                    elements.diagTriggerStatus.textContent = data.trigger_active ? 'Active & Enforcing' : 'Inactive';
                    elements.diagTriggerStatus.className = data.trigger_active ? 'sa-badge-gold' : 'sa-badge-gray';
                }
                if (elements.saTriggerOnlineBadge) {
                    elements.saTriggerOnlineBadge.textContent = data.trigger_active ? 'Trigger Online' : 'Trigger Inactive';
                    elements.saTriggerOnlineBadge.className = data.trigger_active ? 'sa-badge-green' : 'sa-badge-gray';
                }
                if (elements.saTriggerStatusBadge) {
                    elements.saTriggerStatusBadge.textContent = data.trigger_active ? 'Trigger: Active' : 'Trigger: Inactive';
                }
                if (!silent) {
                    showToast(`SQLite integrity check: ${data.success ? 'PASSED (0 violations)' : 'Issues detected'}.`);
                }
            } else {
                if (!silent) showToast('Integrity check endpoint returned HTTP ' + res.status, true);
            }
        } catch (err) {
            console.error('Integrity check error:', err);
            if (!silent) showToast('Failed to run integrity check.', true);
        }
    }

    // 2. Users Table
    async function loadUsers() {
        try {
            const res = await fetch(`${getApiBase()}/superadmin/users`, {
                headers: getAuthHeaders()
            });

            if (res.ok) {
                allUsers = await res.json();
                renderUsersTable(allUsers);
            } else {
                elements.usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:var(--sa-danger)">Failed to load users (HTTP ${res.status}).</td></tr>`;
            }
        } catch (err) {
            elements.usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:var(--sa-danger)">Error loading users: ${escapeHtml(err.message)}</td></tr>`;
        }
    }

    function renderUsersTable(users) {
        if (!elements.usersTableBody) return;

        if (users.length === 0) {
            elements.usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No accounts match the current filter.</td></tr>`;
            return;
        }

        elements.usersTableBody.innerHTML = users.map(u => {
            const cleanEmail = (u.email || '').toLowerCase().trim();
            const role = (u.role || 'user').toLowerCase().trim();
            const isRootSuperadmin = cleanEmail === 'urbanscope.cvsu@gmail.com';
            const isPrimaryAdmin = cleanEmail === 'admin.realestate@gmail.com';

            let roleBadge = '';
            if (role === 'superadmin') {
                roleBadge = `<span class="sa-badge-gold">SUPERADMIN</span>`;
            } else if (role === 'admin') {
                roleBadge = `<span class="sa-badge-emerald">ADMIN</span>`;
            } else {
                roleBadge = `<span class="sa-badge-gray">CLIENT USER</span>`;
            }

            const initials = (u.full_name || u.email || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            // Action buttons
            let actionsHtml = '';
            if (isRootSuperadmin) {
                actionsHtml = `
                    <div class="action-btns-group">
                        <button type="button" class="btn-table-action" onclick="window.saEditUserPrompt(${u.id})">Edit</button>
                        <span class="sa-badge-gold" title="Root account cannot be demoted">Root</span>
                    </div>`;
            } else if (isPrimaryAdmin) {
                actionsHtml = `
                    <div class="action-btns-group">
                        <button type="button" class="btn-table-action" onclick="window.saEditUserPrompt(${u.id})">Edit</button>
                        <span class="sa-badge-emerald" title="Primary Agent Admin">Realty Admin</span>
                    </div>`;
            } else {
                // Can edit, toggle between user and admin, or delete
                const nextRole = (role === 'admin') ? 'user' : 'admin';
                const nextRoleLabel = (role === 'admin') ? 'Demote' : 'Promote';

                actionsHtml = `
                    <div class="action-btns-group">
                        <button type="button" class="btn-table-action" onclick="window.saEditUserPrompt(${u.id})">
                            Edit
                        </button>
                        <button type="button" class="btn-table-action" onclick="window.saRoleChangePrompt(${u.id}, '${escapeHtml(u.email)}', '${nextRole}')">
                            ${nextRoleLabel}
                        </button>
                        <button type="button" class="btn-table-action danger" onclick="window.saDeleteUserPrompt(${u.id}, '${escapeHtml(u.email)}')">
                            Delete
                        </button>
                    </div>
                `;
            }

            return `
                <tr id="user-row-${u.id}">
                    <td><strong>#${u.id}</strong></td>
                    <td>
                        <div class="user-cell">
                            <div class="table-avatar">${initials}</div>
                            <div>
                                <strong>${escapeHtml(u.full_name || 'No Name Provided')}</strong>
                                <small>${escapeHtml(u.email)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHtml(u.phone || '—')}</td>
                    <td>${roleBadge}</td>
                    <td>${formatDate(u.created_at)}</td>
                    <td style="text-align: right;">${actionsHtml}</td>
                </tr>
            `;
        }).join('');
    }

    // 3. Properties Table
    async function loadProperties() {
        try {
            let props = [];
            if (typeof apiGetProperties === 'function') {
                props = await apiGetProperties({ type: 'all' }) || [];
            } else {
                const res = await fetch(`${getApiBase()}/properties`);
                if (res.ok) props = await res.json();
            }

            allProperties = props;
            renderPropertiesTable(props);
        } catch (err) {
            elements.propertiesTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4" style="color:var(--sa-danger)">Error loading properties.</td></tr>`;
        }
    }

    function renderPropertiesTable(props) {
        if (!elements.propertiesTableBody) return;

        if (props.length === 0) {
            elements.propertiesTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No properties in catalog.</td></tr>`;
            return;
        }

        elements.propertiesTableBody.innerHTML = props.map(p => {
            const statusBadge = (p.status || '').toLowerCase() === 'sold'
                ? `<span class="sa-badge-gray">Sold</span>`
                : `<span class="sa-badge-green">Available</span>`;

            return `
                <tr>
                    <td><strong>#${p.id}</strong></td>
                    <td>
                        <strong>${escapeHtml(p.title || p.propertyName || 'Property Listing')}</strong><br>
                        <small class="text-muted">${escapeHtml(p.location || 'Cavite / Las Piñas')}</small>
                    </td>
                    <td><span class="sa-badge-gray">${escapeHtml(p.property_type || p.type || 'Townhouse')}</span></td>
                    <td><strong class="text-gold">${formatCurrency(p.price)}</strong></td>
                    <td>
                        <small>${p.bedrooms || 3} Beds · ${p.bathrooms || 2} Baths · ${p.lot_area || 100} sqm</small>
                    </td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">
                        <a href="../properties/property-detail.html?id=${p.id}" class="btn-table-action" target="_blank">
                            View Listing
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 4. Inquiries Table
    async function loadInquiries() {
        try {
            const res = await fetch(`${getApiBase()}/inquiries`, {
                headers: getAuthHeaders()
            });

            if (res.ok) {
                allInquiries = await res.json();
                renderInquiriesTable(allInquiries);
            } else {
                elements.inquiriesTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No inquiries available.</td></tr>`;
            }
        } catch (err) {
            elements.inquiriesTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Inquiries feed not initialized.</td></tr>`;
        }
    }

    function renderInquiriesTable(inquiries) {
        if (!elements.inquiriesTableBody) return;

        if (inquiries.length === 0) {
            elements.inquiriesTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No client inquiries found.</td></tr>`;
            return;
        }

        elements.inquiriesTableBody.innerHTML = inquiries.map(inq => {
            const status = inq.status || 'Under Review';
            let statusBadge = `<span class="sa-badge-gold">${escapeHtml(status)}</span>`;
            if (status.toLowerCase().includes('approved') || status.toLowerCase().includes('completed')) {
                statusBadge = `<span class="sa-badge-green">${escapeHtml(status)}</span>`;
            }

            return `
                <tr>
                    <td><strong>#${inq.id}</strong></td>
                    <td>
                        <strong>${escapeHtml(inq.client_name)}</strong><br>
                        <small class="text-muted">${escapeHtml(inq.client_email)} · ${escapeHtml(inq.client_phone || '')}</small>
                    </td>
                    <td><strong>${escapeHtml(inq.property_title || 'General Consultation')}</strong></td>
                    <td><span style="font-size:0.82rem;color:var(--sa-text-muted)" title="${escapeHtml(inq.message || '')}">${escapeHtml((inq.message || '').substring(0, 70))}${(inq.message || '').length > 70 ? '...' : ''}</span></td>
                    <td>${statusBadge}</td>
                    <td>${formatDate(inq.created_at)}</td>
                </tr>
            `;
        }).join('');
    }

    // ==============================================================
    // ACTIONS & MODALS
    // ==============================================================

    // Prompts
    window.saRoleChangePrompt = function (userId, email, newRole) {
        pendingRoleChange = { userId, email, newRole };
        if (elements.roleChangeMessage) {
            elements.roleChangeMessage.innerHTML = `Are you sure you want to change the role of <strong>${escapeHtml(email)}</strong> to <strong>${newRole.toUpperCase()}</strong>?`;
        }
        if (elements.roleChangeModal) {
            elements.roleChangeModal.hidden = false;
        }
    };

    window.saDeleteUserPrompt = async function (userId, email) {
        if (!confirm(`Are you sure you want to permanently delete the account for ${email}? This action cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`${getApiBase()}/superadmin/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Account ${email} deleted successfully.`);
                await loadUsers();
                await loadOverview();
            } else {
                showToast(data.detail || 'Failed to delete account.', true);
            }
        } catch (err) {
            showToast('Delete error: ' + err.message, true);
        }
    };

    // Role change execution
    if (elements.btnConfirmRoleChange) {
        elements.btnConfirmRoleChange.addEventListener('click', async () => {
            if (!pendingRoleChange) return;
            const { userId, email, newRole } = pendingRoleChange;

            try {
                const res = await fetch(`${getApiBase()}/superadmin/users/${userId}/role`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ role: newRole })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(`Role for ${email} updated to ${newRole.toUpperCase()}.`);
                    elements.roleChangeModal.hidden = true;
                    pendingRoleChange = null;
                    await loadUsers();
                    await loadOverview();
                } else {
                    showToast(data.detail || 'Failed to update role.', true);
                }
            } catch (err) {
                showToast('Role update error: ' + err.message, true);
            }
        });
    }

    // Create user submission
    if (elements.createUserForm) {
        elements.createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitCreateUser');
            btn.disabled = true;
            btn.textContent = 'Creating...';

            const payload = {
                full_name: document.getElementById('newFullName').value.trim(),
                email: document.getElementById('newEmail').value.trim(),
                phone: document.getElementById('newPhone').value.trim(),
                password: document.getElementById('newPassword').value,
                role: document.getElementById('newRole').value
            };

            try {
                const res = await fetch(`${getApiBase()}/superadmin/users`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(`Account for ${payload.email} created as ${payload.role.toUpperCase()}!`);
                    elements.createUserModal.hidden = true;
                    elements.createUserForm.reset();
                    await loadUsers();
                    await loadOverview();
                } else {
                    showToast(data.detail || 'Failed to create account.', true);
                }
            } catch (err) {
                showToast('Create user error: ' + err.message, true);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Account';
            }
        });
    }

    // Modal open / close handlers
    function openCreateUserModal() {
        if (elements.createUserModal) elements.createUserModal.hidden = false;
    }

    function closeCreateUserModal() {
        if (elements.createUserModal) elements.createUserModal.hidden = true;
    }

    if (elements.btnOpenCreateUserModal) elements.btnOpenCreateUserModal.addEventListener('click', openCreateUserModal);
    if (elements.btnCreateUserFromTable) elements.btnCreateUserFromTable.addEventListener('click', openCreateUserModal);
    if (elements.btnQuickAddUser) elements.btnQuickAddUser.addEventListener('click', openCreateUserModal);
    if (elements.btnCloseCreateUserModal) elements.btnCloseCreateUserModal.addEventListener('click', closeCreateUserModal);
    if (elements.btnCancelCreateUser) elements.btnCancelCreateUser.addEventListener('click', closeCreateUserModal);

    if (elements.btnCloseRoleModal) elements.btnCloseRoleModal.addEventListener('click', () => elements.roleChangeModal.hidden = true);
    if (elements.btnCancelRoleChange) elements.btnCancelRoleChange.addEventListener('click', () => elements.roleChangeModal.hidden = true);

    // Edit User modal logic
    window.saEditUserPrompt = function (userId) {
        const u = allUsers.find(user => user.id === Number(userId));
        if (!u) return;

        const isRoot = (u.email || '').toLowerCase().trim() === 'urbanscope.cvsu@gmail.com';

        document.getElementById('editUserId').value = u.id;
        document.getElementById('editFullName').value = u.full_name || '';
        document.getElementById('editEmail').value = u.email || '';
        document.getElementById('editPhone').value = u.phone || '';
        document.getElementById('editRole').value = (u.role || 'user').toLowerCase().trim();
        document.getElementById('editPassword').value = '';

        const emailInput = document.getElementById('editEmail');
        const roleSelect = document.getElementById('editRole');
        if (emailInput) emailInput.disabled = isRoot;
        if (roleSelect) roleSelect.disabled = isRoot;

        const editModal = document.getElementById('editUserModal');
        if (editModal) editModal.hidden = false;
    };

    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitEditUser');
            btn.disabled = true;
            btn.textContent = 'Saving...';

            const userId = document.getElementById('editUserId').value;
            const payload = {
                full_name: document.getElementById('editFullName').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                phone: document.getElementById('editPhone').value.trim(),
                role: document.getElementById('editRole').value
            };

            const newPass = document.getElementById('editPassword').value;
            if (newPass && newPass.trim().length >= 6) {
                payload.password = newPass.trim();
            }

            try {
                const res = await fetch(`${getApiBase()}/superadmin/users/${userId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(`User ${payload.email} updated successfully!`);
                    const modal = document.getElementById('editUserModal');
                    if (modal) modal.hidden = true;
                    await loadUsers();
                    await loadOverview();
                } else {
                    showToast(data.detail || 'Failed to update user account.', true);
                }
            } catch (err) {
                showToast('Update user error: ' + err.message, true);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Changes';
            }
        });
    }

    const btnCloseEditUser = document.getElementById('btnCloseEditUserModal');
    const btnCancelEditUser = document.getElementById('btnCancelEditUser');
    if (btnCloseEditUser) btnCloseEditUser.addEventListener('click', () => {
        const modal = document.getElementById('editUserModal');
        if (modal) modal.hidden = true;
    });
    if (btnCancelEditUser) btnCancelEditUser.addEventListener('click', () => {
        const modal = document.getElementById('editUserModal');
        if (modal) modal.hidden = true;
    });

    // Filter Listeners
    function applyUserFilters() {
        const query = (elements.userFilterInput ? elements.userFilterInput.value : '').toLowerCase().trim();
        const role = (elements.userRoleFilter ? elements.userRoleFilter.value : 'all').toLowerCase();

        const filtered = allUsers.filter(u => {
            const matchesQuery = !query ||
                (u.email && u.email.toLowerCase().includes(query)) ||
                (u.full_name && u.full_name.toLowerCase().includes(query)) ||
                (u.phone && u.phone.includes(query));

            const matchesRole = (role === 'all') || (u.role && u.role.toLowerCase() === role);

            return matchesQuery && matchesRole;
        });

        renderUsersTable(filtered);
    }

    if (elements.userFilterInput) elements.userFilterInput.addEventListener('input', applyUserFilters);
    if (elements.userRoleFilter) elements.userRoleFilter.addEventListener('change', applyUserFilters);

    function applyPropFilters() {
        const query = (elements.propFilterInput ? elements.propFilterInput.value : '').toLowerCase().trim();
        const status = (elements.propStatusFilter ? elements.propStatusFilter.value : 'all').toLowerCase();

        const filtered = allProperties.filter(p => {
            const title = (p.title || p.propertyName || '').toLowerCase();
            const location = (p.location || '').toLowerCase();
            const pStatus = (p.status || 'available').toLowerCase();

            const matchesQuery = !query || title.includes(query) || location.includes(query);
            const matchesStatus = (status === 'all') || (pStatus === status);

            return matchesQuery && matchesStatus;
        });

        renderPropertiesTable(filtered);
    }

    if (elements.propFilterInput) elements.propFilterInput.addEventListener('input', applyPropFilters);
    if (elements.propStatusFilter) elements.propStatusFilter.addEventListener('change', applyPropFilters);

    if (elements.inqFilterInput) {
        elements.inqFilterInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = allInquiries.filter(i => {
                return !q ||
                    (i.client_name && i.client_name.toLowerCase().includes(q)) ||
                    (i.client_email && i.client_email.toLowerCase().includes(q)) ||
                    (i.property_title && i.property_title.toLowerCase().includes(q));
            });
            renderInquiriesTable(filtered);
        });
    }

    // Global Search: searches active tab or intelligently routes to users/properties/inquiries
    if (elements.globalSearch) {
        elements.globalSearch.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const activePane = document.querySelector('.sa-tab-pane.active');
            const activeTabId = activePane ? activePane.id.replace('pane-', '') : 'overview';

            if (activeTabId === 'users' && elements.userFilterInput) {
                elements.userFilterInput.value = q;
                applyUserFilters();
            } else if (activeTabId === 'properties' && elements.propFilterInput) {
                elements.propFilterInput.value = q;
                applyPropFilters();
            } else if (activeTabId === 'inquiries' && elements.inqFilterInput) {
                elements.inqFilterInput.value = q;
                elements.inqFilterInput.dispatchEvent(new Event('input'));
            } else if (q) {
                if (q.includes('@')) {
                    switchTab('users');
                    if (elements.userFilterInput) {
                        elements.userFilterInput.value = q;
                        applyUserFilters();
                    }
                } else if (/villa|townhouse|condo|house|cavite|piñas|lot/i.test(q)) {
                    switchTab('properties');
                    if (elements.propFilterInput) {
                        elements.propFilterInput.value = q;
                        applyPropFilters();
                    }
                }
            }
        });
    }

    // Tab Switching
    function switchTab(tabId) {
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
        });

        elements.tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `pane-${tabId}`);
        });

        // Close sidebar on mobile after navigating
        closeMobileSidebar();
    }

    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        });
    });

    // Dropdown items that navigate to specific tabs (e.g. Properties Catalog)
    document.querySelectorAll('[data-goto-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-goto-tab');
            if (tabId) {
                switchTab(tabId);
                if (elements.profileBtn && elements.profileMenu) {
                    elements.profileBtn.setAttribute('aria-expanded', 'false');
                    elements.profileMenu.hidden = true;
                }
            }
        });
    });

    if (elements.btnQuickManageRoles) {
        elements.btnQuickManageRoles.addEventListener('click', () => switchTab('users'));
    }

    if (elements.btnQuickReviewInquiries) {
        elements.btnQuickReviewInquiries.addEventListener('click', () => switchTab('inquiries'));
    }

    if (elements.btnQuickRunIntegrity) {
        elements.btnQuickRunIntegrity.addEventListener('click', () => {
            switchTab('system');
            executeIntegrityCheck(false);
        });
    }

    if (elements.btnRunIntegrity) {
        elements.btnRunIntegrity.addEventListener('click', () => {
            executeIntegrityCheck(false);
        });
    }

    if (elements.btnRefreshStats) {
        elements.btnRefreshStats.addEventListener('click', async () => {
            showToast('Refreshing live statistics from database...');
            await loadOverview();
            await loadUsers();
            await loadProperties();
            await loadInquiries();
            await executeIntegrityCheck(true);
            showToast('Live metrics refreshed.');
        });
    }

    // Profile Dropdown
    if (elements.profileBtn && elements.profileMenu) {
        elements.profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = elements.profileBtn.getAttribute('aria-expanded') === 'true';
            elements.profileBtn.setAttribute('aria-expanded', !isExpanded);
            elements.profileMenu.hidden = isExpanded;
        });

        document.addEventListener('click', (e) => {
            if (!elements.profileBtn.contains(e.target) && !elements.profileMenu.contains(e.target)) {
                elements.profileBtn.setAttribute('aria-expanded', 'false');
                elements.profileMenu.hidden = true;
            }
        });
    }

    // Sign Out -> Proceed to shared login page with ?logout=1
    if (elements.signOutBtn) {
        elements.signOutBtn.addEventListener('click', async () => {
            if (typeof apiSignOut === 'function') {
                await apiSignOut();
            } else {
                localStorage.removeItem('urbanscope_jwt_token');
                localStorage.removeItem('urbanscope_user');
                localStorage.removeItem('adminUser');
            }
            window.location.href = '../auth/login.html?logout=1';
        });
    }

    // Responsive Mobile Drawer
    function openMobileSidebar() {
        if (elements.sidebar) elements.sidebar.classList.add('open');
        if (elements.backdrop) elements.backdrop.classList.add('active');
    }

    function closeMobileSidebar() {
        if (elements.sidebar) elements.sidebar.classList.remove('open');
        if (elements.backdrop) elements.backdrop.classList.remove('active');
    }

    if (elements.sidebarToggle) elements.sidebarToggle.addEventListener('click', openMobileSidebar);
    if (elements.closeSidebar) elements.closeSidebar.addEventListener('click', closeMobileSidebar);
    if (elements.backdrop) elements.backdrop.addEventListener('click', closeMobileSidebar);

    // ==============================================================
    // INITIALIZATION
    // ==============================================================
    async function init() {
        startClock();

        const isAuthorized = await verifySuperadminAccess();
        if (!isAuthorized) return;

        // Load all data parallelly
        await Promise.all([
            loadOverview(),
            loadUsers(),
            loadProperties(),
            loadInquiries(),
            executeIntegrityCheck(true)
        ]);

        // Deep linking / direct tab support via ?tab=... or #...
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const initialTab = urlParams.get('tab') || window.location.hash.replace('#', '');
            if (initialTab && ['overview', 'users', 'properties', 'inquiries', 'system'].includes(initialTab)) {
                switchTab(initialTab);
            }
            if (urlParams.get('modal') === 'create') {
                openCreateUserModal();
            }
        } catch (e) {
            console.warn('Tab deep-link parse note:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
