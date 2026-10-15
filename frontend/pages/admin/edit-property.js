document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("editPropertyForm");
    const saveButton = form?.querySelector(".save-btn");
    const sidebar = document.getElementById("adminSidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const logoutLink = document.querySelector(".logout-link");
    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");
    const imageInput = document.getElementById("property-images");
    const currentImageContainer = document.querySelector(".current-image");

    const propertyId = new URLSearchParams(
        window.location.search
    ).get("id");

    let currentProperty = null;
    let currentImageUrl = "";

    if (!form) {
        console.error("Edit property form was not found.");
        return;
    }

    const supabase = window.supabaseClient;

    if (!supabase) {
        alert("Supabase is not configured. Check your script paths.");
        return;
    }

    if (!propertyId || !/^\d+$/.test(propertyId)) {
        alert("Invalid or missing property ID.");
        window.location.href = "properties.html";
        return;
    }

    const getField = (id) => document.getElementById(id);

    function setFieldValue(id, value) {
        const field = getField(id);
        if (field) field.value = value ?? "";
    }

    function normalizeStatus(value) {
        const normalized = String(value ?? "").trim().toLowerCase();

        const options = {
            available: "Available",
            pending: "Pending",
            sold: "Sold",
            unavailable: "Unavailable"
        };

        return options[normalized] || value || "";
    }

    function normalizeType(value) {
        const normalized = String(value ?? "").trim().toLowerCase();

        const options = {
            "house & lot": "house-lot",
            "house and lot": "house-lot",
            "house-lot": "house-lot",
            townhouse: "townhouse",
            duplex: "duplex",
            condominium: "condominium",
            condo: "condominium",
            "lot only": "lot",
            lot: "lot",
            other: "other"
        };

        return options[normalized] || value || "";
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

        const wrapper = document.createElement("div");
        const image = document.createElement("img");

        image.src = url;
        image.alt = "Current property image";
        image.loading = "lazy";

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

    async function verifyAdmin() {
        const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
            alert("Please log in before editing a property.");
            window.location.href = "login.html";
            return false;
        }

        const { data: admin, error: adminError } = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (adminError) throw adminError;

        if (!admin) {
            alert("Administrator access is required.");
            window.location.href = "properties.html";
            return false;
        }

        return true;
    }

    async function loadProperty() {
        if (currentImageContainer) {
            currentImageContainer.replaceChildren();

            const loading = document.createElement("div");
            loading.className = "image-placeholder";
            loading.textContent = "Loading current image...";

            currentImageContainer.appendChild(loading);
        }

        const { data, error } = await supabase
            .from("properties")
            .select("*")
            .eq("id", propertyId)
            .single();

        if (error) throw error;

        if (!data) {
            throw new Error("The selected property was not found.");
        }

        currentProperty = data;

        setFieldValue("property-name", data.title);
        setFieldValue("location", data.location || data.address);
        setFieldValue("property-type", normalizeType(data.property_type));
        setFieldValue("price", data.price);
        setFieldValue("status", normalizeStatus(data.status));
        setFieldValue("lot-area", data.lot_area);
        setFieldValue("floor-area", data.floor_area);
        setFieldValue("description", data.description);

        currentImageUrl = data.image_url || "";
        renderCurrentImages(currentImageUrl);
    }

    imageInput?.addEventListener("change", () => {
        if (!currentImageContainer) return;

        const files = Array.from(imageInput.files || []);
        const file = files[0];

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
        const image = document.createElement("img");

        image.alt = "Selected replacement image";
        image.src = URL.createObjectURL(file);

        image.onload = () => URL.revokeObjectURL(image.src);

        wrapper.appendChild(image);
        currentImageContainer.appendChild(wrapper);
    });

    async function uploadReplacementImage(file, userId) {
        if (!file.type.startsWith("image/")) {
            throw new Error("Please select a valid image file.");
        }

        const safeName = file.name
            .normalize("NFKD")
            .replace(/[^a-zA-Z0-9._-]/g, "-");

        const filePath =
            `${userId}/${propertyId}/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from("property-images")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from("property-images")
            .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
            throw new Error("Could not get the uploaded image URL.");
        }

        return publicUrlData.publicUrl;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!currentProperty) {
            alert("Property information has not loaded yet. Please try again.");
            return;
        }

        const title = getField("property-name")?.value.trim();
        const location = getField("location")?.value.trim();
        const propertyType = getField("property-type")?.value;
        const priceValue = getField("price")?.value;
        const price = Number(priceValue);
        const status = getField("status")?.value;

        if (
            !title ||
            !location ||
            !propertyType ||
            !status ||
            priceValue === "" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            alert("Please complete all required fields with valid values.");
            return;
        }

        const lotValue = getField("lot-area")?.value;
        const floorValue = getField("floor-area")?.value;

        const lotArea = lotValue === "" ? null : Number(lotValue);
        const floorArea = floorValue === "" ? null : Number(floorValue);

        if (
            (lotArea !== null &&
                (!Number.isFinite(lotArea) || lotArea < 0)) ||
            (floorArea !== null &&
                (!Number.isFinite(floorArea) || floorArea < 0))
        ) {
            alert("Lot area and floor area must be zero or greater.");
            return;
        }

        const originalButtonText =
            saveButton?.textContent || "Save Changes";

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
        }

        try {
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            const user = sessionData.session?.user;

            if (!user) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            const { data: admin, error: adminError } = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (adminError) throw adminError;

            if (!admin) {
                throw new Error(
                    "Administrator access is required to save changes."
                );
            }

            let imageUrl = currentImageUrl;
            const selectedFile = imageInput?.files?.[0];

            if (selectedFile) {
                imageUrl = await uploadReplacementImage(
                    selectedFile,
                    user.id
                );
            }

            const updates = {
                title: title,
                location: location,
                property_type: propertyType,
                price: price,
                status: status,
                lot_area: lotArea,
                floor_area: floorArea,
                description:
                    getField("description")?.value.trim() || null,
                image_url: imageUrl || null,
                updated_at: new Date().toISOString()
            };

            // Keep address in sync with the edited location if it exists.
            if ("address" in currentProperty) {
                updates.address = location;
            }

            const { data: updatedRows, error: updateError } = await supabase
                .from("properties")
                .update(updates)
                .eq("id", propertyId)
                .select("id");

            if (updateError) throw updateError;

            if (!updatedRows || updatedRows.length === 0) {
                throw new Error(
                    "No property was updated. Check your property ID and Supabase UPDATE policy."
                );
            }

            alert("Property updated successfully!");
            window.location.href = "properties.html";
        } catch (error) {
            console.error("Unable to update property:", error);

            alert(
                "Unable to save property changes.\n\n" +
                (error.message || "Please try again.")
            );
        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = originalButtonText;
            }
        }
    });

    function openSidebar() {
        sidebar?.classList.add("sidebar-open");
        sidebarBackdrop?.classList.add("backdrop-visible");
        document.body.classList.add("sidebar-is-open");
    }

    function closeSidebar() {
        sidebar?.classList.remove("sidebar-open");
        sidebarBackdrop?.classList.remove("backdrop-visible");
        document.body.classList.remove("sidebar-is-open");
    }

    sidebarToggle?.addEventListener("click", openSidebar);
    closeSidebarBtn?.addEventListener("click", closeSidebar);
    sidebarBackdrop?.addEventListener("click", closeSidebar);

    document.querySelectorAll(".sidebar-nav a").forEach((link) => {
        link.addEventListener("click", closeSidebar);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();

            if (profileDropdown) {
                profileDropdown.hidden = true;
            }

            profileButton?.setAttribute("aria-expanded", "false");
        }
    });

    async function signOut(event) {
        event.preventDefault();

        if (!window.confirm("Are you sure you want to log out?")) {
            return;
        }

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error("Logout error:", error);
        }

        window.location.href = "login.html";
    }

    logoutLink?.addEventListener("click", signOut);

    if (profileButton && profileDropdown) {
        profileDropdown.hidden = true;

        profileButton.addEventListener("click", (event) => {
            event.stopPropagation();

            profileDropdown.hidden = !profileDropdown.hidden;

            profileButton.setAttribute(
                "aria-expanded",
                String(!profileDropdown.hidden)
            );
        });

        profileDropdown
            .querySelectorAll(".profile-signout, .logout-link")
            .forEach((link) => {
                link.addEventListener("click", signOut);
            });

        document.addEventListener("click", (event) => {
            if (
                !profileDropdown.contains(event.target) &&
                !profileButton.contains(event.target)
            ) {
                profileDropdown.hidden = true;
                profileButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    try {
        const isAdmin = await verifyAdmin();

        if (!isAdmin) return;

        await loadProperty();
    } catch (error) {
        console.error("Unable to load property:", error);

        if (currentImageContainer) {
            currentImageContainer.replaceChildren();

            const placeholder = document.createElement("div");
            placeholder.className = "image-placeholder";
            placeholder.textContent = "Unable to load image.";

            currentImageContainer.appendChild(placeholder);
        }

        alert(
            "Unable to load this property's information.\n\n" +
            (error.message || "Please try again.")
        );
    }
});