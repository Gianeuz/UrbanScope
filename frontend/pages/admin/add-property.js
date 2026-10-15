
document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // SIDEBAR ELEMENTS
    // =========================

    const sidebar = document.getElementById("adminSidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const closeSidebarBtn = document.getElementById("closeSidebarBtn");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");

    // =========================
    // PROFILE ELEMENTS
    // =========================

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");

    // =========================
    // OTHER ELEMENTS
    // =========================

    const inquiriesGroup = document.getElementById("inquiriesGroup");
    const inquiriesToggle = document.getElementById("inquiriesToggle");

    const propertyForm = document.getElementById("addPropertyForm");
    const propertyImages = document.getElementById("propertyImages");
    const imagePreview = document.getElementById("imagePreview");

    let selectedFiles = [];

    // =========================
    // SIDEBAR
    // =========================

    function openSidebar() {
        if (!sidebar || !sidebarBackdrop || !sidebarToggle) return;

        sidebar.classList.add("open");
        sidebarBackdrop.classList.add("active");
        sidebarToggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove("open");
        }

        if (sidebarBackdrop) {
            sidebarBackdrop.classList.remove("active");
        }

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "false");
        }

        document.body.style.overflow = "";
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            if (sidebar && sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", closeSidebar);
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", closeSidebar);
    }

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            closeSidebar();
        }
    });

    // PROFILE DROPDOWN
    function closeProfileDropdown() {
        if (profileDropdown) {
            profileDropdown.classList.remove("active", "show");
            profileDropdown.hidden = true;
        }
        if (profileButton) profileButton.setAttribute("aria-expanded", "false");
    }

    if (profileButton && profileDropdown) {
        profileDropdown.hidden = true;
        profileButton.setAttribute("aria-expanded", "false");
        profileButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const opening = profileDropdown.hidden;
            profileDropdown.hidden = !opening;
            profileDropdown.classList.toggle("active", opening);
            profileButton.setAttribute("aria-expanded", String(opening));
        });
        profileDropdown.addEventListener("click", (event) => {
            const profileLink = event.target.closest("[data-profile-action]");
            if (profileLink) {
                event.preventDefault();
                closeProfileDropdown();
                alert("Profile settings are not available yet.");
            }
        });
        document.addEventListener("click", (event) => {
            if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) closeProfileDropdown();
        });
    }

    // =========================
    // ESCAPE KEY
    // =========================

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
            closeProfileDropdown();
        }
    });

    // =========================
    // INQUIRIES SUBMENU
    // =========================

    if (inquiriesToggle && inquiriesGroup) {
        inquiriesToggle.addEventListener("click", () => {
            const isOpen = inquiriesGroup.classList.toggle("open");

            inquiriesToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }

    // =========================
    // PLACEHOLDER NAVIGATION
    // =========================

    document.querySelectorAll("[data-notice]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            alert(
                link.dataset.notice + " is not available yet."
            );
        });
    });

    // =========================
    // IMAGE UPLOAD AND PREVIEW
    // =========================

    function renderImagePreviews() {
        if (!imagePreview) return;

        imagePreview.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const item = document.createElement("div");
            item.className = "preview-item";

            const image = document.createElement("img");
            const imageUrl = URL.createObjectURL(file);

            image.src = imageUrl;
            image.alt = file.name;

            image.addEventListener("load", () => {
                URL.revokeObjectURL(imageUrl);
            }, { once: true });

            image.addEventListener("error", () => {
                URL.revokeObjectURL(imageUrl);
            }, { once: true });

            const fileName = document.createElement("p");
            fileName.textContent = file.name;
            fileName.title = file.name;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-image";
            removeButton.textContent = "×";

            removeButton.setAttribute(
                "aria-label",
                "Remove " + file.name
            );

            removeButton.addEventListener("click", () => {
                selectedFiles.splice(index, 1);

                updateFileInput();
                renderImagePreviews();
            });

            item.append(image, fileName, removeButton);
            imagePreview.appendChild(item);
        });
    }

    function updateFileInput() {
        if (!propertyImages) return;

        const transfer = new DataTransfer();

        selectedFiles.forEach((file) => {
            transfer.items.add(file);
        });

        propertyImages.files = transfer.files;
    }

    if (propertyImages && imagePreview) {
        propertyImages.addEventListener("change", () => {
            const incomingFiles = Array.from(propertyImages.files);

            const existingKeys = new Set(
                selectedFiles.map((file) =>
                    `${file.name}-${file.size}-${file.lastModified}`
                )
            );

            incomingFiles.forEach((file) => {
                if (!file.type.startsWith("image/")) {
                    return;
                }

                const key =
                    `${file.name}-${file.size}-${file.lastModified}`;

                if (!existingKeys.has(key)) {
                    selectedFiles.push(file);
                    existingKeys.add(key);
                }
            });

            updateFileInput();
            renderImagePreviews();
        });
    }

    // =========================
    // CLEAR FORM
    // =========================

    if (propertyForm) {
        propertyForm.addEventListener("reset", () => {
            window.setTimeout(() => {
                selectedFiles = [];

                if (propertyImages) {
                    propertyImages.value = "";
                }

                if (imagePreview) {
                    imagePreview.innerHTML = "";
                }
            }, 0);
        });
    }

    function readImageFileAsDataUrl(file) {
        return new Promise((resolve) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    // =========================
    // SAVE PROPERTY
    // =========================

    if (propertyForm) {
        propertyForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!propertyForm.reportValidity()) {
                return;
            }

            const submitBtn = propertyForm.querySelector("button[type='submit']");
            const originalBtnText = submitBtn ? submitBtn.innerText : "Save Property";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Saving to Database...";
            }

            let uploadedImageUrl = null;
            if (selectedFiles.length > 0) {
                uploadedImageUrl = await readImageFileAsDataUrl(selectedFiles[0]);
            }

            const property = {
                id: Date.now(),
                propertyName: document.getElementById("propertyName")?.value.trim() || "New Listing",
                title: document.getElementById("propertyName")?.value.trim() || "New Listing",
                location: document.getElementById("location")?.value.trim() || "Cavite, Philippines",
                propertyType: document.getElementById("propertyType")?.value || "Villa",
                property_type: document.getElementById("propertyType")?.value || "Villa",
                price: parseFloat(document.getElementById("price")?.value) || 0,
                status: document.getElementById("status")?.value || "Available",
                bedrooms: parseInt(document.getElementById("bedrooms")?.value, 10) || 3,
                bathrooms: parseInt(document.getElementById("bathrooms")?.value, 10) || 2,
                carports: parseInt(document.getElementById("carports")?.value, 10) || 1,
                storeys: parseInt(document.getElementById("storeys")?.value, 10) || 2,
                lotArea: parseFloat(document.getElementById("lotArea")?.value) || 100,
                floorArea: parseFloat(document.getElementById("floorArea")?.value) || 80,
                amenities: document.getElementById("amenities")?.value.trim() || "",
                description: document.getElementById("description")?.value.trim() || "",
                image_url: uploadedImageUrl || (selectedFiles[0] ? "assets/images/" + selectedFiles[0].name : "assets/images/property1.jpg"),
                createdAt: new Date().toISOString()
            };

            let savedToCloud = false;
            if (typeof apiAddProperty === "function") {
                try {
                    const cloudRes = await apiAddProperty(property);
                    if (cloudRes) {
                        savedToCloud = true;
                        if (cloudRes.id) property.id = cloudRes.id;
                    }
                } catch (e) {
                    console.warn("Database add property warning:", e);
                }
            }

            try {
                // Keep local browser cache updated
                const savedProperties = JSON.parse(
                    localStorage.getItem("urbanScopeProperties") || "[]"
                );
                savedProperties.unshift(property);
                localStorage.setItem(
                    "urbanScopeProperties",
                    JSON.stringify(savedProperties)
                );

                const adminProps = JSON.parse(localStorage.getItem("properties") || "[]");
                adminProps.unshift({
                    id: property.id,
                    name: property.propertyName,
                    title: property.propertyName,
                    location: property.location,
                    type: property.propertyType,
                    property_type: property.propertyType,
                    price: property.price,
                    status: property.status,
                    image_url: property.image_url
                });
                localStorage.setItem("properties", JSON.stringify(adminProps));

                if (savedToCloud) {
                    alert(
                        "✓ Property successfully published to the Live Database!\n\n" +
                        "Property: " + property.propertyName + "\n" +
                        "Type: " + property.propertyType + "\n" +
                        "Status: " + property.status + "\n\n" +
                        "It is now immediately visible across the website catalog and featured listings."
                    );
                } else {
                    alert(
                        "✓ Property saved locally!\n\n" +
                        "Property: " + property.propertyName
                    );
                }

                propertyForm.reset();
                window.location.href = "dashboard.html";

            } catch (error) {
                console.error("Unable to save property:", error);
                alert("Unable to save the property details. Please check your browser storage settings.");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
            }
        });
    }

});
