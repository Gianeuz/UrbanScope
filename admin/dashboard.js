/**
 * UrbanScope - Admin Dashboard Controller
 * Powers the navigation sidebar, analytics metrics, and recent inquiries feed.
 */

const sidebar = document.getElementById('adminSidebar');
const backdrop = document.getElementById('sidebarBackdrop');
const toggleBtn = document.getElementById('sidebarToggle');
const closeBtn = document.getElementById('closeSidebarBtn');

function toggleSidebar(open) {
    if (!sidebar || !backdrop) return;
    if (open) {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    } else {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    }
}

if (toggleBtn) toggleBtn.addEventListener('click', () => toggleSidebar(true));
if (closeBtn) closeBtn.addEventListener('click', () => toggleSidebar(false));
if (backdrop) backdrop.addEventListener('click', () => toggleSidebar(false));

// Load live inquiries & properties from Supabase
async function loadDashboardData() {
    if (typeof apiGetInquiries === 'function') {
        const inquiries = await apiGetInquiries();
        if (inquiries && inquiries.length > 0) {
            const inqCountEl = document.getElementById('kpiTotalInquiries');
            const pendingEl = document.getElementById('kpiPendingInquiries');
            if (inqCountEl) inqCountEl.innerText = inquiries.length;
            
            const pendingCount = inquiries.filter(i => (i.status || '').toLowerCase().includes('review') || (i.status || '').toLowerCase().includes('pending')).length;
            if (pendingEl) pendingEl.innerText = pendingCount;

            const tbody = document.getElementById('recentInquiriesBody');
            if (tbody) {
                tbody.innerHTML = inquiries.slice(0, 5).map(inq => {
                    const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
                    const statusColor = (inq.status || '').toLowerCase().includes('approved') ? 'green' : 
                                       (inq.status || '').toLowerCase().includes('completed') ? 'dark-green' : 'orange';
                    return `
                        <tr>
                            <td class="id-col">INQ-#${inq.id}</td>
                            <td>${inq.client_name || 'Client'}</td>
                            <td>${inq.property_title || 'General Inquiry'}</td>
                            <td>${dateStr}</td>
                            <td><span class="status-pill ${statusColor}">${inq.status || 'Pending'}</span></td>
                            <td><button class="action-view-btn" onclick="alert('Inquiry Message:\\n\\n${(inq.message || '').replace(/'/g, "\\'")}\\n\\nPhone: ${inq.client_phone || 'N/A'}\\nEmail: ${inq.client_email || 'N/A'}')">View</button></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }

    if (typeof apiGetProperties === 'function') {
        const props = await apiGetProperties();
        if (props && props.length > 0) {
            const propCountEl = document.getElementById('kpiTotalProperties');
            if (propCountEl) propCountEl.innerText = props.length;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});
