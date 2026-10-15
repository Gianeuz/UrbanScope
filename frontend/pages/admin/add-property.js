
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

    // =========================
    // SAVE PROPERTY
    // =========================

    if (propertyForm) {
        propertyForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!propertyForm.reportValidity()) {
                return;
            }

            const property = {
                id: Date.now(),

                propertyName:
                    document.getElementById("propertyName")?.value.trim() || "",

                location:
                    document.getElementById("location")?.value.trim() || "",

                propertyType:
                    document.getElementById("propertyType")?.value || "",

                price:
                    document.getElementById("price")?.value || "",

                status:
                    document.getElementById("status")?.value || "",

                lotArea:
                    document.getElementById("lotArea")?.value || "",

                floorArea:
                    document.getElementById("floorArea")?.value || "",

                description:
                    document.getElementById("description")?.value.trim() || "",

                imageNames: selectedFiles.map((file) => file.name),

                createdAt: new Date().toISOString()
            };

            (async () => {
                let savedToCloud = false;
                if (typeof apiAddProperty === "function") {
                    try {
                        const cloudRes = await apiAddProperty(property);
                        if (cloudRes) {
                            savedToCloud = true;
                        }
                    } catch (e) {
                        console.warn("Supabase add property warning:", e);
                    }
                }

                try {
                    const savedProperties = JSON.parse(
                        localStorage.getItem("urbanScopeProperties") || "[]"
                    );
                    savedProperties.push(property);
                    localStorage.setItem(
                        "urbanScopeProperties",
                        JSON.stringify(savedProperties)
                    );

                    // Also mirror into "properties" key
                    const adminProps = JSON.parse(localStorage.getItem("properties") || "[]");
                    adminProps.unshift({
                        id: property.id,
                        name: property.propertyName,
                        title: property.propertyName,
                        location: property.location,
                        type: property.propertyType,
                        property_type: property.propertyType,
                        price: property.price,
                        status: property.status
                    });
                    localStorage.setItem("properties", JSON.stringify(adminProps));

                    if (savedToCloud) {
                        alert(
                            "✓ Property successfully published to Supabase Cloud Database!\n\n" +
                            "Property: " + property.propertyName + "\n" +
                            "Status: " + property.status
                        );
                    } else {
                        alert(
                            "Property details saved in this browser!\n\n" +
                            "Property: " + property.propertyName
                        );
                    }

                    propertyForm.reset();
                    window.location.href = "properties.html";

                } catch (error) {
                    console.error("Unable to save property:", error);
                    alert("Unable to save the property details. Please check your browser storage settings.");
                }
            })();
        });
    }

});
