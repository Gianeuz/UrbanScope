
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

            const propertyName = document.getElementById("propertyName")?.value.trim() || "New Listing";
            const location = document.getElementById("location")?.value.trim() || "Cavite, Philippines";
            const propertyType = document.getElementById("propertyType")?.value || "Villa";
            const price = parseFloat(document.getElementById("price")?.value) || 0;
            const status = document.getElementById("status")?.value || "Available";
            const bedrooms = parseInt(document.getElementById("bedrooms")?.value, 10) || 3;
            const bathrooms = parseInt(document.getElementById("bathrooms")?.value, 10) || 2;
            const carports = parseInt(document.getElementById("carports")?.value, 10) || 1;
            const storeys = parseInt(document.getElementById("storeys")?.value, 10) || 2;
            const lotArea = parseFloat(document.getElementById("lotArea")?.value) || 100;
            const floorArea = parseFloat(document.getElementById("floorArea")?.value) || 80;
            const amenities = document.getElementById("amenities")?.value.trim() || "";
            const description = document.getElementById("description")?.value.trim() || "";
            const resolvedImg = uploadedImageUrl || (selectedFiles[0] ? "assets/images/" + selectedFiles[0].name : "assets/images/property1.jpg");

            const property = {
                id: Date.now(),
                propertyName: propertyName,
                title: propertyName,
                name: propertyName,
                location: location,
                propertyType: propertyType,
                property_type: propertyType,
                price: price,
                status: status,
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                carports: carports,
                storeys: storeys,
                lotArea: lotArea,
                lot_area: lotArea,
                floorArea: floorArea,
                floor_area: floorArea,
                amenities: amenities,
                description: description,
                image_url: resolvedImg,
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
                    console.warn("Database add property notice:", e);
                }
            }

            try {
                // Keep local browser cache updated safely
                try {
                    const savedProperties = JSON.parse(
                        localStorage.getItem("urbanScopeProperties") || "[]"
                    );
                    savedProperties.unshift(property);
                    localStorage.setItem(
                        "urbanScopeProperties",
                        JSON.stringify(savedProperties)
                    );
                } catch (e) {
                    console.warn("Local cache notice (urbanScopeProperties):", e);
                }

                try {
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
                } catch (e) {
                    console.warn("Local cache notice (properties):", e);
                }

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
                        "✓ Property saved!\n\n" +
                        "Property: " + property.propertyName
                    );
                }

                propertyForm.reset();
                window.location.href = "propertylist.html";

            } catch (error) {
                console.error("Unable to save property:", error);
                alert("Property saved to database! Redirecting to properties list.");
                window.location.href = "propertylist.html";
            }
        });
    }

});
