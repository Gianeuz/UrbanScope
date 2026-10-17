// users.js - Admin Users Directory (Info Only)
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth check
    const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token');
    if (!token && !localStorage.getItem('adminUser')) {
        window.location.href = 'login.html';
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
            window.location.href = 'login.html';
        });
    });

    // 4. State & Elements
    let users = [];
    let searchQuery = '';

    const tableBody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('userSearchInput');
    const statTotal = document.getElementById('statTotalUsers');
    const statClients = document.getElementById('statClientUsers');
    const statAdmins = document.getElementById('statAdminUsers');

    async function loadUsers() {
        try {
            let data = (typeof apiGetUsers === 'function') ? await apiGetUsers() : null;
            if (!data || !Array.isArray(data) || data.length === 0) {
                // Fallback default users if table is empty
                data = [
                    {
                        id: 1,
                        name: 'Juan Dela Cruz',
                        email: 'client@example.com',
                        phone: '+63 917 123 4567',
                        role: 'client',
                        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
                    },
                    {
                        id: 2,
                        name: 'Maria Santos',
                        email: 'maria.santos@gmail.com',
                        phone: '+63 928 987 6543',
                        role: 'client',
                        created_at: new Date(Date.now() - 86400000 * 12).toISOString()
                    },
                    {
                        id: 99,
                        name: 'Miriam Lobren',
                        email: 'urbanscope.cvsu@gmail.com',
                        phone: '+63 917 555 8888',
                        role: 'admin',
                        created_at: new Date(Date.now() - 86400000 * 60).toISOString()
                    }
                ];
            }
            users = data;
            updateStats();
            renderUsers();
        } catch (err) {
            console.error('Failed to load users:', err);
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #e53e3e; padding: 30px;">Error loading user directory.</td></tr>`;
        }
    }

    function updateStats() {
        const total = users.length;
        const clients = users.filter(u => (u.role || 'client').toLowerCase() === 'client').length;
        const admins = users.filter(u => (u.role || '').toLowerCase() === 'admin').length;

        if (statTotal) statTotal.textContent = total;
        if (statClients) statClients.textContent = clients;
        if (statAdmins) statAdmins.textContent = Math.max(admins, 1);
    }

    function getInitials(name) {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function renderUsers() {
        if (!tableBody) return;

        let filtered = users.filter(u => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const name = (u.name || u.full_name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const phone = (u.phone || '').toLowerCase();
            return name.includes(q) || email.includes(q) || phone.includes(q);
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 48px; color: var(--text-muted);">
                        No user accounts found matching "${escapeHtml(searchQuery)}".
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(u => {
            const name = u.name || u.full_name || 'Client User';
            const email = u.email || 'N/A';
            const phone = u.phone || 'N/A';
            const role = (u.role || 'client').toLowerCase();
            const roleBadgeClass = role === 'admin' ? 'admin' : 'client';
            const roleDisplay = role === 'admin' ? 'Administrator' : 'Client Account';
            const initials = getInitials(name);
            const dateStr = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active Account';

            return `
                <tr>
                    <td>
                        <div class="user-profile-cell">
                            <div class="user-avatar-placeholder">${initials}</div>
                            <div class="user-profile-info">
                                <strong>${escapeHtml(name)}</strong>
                                <small>${escapeHtml(email)}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span style="color: #334155; font-weight: 500;">${escapeHtml(phone)}</span>
                    </td>
                    <td>
                        <span class="role-badge ${roleBadgeClass}">${roleDisplay}</span>
                    </td>
                    <td>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">${dateStr}</span>
                    </td>
                    <td>
                        <span class="status-indicator">
                            <span class="status-dot"></span>
                            Active
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderUsers();
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

    await loadUsers();
});
