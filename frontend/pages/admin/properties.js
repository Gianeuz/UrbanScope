/**
 * UrbanScope - Admin Manage Properties Controller
 * ==========================================================
 * Loads listings from API / database, supports real-time search
 * and status filtering, view, edit, and full deletion confirmation.
 */

const propertyTableBody = document.getElementById("propertyTableBody");
const propertySearchInput = document.getElementById("propertySearch");
const statusFilterSelect = document.getElementById("statusFilter");

const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");
const propertyToDelete = document.getElementById("propertyToDelete");

let allProperties = [];
let selectedPropertyId = null;

// ================================
// STATUS BADGE CLASS HELPER
// ================================
function getStatusClass(status) {
    const s = String(status || '').toLowerCase();
    if (s.includes('avail')) return 'status status-available';
    if (s.includes('pend') || s.includes('review')) return 'status status-pending';
    if (s.includes('reserv')) return 'status status-reserved';
    if (s.includes('sold')) return 'status status-sold';
    return 'status status-update';
}

// ================================
// IMAGE SOURCE RESOLVER
// ================================
function resolveImageSrc(url) {
    if (!url) return '../../assets/images/property1.jpg';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
        return url;
    }
    const cleanPath = url.replace(/^(\.\.\/)+/, '').replace(/^\//, '');
    return '../../' + cleanPath;
}

// ================================
// LOAD SAVED PROPERTIES
// ================================
async function loadSavedProperties() {
    if (!propertyTableBody) return;
    propertyTableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 36px; color: #64748b;">
                Loading listings from database...
            </td>
        </tr>
    `;

    let properties = [];
    if (typeof apiGetProperties === "function") {
        try {
            const liveProps = await apiGetProperties();
            if (Array.isArray(liveProps) && liveProps.length > 0) {
                properties = liveProps;
            }
        } catch (e) {
            console.warn("Could not load from API:", e);
        }
    }

    if (properties.length === 0) {
        try {
            const local = JSON.parse(localStorage.getItem("urbanScopeProperties") || "[]");
            const legacy = JSON.parse(localStorage.getItem("properties") || "[]");
            properties = local.concat(legacy);
        } catch (e) {}
    }

    allProperties = properties;
    applyFilterAndRender();
}

// ================================
// FILTER AND RENDER
// ================================
function applyFilterAndRender() {
    if (!propertyTableBody) return;
    propertyTableBody.innerHTML = "";

    const query = (propertySearchInput?.value || "").toLowerCase().trim();
    const statusFilter = (statusFilterSelect?.value || "").toLowerCase().trim();

    const filtered = allProperties.filter(property => {
        const title = (property.title || property.name || property.propertyName || "").toLowerCase();
        const loc = (property.location || "").toLowerCase();
        const type = (property.property_type || property.type || property.propertyType || "").toLowerCase();
        const idStr = String(property.id || "");
        const status = (property.status || "Available").toLowerCase();

        const matchesQuery = !query ||
            title.includes(query) ||
            loc.includes(query) ||
            type.includes(query) ||
            idStr.includes(query);

        let matchesStatus = true;
        if (statusFilter) {
            if (statusFilter === 'available') {
                matchesStatus = status.includes('avail');
            } else if (statusFilter === 'pending') {
                matchesStatus = status.includes('pend') || status.includes('review');
            } else if (statusFilter === 'reserved') {
                matchesStatus = status.includes('reserv');
            } else if (statusFilter === 'sold') {
                matchesStatus = status.includes('sold');
            } else {
                matchesStatus = status.includes(statusFilter);
            }
        }

        return matchesQuery && matchesStatus;
    });

    if (filtered.length === 0) {
        propertyTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #64748b; font-size: 14px;">
                    No property listings found matching your criteria.
                    <a href="add-property.html" style="color: #2d5a36; font-weight: 700; margin-left: 8px; text-decoration: underline;">
                        + Add New Property
                    </a>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(function (property) {
        addPropertyRow(property);
    });
}

// ================================
// ADD PROPERTY ROW
// ================================
function addPropertyRow(property) {
    const title = property.title || property.name || property.propertyName || "Listing";
    const type = property.property_type || property.type || property.propertyType || "—";
    const loc = property.location || "—";
    const priceStr = property.price ? "₱" + Number(property.price).toLocaleString() : "—";
    const status = property.status || "Available";
<<<<<<< HEAD
    const imgSrc = property.image_url ?
        (property.image_url.startsWith('http') ? property.image_url : '../../' + property.image_url.replace(/^(\.\.\/)+/, '')) :
        '../../assets/images/property1.jpg';
=======
    const imgSrc = resolveImageSrc(property.image_url);
>>>>>>> ff876db5019ac2c42a7c3d22d309f0833631c102

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <div class="property-name">
                <div class="property-image" style="width: 48px; height: 48px; overflow: hidden; border-radius: 6px; flex-shrink: 0;">
                    <img src="${imgSrc}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='../../assets/images/property1.jpg'">
                </div>
                <div>
                    <strong>${title}</strong>
                    <small>ID #${property.id}</small>
                </div>
            </div>
        </td>
        <td>${loc}</td>
        <td>${type}</td>
        <td>${priceStr}</td>
        <td>
            <span class="${getStatusClass(status)}">
                ${status}
            </span>
        </td>
        <td>
            <div class="actions">
                <button type="button" class="view-btn" data-id="${property.id}" title="View Listing">View</button>
                <button type="button" class="edit-btn" data-id="${property.id}" title="Edit Listing">Edit</button>
                <button type="button" class="delete-btn" data-id="${property.id}" title="Delete Listing">Delete</button>
            </div>
        </td>
    `;

    propertyTableBody.appendChild(row);
}

// Search & Filter event listeners
if (propertySearchInput) {
    propertySearchInput.addEventListener("input", applyFilterAndRender);
}
if (statusFilterSelect) {
    statusFilterSelect.addEventListener("change", applyFilterAndRender);
}

// ================================
// BUTTON ACTIONS (DELEGATED)
// ================================
document.addEventListener("click", function (event) {
    // VIEW
    const viewBtn = event.target.closest(".view-btn");
    if (viewBtn) {
        const propertyId = viewBtn.dataset.id;
        if (propertyId) {
            window.location.href = "../properties/property-detail.html?id=" + encodeURIComponent(propertyId);
        }
        return;
    }

    // EDIT
    const editBtn = event.target.closest(".edit-btn");
    if (editBtn) {
        const propertyId = editBtn.dataset.id;
        if (propertyId) {
            window.location.href = "edit-property.html?id=" + encodeURIComponent(propertyId);
        }
        return;
    }

    // DELETE TRIGGER
    const deleteBtn = event.target.closest(".delete-btn");
    if (deleteBtn) {
        const propertyId = deleteBtn.dataset.id;
        if (!propertyId) {
            alert("This property cannot be deleted.");
            return;
        }

        selectedPropertyId = propertyId;
        const row = deleteBtn.closest("tr");
        const propertyName = row?.querySelector("strong")?.textContent || "this property";

        if (propertyToDelete) {
            propertyToDelete.textContent = `"${propertyName}"`;
        }

        if (deleteModal) {
            deleteModal.classList.add("show");
        }
    }
});

// ================================
// CANCEL DELETE
// ================================
if (cancelDelete) {
    cancelDelete.addEventListener("click", function () {
        if (deleteModal) deleteModal.classList.remove("show");
        selectedPropertyId = null;
    });
}

// ================================
// CONFIRM DELETE
// ================================
if (confirmDelete) {
    confirmDelete.addEventListener("click", async function () {
        if (!selectedPropertyId) return;

        confirmDelete.disabled = true;
        const originalText = confirmDelete.textContent;
        confirmDelete.textContent = "Deleting...";

        try {
            if (typeof apiDeleteProperty === "function") {
                await apiDeleteProperty(selectedPropertyId);
            }
        } catch (err) {
            console.warn("Delete property notice:", err);
        }

        // Clean local array
        allProperties = allProperties.filter(function (p) {
            return String(p.id) !== String(selectedPropertyId);
        });

        // Clean local storage caches
        try {
            const cleanKey = (key) => {
                const list = JSON.parse(localStorage.getItem(key) || "[]");
                if (Array.isArray(list)) {
                    localStorage.setItem(key, JSON.stringify(list.filter(p => String(p.id) !== String(selectedPropertyId))));
                }
            };
            cleanKey("properties");
            cleanKey("urbanScopeProperties");
            cleanKey("cached_live_properties");
        } catch (e) {}

        if (deleteModal) {
            deleteModal.classList.remove("show");
        }

        selectedPropertyId = null;
        confirmDelete.disabled = false;
        confirmDelete.textContent = originalText;

        applyFilterAndRender();
    });
}

// Close modal outside
if (deleteModal) {
    deleteModal.addEventListener("click", function (event) {
        if (event.target === deleteModal) {
            deleteModal.classList.remove("show");
            selectedPropertyId = null;
        }
    });
}

// Escape key to close modal
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && deleteModal?.classList.contains("show")) {
        deleteModal.classList.remove("show");
        selectedPropertyId = null;
    }
});

// ================================
// SIDEBAR CONTROLS
// ================================
const sidebar = document.getElementById("adminSidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

if (sidebarToggle && sidebar && sidebarBackdrop) {
    sidebarToggle.addEventListener("click", function () {
        sidebar.classList.add("open");
        sidebarBackdrop.classList.add("show");
    });
}

if (closeSidebarBtn && sidebar && sidebarBackdrop) {
    closeSidebarBtn.addEventListener("click", function () {
        sidebar.classList.remove("open");
        sidebarBackdrop.classList.remove("show");
    });
}

if (sidebarBackdrop && sidebar) {
    sidebarBackdrop.addEventListener("click", function () {
        sidebar.classList.remove("open");
        sidebarBackdrop.classList.remove("show");
    });
}

// ================================
// TOPBAR PROFILE DROPDOWN
// ================================
const profileButton = document.getElementById("profileButton");
const profileDropdown = document.getElementById("profileDropdown");

function closeProfileDropdown() {
    if (!profileDropdown || !profileButton) return;
    profileDropdown.hidden = true;
    profileDropdown.classList.remove("show", "active");
    profileButton.setAttribute("aria-expanded", "false");
}

if (profileButton && profileDropdown) {
    profileDropdown.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");

    profileButton.addEventListener("click", function (event) {
        event.stopPropagation();
        const opening = profileDropdown.hidden;
        profileDropdown.hidden = !opening;
        profileDropdown.classList.toggle("show", opening);
        profileButton.setAttribute("aria-expanded", String(opening));
    });

    document.addEventListener("click", function (event) {
        if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
            closeProfileDropdown();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeProfileDropdown();
    });
}

// ================================
// INITIALIZE
// ================================
document.addEventListener("DOMContentLoaded", function () {
    loadSavedProperties();
});

// Run directly in case DOM already loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
    loadSavedProperties();
}
