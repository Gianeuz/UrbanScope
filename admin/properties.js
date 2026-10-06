/**
 * UrbanScope - Admin Property Management Controller
 * Handles live listings rendering, Add Property modal, database updates, and table filtering.
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

// Modal
const addModal = document.getElementById('addModalBackdrop');
const openModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeAddModalBtn');

function toggleAddModal(show) {
    if (!addModal) return;
    if (show) addModal.classList.add('active');
    else addModal.classList.remove('active');
}

if (openModalBtn) openModalBtn.addEventListener('click', () => toggleAddModal(true));
if (closeModalBtn) closeModalBtn.addEventListener('click', () => toggleAddModal(false));

async function loadAdminProperties() {
    if (typeof apiGetProperties === 'function') {
        const data = await apiGetProperties();
        if (data && data.length > 0) {
            const tbody = document.getElementById('propTableBody');
            if (!tbody) return;
            tbody.innerHTML = data.map(item => `
                <tr data-id="${item.id}">
                    <td>
                        <div class="prop-cell">
                            <img src="${item.image_url || '../assets/images/property1.jpg'}" alt="${item.title}" class="table-prop-thumb" onerror="this.src='../assets/images/property1.jpg'">
                            <strong>${item.title}</strong>
                        </div>
                    </td>
                    <td>${item.location}</td>
                    <td>${item.property_type || 'Residential'}</td>
                    <td>₱${Number(item.price || 0).toLocaleString()}</td>
                    <td><span class="status-badge-table ${item.status === 'Available' ? 'available' : 'muted'}">${item.status || 'Available'}</span></td>
                    <td>
                        <div class="action-links">
                            <button class="act-link view" onclick="alert('Viewing ${item.title}')">View</button>
                            <button class="act-link edit" onclick="alert('Editing ${item.title}')">Edit</button>
                            <button class="act-link delete" onclick="deleteRow(this, ${item.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }
}

async function deleteRow(btn, id) {
    if (confirm('Are you sure you want to delete this property?')) {
        if (id && typeof apiDeleteProperty === 'function' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            const success = await apiDeleteProperty(id);
            if (!success) {
                alert('Failed to delete property from database.');
                return;
            }
        }
        const tr = btn.closest('tr');
        if (tr) tr.remove();
    }
}

async function addNewProperty() {
    const name = document.getElementById('newPropName').value.trim();
    const loc = document.getElementById('newPropLoc').value.trim();
    const type = document.getElementById('newPropType').value;
    const priceInput = document.getElementById('newPropPrice').value.trim();
    const status = document.getElementById('newPropStatus').value;
    const numPrice = parseFloat(priceInput.replace(/[^0-9.]/g, '')) || 0;

    let insertedId = null;

    if (typeof apiAddProperty === 'function' && typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
        const saveBtn = document.querySelector('.submit-modal-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerText = 'Saving...';
        }

        const newProp = await apiAddProperty({
            title: name,
            location: loc,
            property_type: type,
            price: numPrice,
            status: status,
            image_url: '../assets/images/property1.jpg'
        });

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Save Property';
        }

        if (newProp) {
            insertedId = newProp.id;
            alert('✓ Property successfully saved to Supabase!');
        }
    }

    const tbody = document.getElementById('propTableBody');
    if (tbody) {
        const tr = document.createElement('tr');
        if (insertedId) tr.setAttribute('data-id', insertedId);

        tr.innerHTML = `
            <td>
                <div class="prop-cell">
                    <img src="../assets/images/property1.jpg" alt="${name}" class="table-prop-thumb">
                    <strong>${name}</strong>
                </div>
            </td>
            <td>${loc}</td>
            <td>${type}</td>
            <td>₱${numPrice ? numPrice.toLocaleString() : priceInput}</td>
            <td><span class="status-badge-table ${status === 'Available' ? 'available' : 'muted'}">${status}</span></td>
            <td>
                <div class="action-links">
                    <button class="act-link view" onclick="alert('Viewing ${name}')">View</button>
                    <button class="act-link edit" onclick="alert('Editing ${name}')">Edit</button>
                    <button class="act-link delete" onclick="deleteRow(this, ${insertedId || ''})">Delete</button>
                </div>
            </td>
        `;
        tbody.prepend(tr);
    }
    toggleAddModal(false);
    const form = document.getElementById('addPropertyForm');
    if (form) form.reset();
}

function filterTable() {
    const search = document.getElementById('propSearch').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#propTableBody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const rowStatus = row.children[4].innerText.trim();
        const matchesSearch = text.includes(search);
        const matchesStatus = !status || rowStatus === status;

        if (matchesSearch && matchesStatus) row.style.display = '';
        else row.style.display = 'none';
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadAdminProperties();
});
