/**
 * UrbanScope - Admin Property Management Controller
 * ==========================================================
 * Enables administrators to manually input and manage comprehensive
 * house and lot details, architectural specifications, images,
 * and pricing with live SQLite database persistence.
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

// Cached properties for table and editing
let adminPropertiesList = [];

// Modal references
const addModal = document.getElementById('addModalBackdrop');
const openModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeAddModalBtn');

function toggleAddModal(show) {
    if (!addModal) return;
    if (show) addModal.classList.add('active');
    else addModal.classList.remove('active');
}

if (openModalBtn) openModalBtn.addEventListener('click', () => openAddModal());
if (closeModalBtn) closeModalBtn.addEventListener('click', () => toggleAddModal(false));
if (backdrop) backdrop.addEventListener('click', () => toggleAddModal(false));

function selectImagePreset(url) {
    const input = document.getElementById('newPropImage');
    if (input) input.value = url;
}

/**
 * Open Modal to Add a New Property with empty fields
 */
function openAddModal() {
    document.getElementById('editingPropId').value = '';
    document.getElementById('modalTitle').innerText = 'Add New Property';
    document.getElementById('modalSubmitBtn').innerText = 'Save Property';

    const form = document.getElementById('addPropertyForm');
    if (form) form.reset();

    // Default sensible values
    document.getElementById('newPropBeds').value = 3;
    document.getElementById('newPropBaths').value = 2;
    document.getElementById('newPropCarports').value = 1;
    document.getElementById('newPropStoreys').value = 2;
    document.getElementById('newPropLotArea').value = 120;
    document.getElementById('newPropFloorArea').value = 85;
    document.getElementById('newPropImage').value = 'assets/images/property1.jpg';

    toggleAddModal(true);
}

/**
 * Open Modal to Edit an Existing Property
 */
async function openEditModal(id) {
    let prop = adminPropertiesList.find(p => String(p.id) === String(id));
    if (!prop && typeof apiGetPropertyById === 'function') {
        prop = await apiGetPropertyById(id);
    }
    if (!prop) {
        alert('Could not find property details for editing.');
        return;
    }

    document.getElementById('editingPropId').value = prop.id;
    document.getElementById('modalTitle').innerText = `Edit Property: ${prop.title}`;
    document.getElementById('modalSubmitBtn').innerText = 'Update Property';

    // Populate all fields
    document.getElementById('newPropName').value = prop.title || '';
    document.getElementById('newPropLoc').value = prop.location || '';
    document.getElementById('newPropType').value = prop.property_type || 'Subdivision';
    document.getElementById('newPropPrice').value = prop.price ? `₱${Number(prop.price).toLocaleString()}` : '';
    document.getElementById('newPropStatus').value = prop.status || 'Available';

    // House and lot specs
    document.getElementById('newPropLotArea').value = prop.lot_area != null ? prop.lot_area : '';
    document.getElementById('newPropFloorArea').value = prop.floor_area != null ? prop.floor_area : '';
    document.getElementById('newPropBeds').value = prop.bedrooms != null ? prop.bedrooms : '';
    document.getElementById('newPropBaths').value = prop.bathrooms != null ? prop.bathrooms : '';
    document.getElementById('newPropCarports').value = prop.carports != null ? prop.carports : 1;
    document.getElementById('newPropStoreys').value = prop.storeys != null ? prop.storeys : 2;

    // Media & description
    document.getElementById('newPropImage').value = prop.image_url || 'assets/images/property1.jpg';
    document.getElementById('newPropDesc').value = prop.description || '';
    document.getElementById('newPropAmenities').value = prop.amenities || '';

    toggleAddModal(true);
}

/**
 * View Property in Detail
 */
function viewProperty(id) {
    window.open(`../properties/property-detail.html?id=${id}`, '_blank');
}

/**
 * Fetch and Render Properties in the Admin Table
 */
async function loadAdminProperties() {
    if (typeof apiGetProperties !== 'function') return;

    const data = await apiGetProperties();
    if (!data) return;

    adminPropertiesList = data;
    const tbody = document.getElementById('propTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: #888;">No property listings found. Click "+ Add Property" to create one.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr data-id="${item.id}">
            <td>
                <div class="prop-cell">
                    <img src="${item.image_url ? (item.image_url.startsWith('http') ? item.image_url : '../' + item.image_url) : '../assets/images/property1.jpg'}" 
                         alt="${item.title}" class="table-prop-thumb" 
                         onerror="this.src='../assets/images/property1.jpg'">
                    <strong>${item.title}</strong>
                </div>
            </td>
            <td>${item.location}</td>
            <td>${item.property_type || 'Residential'}</td>
            <td>
                <div class="specs-cell">
                    <strong>${item.lot_area || 0} sqm</strong> lot (${item.floor_area || 0} sqm flr)<br>
                    ${item.bedrooms || 0} Beds &bull; ${item.bathrooms || 0} Baths
                </div>
            </td>
            <td>₱${Number(item.price || 0).toLocaleString()}</td>
            <td>
                <span class="status-badge-table ${item.status === 'Available' ? 'available' : 'muted'}">
                    ${item.status || 'Available'}
                </span>
            </td>
            <td>
                <div class="action-links">
                    <button type="button" class="act-link view" onclick="viewProperty(${item.id})">View</button>
                    <button type="button" class="act-link edit" onclick="openEditModal(${item.id})">Edit</button>
                    <button type="button" class="act-link delete" onclick="deleteRow(this, ${item.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Delete Property Record
 */
async function deleteRow(btn, id) {
    if (!confirm('Are you sure you want to permanently delete this property listing?')) {
        return;
    }

    if (id && typeof apiDeleteProperty === 'function') {
        const success = await apiDeleteProperty(id);
        if (!success) {
            alert('Failed to delete property from database.');
            return;
        }
    }

    const tr = btn.closest('tr');
    if (tr) tr.remove();
    adminPropertiesList = adminPropertiesList.filter(p => p.id !== id);
}

/**
 * Save / Update Property with full House & Lot details
 */
async function saveProperty() {
    const editingId = document.getElementById('editingPropId').value;
    const name = document.getElementById('newPropName').value.trim();
    const loc = document.getElementById('newPropLoc').value.trim();
    const type = document.getElementById('newPropType').value;
    const priceInput = document.getElementById('newPropPrice').value.trim();
    const status = document.getElementById('newPropStatus').value;
    const numPrice = parseFloat(priceInput.replace(/[^0-9.]/g, '')) || 0;

    // House & Lot Specs
    const lotArea = parseFloat(document.getElementById('newPropLotArea').value) || 0;
    const floorArea = parseFloat(document.getElementById('newPropFloorArea').value) || 0;
    const beds = parseInt(document.getElementById('newPropBeds').value) || 0;
    const baths = parseInt(document.getElementById('newPropBaths').value) || 0;
    const carports = parseInt(document.getElementById('newPropCarports').value) || 0;
    const storeys = parseInt(document.getElementById('newPropStoreys').value) || 1;

    // Media & Details
    const img = document.getElementById('newPropImage').value.trim() || 'assets/images/property1.jpg';
    const desc = document.getElementById('newPropDesc').value.trim();
    const amenities = document.getElementById('newPropAmenities').value.trim();

    const payload = {
        title: name,
        location: loc,
        property_type: type,
        price: numPrice,
        status: status,
        lot_area: lotArea,
        floor_area: floorArea,
        bedrooms: beds,
        bathrooms: baths,
        carports: carports,
        storeys: storeys,
        image_url: img,
        description: desc,
        amenities: amenities
    };

    const saveBtn = document.getElementById('modalSubmitBtn');
    const origText = saveBtn.innerText;
    saveBtn.disabled = true;
    saveBtn.innerText = editingId ? 'Updating...' : 'Saving...';

    try {
        if (editingId) {
            if (typeof apiUpdateProperty === 'function') {
                const updated = await apiUpdateProperty(editingId, payload);
                if (updated) {
                    alert(`✓ Property "${name}" successfully updated!`);
                }
            }
        } else {
            if (typeof apiAddProperty === 'function') {
                const added = await apiAddProperty(payload);
                if (added) {
                    alert(`✓ Property "${name}" successfully added with complete house & lot details!`);
                }
            }
        }

        toggleAddModal(false);
        await loadAdminProperties();
    } catch (err) {
        alert('Error saving property: ' + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = origText;
    }
}

/**
 * Filter Table by Search and Status
 */
function filterTable() {
    const search = document.getElementById('propSearch').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#propTableBody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const statusBadge = row.querySelector('.status-badge-table');
        const rowStatus = statusBadge ? statusBadge.innerText.trim() : '';
        const matchesSearch = text.includes(search);
        const matchesStatus = !status || rowStatus === status;

        if (matchesSearch && matchesStatus) row.style.display = '';
        else row.style.display = 'none';
    });
}

window.selectImagePreset = selectImagePreset;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.viewProperty = viewProperty;
window.saveProperty = saveProperty;
window.deleteRow = deleteRow;
window.filterTable = filterTable;

window.addEventListener('DOMContentLoaded', () => {
    loadAdminProperties();
});
