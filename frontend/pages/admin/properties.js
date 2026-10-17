// ================================
// MANAGE PROPERTIES
// ================================

const propertyTableBody =
    document.getElementById("propertyTableBody");


// ================================
// LOAD SAVED PROPERTIES
// ================================

async function loadSavedProperties() {
    if (!propertyTableBody) return;
    propertyTableBody.innerHTML = "";

    let properties = [];
    if (typeof apiGetProperties === "function") {
        try {
            const liveProps = await apiGetProperties();
            if (Array.isArray(liveProps) && liveProps.length > 0) {
                properties = liveProps;
            }
        } catch (e) {
            console.warn("Could not load from Supabase:", e);
        }
    }

    if (properties.length === 0) {
        properties = JSON.parse(localStorage.getItem("properties")) || [];
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
    const status = property.status || "Available";
    const imgSrc = property.image_url ?
        (property.image_url.startsWith('http') ? property.image_url : '../../' + property.image_url.replace(/^(\.\.\/)+/, '')) :
        '../../assets/images/property1.jpg';

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <div class="property-name">
                <div class="property-image" style="width:48px;height:48px;overflow:hidden;border-radius:6px;">
                    <img src="${imgSrc}" alt="${title}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='../../assets/images/property1.jpg'">
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
            <span class="status status-update">
                ${status}
            </span>
        </td>
        <td>
            <div class="actions">
                <button type="button" class="view-btn" data-id="${property.id}">View</button>
                <button type="button" class="edit-btn" data-id="${property.id}">Edit</button>
                <button type="button" class="delete-btn" data-id="${property.id}">Delete</button>
            </div>
        </td>
    `;

    propertyTableBody.appendChild(row);
}


// ================================
// DELETE MODAL
// ================================

const deleteModal =
    document.getElementById("deleteModal");

const cancelDelete =
    document.getElementById("cancelDelete");

const confirmDelete =
    document.getElementById("confirmDelete");

const propertyToDelete =
    document.getElementById("propertyToDelete");

let selectedPropertyId = null;


// ================================
// BUTTON ACTIONS
// ================================

document.addEventListener(
    "click",
    function (event) {

        // ============================
        // VIEW
        // ============================

        if (
            event.target.classList.contains(
                "view-btn"
            )
        ) {

            const propertyId =
                event.target.dataset.id;

            console.log(
                "VIEW PROPERTY ID:",
                propertyId
            );

            window.location.href =
                "../properties/property-detail.html?id=" +
                encodeURIComponent(propertyId);

            return;
        }


        // ============================
        // EDIT
        // ============================

        if (
            event.target.classList.contains(
                "edit-btn"
            )
        ) {

            const propertyId =
                event.target.dataset.id;

            console.log(
                "EDIT PROPERTY ID:",
                propertyId
            );

            window.location.href =
                "edit-property.html?id=" +
                encodeURIComponent(propertyId);

            return;
        }


        // ============================
        // DELETE
        // ============================

        if (
            event.target.classList.contains(
                "delete-btn"
            )
        ) {

            const button =
                event.target;

            const propertyId =
                button.dataset.id;


            // Make sure the button has an ID
            if (!propertyId) {

                alert(
                    "This property cannot be deleted yet."
                );

                return;
            }


            selectedPropertyId =
                propertyId;


            const row =
                button.closest("tr");


            const propertyName =
                row.querySelector(
                    "strong"
                ).textContent;


            propertyToDelete.textContent =
                `"${propertyName}"`;


            deleteModal.classList.add(
                "show"
            );

        }

    }
);


// ================================
// CANCEL DELETE
// ================================

cancelDelete.addEventListener(
    "click",
    function () {

        deleteModal.classList.remove(
            "show"
        );

        selectedPropertyId = null;

    }
);


// ================================
// CONFIRM DELETE
// ================================

confirmDelete.addEventListener(
    "click",
    async function () {

        if (
            selectedPropertyId === null
        ) {
            return;
        }

        if (typeof apiDeleteProperty === "function") {
            try {
                await apiDeleteProperty(selectedPropertyId);
            } catch (err) {
                console.warn("Supabase delete notice:", err);
            }
        }

        let properties =
            JSON.parse(
                localStorage.getItem(
                    "properties"
                )
            ) || [];

        properties =
            properties.filter(
                function (property) {

                    return String(property.id) !==
                        String(selectedPropertyId);

                }
            );

        localStorage.setItem(
            "properties",
            JSON.stringify(properties)
        );

        deleteModal.classList.remove(
            "show"
        );

        selectedPropertyId = null;

        await loadSavedProperties();

    }
);


// ================================
// CLOSE MODAL OUTSIDE
// ================================

deleteModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === deleteModal
        ) {

            deleteModal.classList.remove(
                "show"
            );

            selectedPropertyId = null;

        }

    }
);


// ================================
// ESC KEY
// ================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            deleteModal.classList.remove(
                "show"
            );

            selectedPropertyId = null;

        }

    }
);


// ================================
// LOAD PROPERTIES
// ================================

loadSavedProperties();


// ================================
// SIDEBAR TOGGLE
// ================================

const sidebar =
    document.getElementById("adminSidebar");

const sidebarToggle =
    document.getElementById("sidebarToggle");

const sidebarBackdrop =
    document.getElementById("sidebarBackdrop");

const closeSidebarBtn =
    document.getElementById("closeSidebarBtn");


// OPEN SIDEBAR
sidebarToggle.addEventListener(
    "click",
    function () {

        sidebar.classList.add("open");

        sidebarBackdrop.classList.add("show");

    }
);


// CLOSE SIDEBAR
closeSidebarBtn.addEventListener(
    "click",
    function () {

        sidebar.classList.remove("open");

        sidebarBackdrop.classList.remove("show");

    }
);


// CLOSE SIDEBAR WHEN CLICKING OUTSIDE
sidebarBackdrop.addEventListener(
    "click",
    function () {

        sidebar.classList.remove("open");

        sidebarBackdrop.classList.remove("show");

    }
);



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
    profileDropdown.addEventListener("click", function (event) {
        const profileLink = event.target.closest("[data-profile-action]");
        if (profileLink) {
            event.preventDefault();
            closeProfileDropdown();
            alert("Profile settings are not available yet.");
        }
    });
    document.addEventListener("click", function (event) {
        if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) closeProfileDropdown();
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeProfileDropdown();
    });
}
