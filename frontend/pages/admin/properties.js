// ================================
// MANAGE PROPERTIES
// ================================

const propertyTableBody =
    document.getElementById("propertyTableBody") || document.getElementById("propTableBody");


// ================================
// LOAD SAVED PROPERTIES
// ================================

async function loadSavedProperties() {
    if (!propertyTableBody) return;
    propertyTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color:#6b7f70;">Loading listings...</td></tr>`;

    let properties = [];
    if (typeof apiGetProperties === "function") {
        try {
            const liveProps = await apiGetProperties();
            if (Array.isArray(liveProps) && liveProps.length > 0) {
                properties = liveProps;
            }
        } catch (e) {
            console.warn("Notice loading properties:", e);
        }
    }

    if (properties.length === 0) {
        properties = JSON.parse(localStorage.getItem("properties")) || 
                     JSON.parse(localStorage.getItem("cached_live_properties")) || [];
    }

    propertyTableBody.innerHTML = "";
    if (properties.length === 0) {
        propertyTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color:#6b7f70;">No property records found.</td></tr>`;
        return;
    }

    properties.forEach(function (property) {
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
    const rawStatus = String(property.status || "Available").trim();
    const isSold = rawStatus.toLowerCase() === 'sold' || rawStatus.toLowerCase() === 'sold out';
    const displayStatus = isSold ? 'Sold' : 'Available';

    const imgSrc = property.image_url ? 
        (property.image_url.startsWith('http') || property.image_url.startsWith('data:') ? property.image_url : '../../' + property.image_url.replace(/^(\.\.\/)+/, '')) : 
        '../../assets/images/property1.jpg';

    const row = document.createElement("tr");
    if (isSold) {
        row.style.background = "#fcfdfc";
    }

    row.innerHTML = `
        <td>
            <div class="property-name" style="display:flex; align-items:center; gap:12px;">
                <div class="property-image" style="width:48px;height:48px;overflow:hidden;border-radius:8px;flex-shrink:0;">
                    <img src="${imgSrc}" alt="${title}" style="width:100%;height:100%;object-fit:cover;${isSold ? 'filter:grayscale(1); opacity:0.8;' : ''}" onerror="this.src='../../assets/images/property1.jpg'">
                </div>
                <div>
                    <strong style="${isSold ? 'color:#64748b;' : 'color:#1b2e21;'} font-size:0.92rem; display:block; line-height:1.3;">${title}</strong>
                    <small style="color:#6b7f70; font-size:0.78rem;">ID #${property.id}</small>
                </div>
            </div>
        </td>
        <td style="color:#2d3748; font-size:0.88rem; font-weight:500;">${loc}</td>
        <td><span style="padding:4px 9px; border-radius:6px; background:#eef5ef; color:#1a3b23; font-size:0.78rem; font-weight:600; display:inline-block;">${type}</span></td>
        <td style="font-weight:700; color:#1b2e21; font-size:0.9rem;">${priceStr}</td>
        <td>
            <span class="status-badge-table ${isSold ? 'status-badge-sold' : 'status-badge-available'}" 
                style="${isSold ? 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;' : 'background:#dcfce7; color:#15803d; border:1px solid #bbf7d0;'} padding:4px 10px; border-radius:12px; font-weight:600; font-size:0.78rem; display:inline-flex; align-items:center; gap:5px;">
                <span style="width:6px; height:6px; border-radius:50%; background:${isSold ? '#ef4444' : '#22c55e'}; display:inline-block;"></span>
                ${displayStatus}
            </span>
        </td>
        <td>
            <div class="actions">
                <button type="button" class="view-btn" data-id="${property.id}">View</button>
                <button type="button" class="edit-btn" data-id="${property.id}">Edit</button>
                <button type="button" class="status-toggle-btn ${isSold ? 'btn-make-available' : 'btn-make-sold'}" 
                    data-id="${property.id}" 
                    data-status="${displayStatus}">
                    ${isSold ? 'Mark Available' : 'Mark as Sold'}
                </button>
                <button type="button" class="delete-btn" 
                    data-id="${property.id}"
                    data-title="${String(title).replace(/"/g, '&quot;')}">
                    Delete
                </button>
            </div>
        </td>
    `;

    propertyTableBody.appendChild(row);
}


// ================================
// DELETE MODAL STATE & HANDLERS
// ================================

let selectedPropertyId = null;

const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");
const deleteModal = document.getElementById("deleteModal");

if (cancelDelete) {
    cancelDelete.addEventListener("click", function () {
        if (deleteModal) deleteModal.classList.remove("show");
        selectedPropertyId = null;
    });
}

if (confirmDelete) {
    confirmDelete.addEventListener("click", async function () {
        if (!selectedPropertyId) return;

        confirmDelete.disabled = true;
        confirmDelete.innerText = "Deleting...";

        try {
            let success = false;
            if (typeof apiDeleteProperty === "function") {
                success = await apiDeleteProperty(selectedPropertyId);
            } else {
                ['properties', 'cached_live_properties', 'urbanScopeProperties'].forEach(key => {
                    const list = JSON.parse(localStorage.getItem(key) || '[]');
                    const filtered = list.filter(p => String(p.id) !== String(selectedPropertyId));
                    localStorage.setItem(key, JSON.stringify(filtered));
                });
                success = true;
            }

            if (deleteModal) deleteModal.classList.remove("show");
            selectedPropertyId = null;
            await loadSavedProperties();
        } catch (err) {
            console.error("Delete notice:", err);
            alert("Could not delete property: " + (err.message || "Unknown error"));
        } finally {
            confirmDelete.disabled = false;
            confirmDelete.innerText = "Delete Property";
        }
    });
}

if (deleteModal) {
    deleteModal.addEventListener("click", function (event) {
        if (event.target === deleteModal) {
            deleteModal.classList.remove("show");
            selectedPropertyId = null;
        }
    });
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && deleteModal && deleteModal.classList.contains("show")) {
        deleteModal.classList.remove("show");
        selectedPropertyId = null;
    }
});


// ================================
// BUTTON ACTIONS (VIEW, EDIT, STATUS TOGGLE, DELETE)
// ================================

document.addEventListener(
    "click",
    async function (event) {

        // ============================
        // VIEW
        // ============================

        if (event.target.classList.contains("view-btn")) {
            const propertyId = event.target.dataset.id;
            window.location.href =
                "edit-property.html?id=" +
                encodeURIComponent(propertyId);
            return;
        }


        // ============================
        // EDIT
        // ============================

        if (event.target.classList.contains("edit-btn")) {
            const propertyId = event.target.dataset.id;
            window.location.href =
                "edit-property.html?id=" +
                encodeURIComponent(propertyId);
            return;
        }


        // ============================
        // STATUS TOGGLE (SOLD <-> AVAILABLE)
        // ============================

        if (event.target.classList.contains("status-toggle-btn")) {
            const button = event.target;
            const propertyId = button.dataset.id;
            const currentStatus = (button.dataset.status || 'Available').trim().toLowerCase();
            const isCurrentlySold = currentStatus === 'sold' || currentStatus === 'sold out';
            const newStatus = isCurrentlySold ? 'Available' : 'Sold';

            button.disabled = true;
            button.innerText = 'Updating...';

            try {
                if (typeof apiUpdateProperty === 'function') {
                    await apiUpdateProperty(propertyId, { status: newStatus });
                } else {
                    // Local fallback sync
                    ['properties', 'cached_live_properties', 'urbanScopeProperties'].forEach(key => {
                        const list = JSON.parse(localStorage.getItem(key) || '[]');
                        const idx = list.findIndex(p => String(p.id) === String(propertyId));
                        if (idx !== -1) {
                            list[idx].status = newStatus;
                            localStorage.setItem(key, JSON.stringify(list));
                        }
                    });
                }

                await loadSavedProperties();
            } catch (err) {
                console.error("Status toggle notice:", err);
                alert("Could not update property status. Please check your connection.");
                button.disabled = false;
                button.innerText = isCurrentlySold ? 'Mark Available' : 'Mark as Sold';
            }
            return;
        }


        // ============================
        // DELETE
        // ============================

        if (event.target.classList.contains("delete-btn")) {
            const button = event.target;
            const propertyId = button.dataset.id;
            const propertyTitle = button.dataset.title || button.closest("tr")?.querySelector("strong")?.textContent || "this property";

            if (!propertyId) {
                alert("This property cannot be deleted yet.");
                return;
            }

            if (deleteModal) {
                selectedPropertyId = propertyId;
                const propToDeleteEl = document.getElementById("propertyToDelete");
                if (propToDeleteEl) {
                    propToDeleteEl.textContent = `"${propertyTitle}"`;
                }
                deleteModal.classList.add("show");
            } else {
                if (confirm(`Are you sure you want to permanently delete "${propertyTitle}"?\n\nThis will remove it from the catalog and database.`)) {
                    button.disabled = true;
                    button.innerText = 'Deleting...';
                    try {
                        let success = false;
                        if (typeof apiDeleteProperty === "function") {
                            success = await apiDeleteProperty(propertyId);
                        } else {
                            ['properties', 'cached_live_properties', 'urbanScopeProperties'].forEach(key => {
                                const list = JSON.parse(localStorage.getItem(key) || '[]');
                                const filtered = list.filter(p => String(p.id) !== String(propertyId));
                                localStorage.setItem(key, JSON.stringify(filtered));
                            });
                            success = true;
                        }

                        if (success) {
                            await loadSavedProperties();
                        } else {
                            alert("Could not delete property. Please check your admin permissions.");
                            button.disabled = false;
                            button.innerText = 'Delete';
                        }
                    } catch (err) {
                        console.error("Delete notice:", err);
                        alert("Could not delete property: " + (err.message || "Unknown error"));
                        button.disabled = false;
                        button.innerText = 'Delete';
                    }
                }
            }
            return;
        }

    }
);


// ================================
// LOAD PROPERTIES
// ================================

loadSavedProperties();


// Sidebar and profile dropdown handled by admin-shell.js

document.querySelectorAll('.profile-signout, .logout-link').forEach(el => {
    el.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('supabase_token');
        localStorage.removeItem('urbanscope_jwt_token');
        localStorage.removeItem('urbanscope_user');
        if (typeof apiSignOut === 'function') apiSignOut();
    });
});
