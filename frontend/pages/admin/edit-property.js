/**
 * UrbanScope - Admin Edit Property Controller
 * ==========================================================
 * Loads existing property details from database / API,
 * supports image replacement with canvas optimization,
 * and publishes updates to Supabase live database.
 */

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("editPropertyForm");
    const saveButton = form?.querySelector(".save-btn");
    const sidebar = document.getElementById("adminSidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const imageInput = document.getElementById("property-images");
    const currentImageContainer = document.querySelector(".current-image");

    const propertyId = new URLSearchParams(window.location.search).get("id");

    let currentProperty = null;
    let currentImageUrl = "";

    if (!form) {
        console.error("Edit property form was not found.");
        return;
    }

    if (!propertyId || !/^\d+$/.test(propertyId)) {
        alert("Invalid or missing property ID.");
        window.location.href = "propertylist.html";
        return;
    }

    // Helper functions
    const getField = (id) => document.getElementById(id);

    function setFieldValue(id, value) {
        const field = getField(id);
        if (field) field.value = value ?? "";
    }

    function normalizeStatus(value) {
        const str = String(value ?? "").trim();
        if (/pending/i.test(str) || /review/i.test(str)) return "Under Review";
        if (/avail/i.test(str)) return "Available";
        if (/reserv/i.test(str)) return "Reserved";
        if (/sold/i.test(str)) return "Sold";
        return str || "Available";
    }

    function normalizeType(value) {
        const str = String(value ?? "").trim();
        const select = getField("property-type");
        if (!select) return str;

        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value.toLowerCase() === str.toLowerCase()) {
                return select.options[i].value;
            }
        }
        if (/house/i.test(str) && /lot/i.test(str)) return "House & Lot";
        if (/townhouse/i.test(str)) return "Townhouse";
        if (/villa/i.test(str)) return "Villa";
        if (/condo/i.test(str)) return "Condominium";
        if (/apart/i.test(str)) return "Apartment";
        if (/subdiv/i.test(str)) return "Subdivision";
        if (/triplex/i.test(str)) return "Triplex";
        return str || "Other";
    }

    function renderCurrentImages(url) {
        if (!currentImageContainer) return;
        currentImageContainer.replaceChildren();

        if (!url) {
            const placeholder = document.createElement("div");
            placeholder.className = "image-placeholder";
            placeholder.textContent = "No saved image for this property.";
            currentImageContainer.appendChild(placeholder);
            return;
        }

        const resolvedSrc = (url.startsWith("http") || url.startsWith("data:"))
            ? url
            : "../../" + url.replace(/^(\.\.\/)+/, "");

        const wrapper = document.createElement("div");
        const image = document.createElement("img");

        image.src = resolvedSrc;
        image.alt = "Current property image";
        image.loading = "lazy";
        image.style.maxWidth = "100%";
        image.style.maxHeight = "240px";
        image.style.borderRadius = "8px";
        image.style.objectFit = "cover";

        image.onerror = () => {
            wrapper.replaceChildren();
            const placeholder = document.createElement("div");
            placeholder.className = "image-placeholder";
            placeholder.textContent = "Image could not be loaded.";
            wrapper.appendChild(placeholder);
        };

        wrapper.appendChild(image);
        currentImageContainer.appendChild(wrapper);
    }

    function verifyAdmin() {
        const adminUser = localStorage.getItem("adminUser") || localStorage.getItem("urbanscope_user");
        if (!adminUser) {
            alert("Please log in as an administrator to manage listings.");
            window.location.href = "../auth/login.html";
            return false;
        }
        return true;
    }

    async function loadProperty() {
        if (currentImageContainer) {
            currentImageContainer.replaceChildren();
            const loading = document.createElement("div");
            loading.className = "image-placeholder";
            loading.textContent = "Loading current property details...";
            currentImageContainer.appendChild(loading);
        }

        let data = null;
        if (typeof apiGetPropertyById === "function") {
            try {
                data = await apiGetPropertyById(propertyId);
            } catch (err) {
                console.warn("Could not fetch property by ID:", err);
            }
        }

        if (!data) {
            // Check fallback from localStorage cache
            try {
                const list = JSON.parse(localStorage.getItem("properties") || "[]")
                    .concat(JSON.parse(localStorage.getItem("urbanScopeProperties") || "[]"));
                data = list.find((p) => String(p.id) === String(propertyId));
            } catch (e) {}
        }

        if (!data) {
            alert("The selected property was not found.");
            window.location.href = "propertylist.html";
            return;
        }

        currentProperty = data;

        setFieldValue("property-name", data.title || data.propertyName || data.name);
        setFieldValue("location", data.location || data.address);
        setFieldValue("property-type", normalizeType(data.property_type || data.propertyType));
        setFieldValue("price", data.price);
        setFieldValue("status", normalizeStatus(data.status));
        setFieldValue("lot-area", data.lot_area || data.lotArea);
        setFieldValue("floor-area", data.floor_area || data.floorArea);
        setFieldValue("description", data.description);

        currentImageUrl = data.image_url || "";
        renderCurrentImages(currentImageUrl);
    }

    function readImageFileAsDataUrl(file) {
        return new Promise((resolve) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxDim = 1200;
                    let width = img.width;
                    let height = img.height;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/jpeg", 0.82));
                };
                img.onerror = () => resolve(e.target.result);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    imageInput?.addEventListener("change", () => {
        if (!currentImageContainer) return;
        const file = imageInput.files?.[0];
        if (!file) {
            renderCurrentImages(currentImageUrl);
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            imageInput.value = "";
            renderCurrentImages(currentImageUrl);
            return;
        }

        currentImageContainer.replaceChildren();
        const wrapper = document.createElement("div");
        const preview = document.createElement("img");
        preview.alt = "New replacement image preview";
        preview.src = URL.createObjectURL(file);
        preview.style.maxWidth = "100%";
        preview.style.maxHeight = "240px";
        preview.style.borderRadius = "8px";
        preview.style.objectFit = "cover";

        preview.onload = () => URL.revokeObjectURL(preview.src);
        wrapper.appendChild(preview);
        currentImageContainer.appendChild(wrapper);
    });

    // Handle Form Submission
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!currentProperty) {
            alert("Property details have not loaded yet. Please wait.");
            return;
        }

        const title = getField("property-name")?.value.trim();
        const location = getField("location")?.value.trim();
        const propertyType = getField("property-type")?.value;
        const price = parseFloat(getField("price")?.value) || 0;
        const status = getField("status")?.value || "Available";

        if (!title || !location || !propertyType || !status || price < 0) {
            alert("Please fill in all required fields.");
            return;
        }

        const lotArea = parseFloat(getField("lot-area")?.value) || null;
        const floorArea = parseFloat(getField("floor-area")?.value) || null;
        const description = getField("description")?.value.trim() || "";

        const originalButtonText = saveButton?.textContent || "Save Changes";
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving to Database...";
        }

        try {
            let imageUrl = currentImageUrl;
            const selectedFile = imageInput?.files?.[0];
            if (selectedFile) {
                imageUrl = await readImageFileAsDataUrl(selectedFile);
            }

            const updates = {
                title: title,
                location: location,
                property_type: propertyType,
                price: price,
                status: status,
                lot_area: lotArea,
                floor_area: floorArea,
                description: description,
                image_url: imageUrl || currentImageUrl || "assets/images/property1.jpg"
            };

            let updatedRecord = null;
            if (typeof apiUpdateProperty === "function") {
                updatedRecord = await apiUpdateProperty(propertyId, updates);
            }

            // Sync localStorage caches
            try {
                let props = JSON.parse(localStorage.getItem("properties") || "[]");
                props = props.map((p) => {
                    if (String(p.id) === String(propertyId)) {
                        return { ...p, ...updates, name: title, type: propertyType };
                    }
                    return p;
                });
                localStorage.setItem("properties", JSON.stringify(props));
            } catch (e) {}

            alert("✓ Property updated successfully!");
            window.location.href = "propertylist.html";
        } catch (error) {
            console.error("Error updating property:", error);
            alert("Could not update property: " + error.message);
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = originalButtonText;
            }
        }
    });

    // Sidebar and navigation controls are handled by admin-shell.js

    // Initialize
    if (verifyAdmin()) {
        await loadProperty();
    }
});