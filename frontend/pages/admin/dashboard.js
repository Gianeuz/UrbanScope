/* ADMIN PROFILE DROPDOWN */

const profileButton = document.getElementById("profileButton");
const profileDropdown = document.getElementById("profileDropdown");
const profileAction = profileDropdown?.querySelector("[data-profile-action]");

function closeProfileDropdown() {
    if (!profileButton || !profileDropdown) return;

    profileDropdown.hidden = true;
    profileDropdown.classList.remove("show", "active");
    profileButton.setAttribute("aria-expanded", "false");
}

if (profileButton && profileDropdown) {
    profileDropdown.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");

    profileButton.addEventListener("click", event => {
        event.stopPropagation();

        const opening = profileDropdown.hidden;
        profileDropdown.hidden = !opening;
        profileDropdown.classList.toggle("show", opening);
        profileButton.setAttribute("aria-expanded", String(opening));
    });

    profileDropdown.addEventListener("click", event => {
        event.stopPropagation();

        const action = event.target.closest("[data-profile-action]");
        if (action) {
            event.preventDefault();
            closeProfileDropdown();
            alert("Profile settings are not available yet.");
        }
    });

    document.addEventListener("click", event => {
        if (!profileDropdown.contains(event.target) && !profileButton.contains(event.target)) {
            closeProfileDropdown();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeProfileDropdown();
    });
}

/* SIDEBAR */

const sidebar = document.getElementById("adminSidebar");
const backdrop = document.getElementById("sidebarBackdrop");
const toggleBtn = document.getElementById("sidebarToggle");
const closeBtn = document.getElementById("closeSidebarBtn");

function toggleSidebar(open) {
    if (!sidebar || !backdrop) return;

    sidebar.classList.toggle("open", open);
    backdrop.classList.toggle("active", open);

    document.body.classList.toggle("sidebar-open", open);
}

if (toggleBtn) {
    toggleBtn.addEventListener("click", () => toggleSidebar(true));
}

if (closeBtn) {
    closeBtn.addEventListener("click", () => toggleSidebar(false));
}

if (backdrop) {
    backdrop.addEventListener("click", () => toggleSidebar(false));
}

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        toggleSidebar(false);
    }
});

/* EXPANDABLE INQUIRIES MENU */

const inquiriesNavGroup = document.getElementById("inquiriesNavGroup");
const inquiriesToggle = document.getElementById("inquiriesToggle");

if (inquiriesToggle && inquiriesNavGroup) {
    inquiriesToggle.addEventListener("click", () => {
        const isOpen = inquiriesNavGroup.classList.toggle("open");

        inquiriesToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

/* PLACEHOLDER NAVIGATION */

document.querySelectorAll("[data-placeholder]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        alert(`${link.dataset.placeholder} is not available yet.`);
    });
});

/* CALENDAR */

const calendarDays = document.getElementById("calendarDays");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const calendarAgenda = document.getElementById("calendarAgenda");

const previousMonthBtn = document.getElementById("previousMonth");
const nextMonthBtn = document.getElementById("nextMonth");

let calendarDate = new Date(2026, 9, 1);
let selectedDate = "2026-10-10";

const sampleAppointments = {
    "2026-10-09": [
        {
            time: "10:00 AM",
            title: "Client viewing · Velmont Residences",
            description: "Sample appointment for a property viewing."
        }
    ],

    "2026-10-15": [
        {
            time: "2:00 PM",
            title: "Client viewing · Liora Homes",
            description: "Sample appointment for a property viewing."
        }
    ],

    "2026-10-22": [
        {
            time: "9:30 AM",
            title: "Client viewing · Victoria Park Residences",
            description: "Sample appointment for a property viewing."
        }
    ]
};

function formatDateKey(year, month, day) {
    return [
        year,
        String(month + 1).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");
}

function renderCalendar() {
    if (!calendarDays || !calendarMonthLabel) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    calendarMonthLabel.textContent = calendarDate.toLocaleDateString(
        "en-US",
        {
            month: "long",
            year: "numeric"
        }
    );

    calendarDays.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();

    const todayKey = formatDateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("span");

        emptyDay.className = "calendar-empty-day";
        emptyDay.setAttribute("aria-hidden", "true");

        calendarDays.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDateKey(year, month, day);

        const dayButton = document.createElement("button");

        dayButton.type = "button";
        dayButton.className = "calendar-day";
        dayButton.textContent = day;

        dayButton.setAttribute(
            "aria-label",
            new Date(year, month, day).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            })
        );

        if (dateKey === todayKey) {
            dayButton.classList.add("is-today");
        }

        if (dateKey === selectedDate) {
            dayButton.classList.add("is-selected");
            dayButton.setAttribute("aria-pressed", "true");
        } else {
            dayButton.setAttribute("aria-pressed", "false");
        }

        if (sampleAppointments[dateKey]?.length) {
            dayButton.classList.add("has-event");
            dayButton.title = "Scheduled property viewing";
        }

        dayButton.addEventListener("click", () => {
            selectedDate = dateKey;

            renderCalendar();
            renderAgenda();
        });

        calendarDays.appendChild(dayButton);
    }
}

function renderAgenda() {
    if (!calendarAgenda || !selectedDateLabel) return;

    const date = new Date(`${selectedDate}T12:00:00`);

    selectedDateLabel.textContent = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    const appointments = sampleAppointments[selectedDate] || [];

    if (appointments.length === 0) {
        calendarAgenda.innerHTML = `
            <div class="agenda-empty">
                <span class="agenda-empty-icon">✓</span>
                <strong>No scheduled viewings</strong>
                <p>There are no sample appointments for this date.</p>
            </div>
        `;

        return;
    }

    calendarAgenda.innerHTML = appointments.map(appointment => `
        <article class="agenda-event">
            <span class="agenda-event-time">
                ${escapeHTML(appointment.time)}
            </span>

            <strong>${escapeHTML(appointment.title)}</strong>

            <p>${escapeHTML(appointment.description)}</p>
        </article>
    `).join("");
}

if (previousMonthBtn) {
    previousMonthBtn.addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);

        renderCalendar();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);

        renderCalendar();
    });
}

/* HTML ESCAPING */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

/* INQUIRY STATUS COLORS */

function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (value.includes("complete")) {
        return "dark-green";
    }

    if (value.includes("approved")) {
        return "green";
    }

    if (value.includes("resubmission")) {
        return "gray";
    }

    if (value.includes("requirement")) {
        return "purple";
    }

    if (value.includes("pending") || value.includes("review")) {
        return "orange";
    }

    return "gray";
}

/* INQUIRY TABLE */

function renderInquiryRows(inquiries) {
    const tbody = document.getElementById("recentInquiriesBody");

    if (!tbody) return;

    if (!Array.isArray(inquiries) || inquiries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table-message">
                    No inquiries available.
                </td>
            </tr>
        `;

        updateInquiryEmptyState();

        return;
    }

    tbody.innerHTML = inquiries.slice(0, 5).map(inquiry => {
        const inquiryId = escapeHTML(
            inquiry.inquiry_id || `INQ-${inquiry.id ?? "N/A"}`
        );

        const clientName = escapeHTML(
            inquiry.client_name || "Client"
        );

        const propertyTitle = escapeHTML(
            inquiry.property_title || "General Inquiry"
        );

        const createdAt = inquiry.created_at
            ? new Date(inquiry.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            })
            : "Date unavailable";

        const status = escapeHTML(inquiry.status || "Pending");

        const statusClass = getStatusClass(inquiry.status);

        const message = escapeHTML(
            inquiry.message || "No inquiry message provided."
        );

        const phone = escapeHTML(
            inquiry.client_phone || "N/A"
        );

        const email = escapeHTML(
            inquiry.client_email || "N/A"
        );

        return `
            <tr>
                <td class="id-col">${inquiryId}</td>

                <td>${clientName}</td>

                <td>${propertyTitle}</td>

                <td>${escapeHTML(createdAt)}</td>

                <td>
                    <span class="status-pill ${statusClass}">
                        ${status}
                    </span>
                </td>

                <td>
                    <button
                        class="action-view-btn"
                        type="button"
                        data-inquiry-message="${message}"
                        data-inquiry-phone="${phone}"
                        data-inquiry-email="${email}"
                    >View</button>
                </td>
            </tr>
        `;
    }).join("");

    updateInquiryEmptyState();
}

document.addEventListener("click", event => {
    const button = event.target.closest(".action-view-btn");

    if (!button) return;

    const message = button.dataset.inquiryMessage || "No message available.";
    const phone = button.dataset.inquiryPhone;
    const email = button.dataset.inquiryEmail;

    if (phone || email) {
        alert(
            `Inquiry Details\n\n` +
            `Message: ${message}\n\n` +
            `Phone: ${phone || "N/A"}\n` +
            `Email: ${email || "N/A"}`
        );
    } else {
        alert(message);
    }
});

/* SEARCH */

const dashboardSearch = document.getElementById("dashboardSearch");

function updateInquiryEmptyState() {
    const tbody = document.getElementById("recentInquiriesBody");
    const emptyState = document.getElementById("inquiriesEmptyState");

    if (!tbody || !emptyState) return;

    const rows = [...tbody.querySelectorAll("tr")];

    const hasVisibleRows = rows.some(row => {
        return row.style.display !== "none" &&
            !row.querySelector(".empty-table-message");
    });

    emptyState.hidden = hasVisibleRows;
}

if (dashboardSearch) {
    dashboardSearch.addEventListener("input", () => {
        const query = dashboardSearch.value.trim().toLowerCase();

        const rows = document.querySelectorAll(
            "#recentInquiriesBody tr"
        );

        rows.forEach(row => {
            const matches = row.textContent.toLowerCase().includes(query);

            row.style.display = matches ? "" : "none";
        });

        updateInquiryEmptyState();
    });
}

/* SUPABASE DASHBOARD DATA */

async function loadDashboardData() {
    try {
        if (typeof apiGetInquiries === "function") {
            const inquiries = await apiGetInquiries();

            if (Array.isArray(inquiries)) {
                const totalInquiriesEl =
                    document.getElementById("kpiTotalInquiries");

                const pendingEl =
                    document.getElementById("kpiPendingInquiries");

                const completedEl =
                    document.getElementById("kpiCompletedInquiries");

                if (totalInquiriesEl) {
                    totalInquiriesEl.textContent = inquiries.length;
                }

                const pendingCount = inquiries.filter(inquiry => {
                    const status = String(inquiry.status || "").toLowerCase();

                    return status.includes("pending") ||
                        status.includes("review");
                }).length;

                const completedCount = inquiries.filter(inquiry => {
                    return String(inquiry.status || "")
                        .toLowerCase()
                        .includes("completed");
                }).length;

                if (pendingEl) {
                    pendingEl.textContent = pendingCount;
                }

                if (completedEl) {
                    completedEl.textContent = completedCount;
                }

                renderInquiryRows(inquiries);
            }
        }

        if (typeof apiGetProperties === "function") {
            const properties = await apiGetProperties();

            if (Array.isArray(properties)) {
                const propertyCountEl =
                    document.getElementById("kpiTotalProperties");

                const overviewCountEl =
                    document.getElementById("overviewPropertyCount");

                if (propertyCountEl) {
                    propertyCountEl.textContent = properties.length;
                }

                if (overviewCountEl) {
                    overviewCountEl.textContent = properties.length;
                }
            }
        if (typeof apiGetDashboardKPIs === "function") {
            const kpis = await apiGetDashboardKPIs();
            if (kpis && kpis.total_clients !== undefined) {
                const totalClientsEl = document.getElementById("kpiTotalClients");
                if (totalClientsEl) {
                    totalClientsEl.textContent = kpis.total_clients;
                }
            }
        }

        if (typeof apiGetAppointments === "function") {
            const appointmentsList = await apiGetAppointments();
            if (Array.isArray(appointmentsList) && appointmentsList.length > 0) {
                appointmentsList.forEach(apt => {
                    const dateKey = apt.appointment_date;
                    if (!sampleAppointments[dateKey]) {
                        sampleAppointments[dateKey] = [];
                    }
                    // Avoid duplicate
                    const exists = sampleAppointments[dateKey].some(a => a.title === apt.title);
                    if (!exists) {
                        sampleAppointments[dateKey].push({
                            time: apt.appointment_time,
                            title: apt.title,
                            description: apt.description || "Client property consultation & viewing walkthrough."
                        });
                    }
                });
                renderCalendar();
                renderAgenda();
            }
        }
    } catch (error) {
        console.error("Unable to load dashboard data:", error);
    }
}

/* INITIALIZE */

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    renderAgenda();

    loadDashboardData();
});
