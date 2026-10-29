/* PROFILE DROPDOWN & SIDEBAR ARE HANDLED BY ADMIN-SHELL.JS */

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

/* INQUIRY STATUS DONUT & NOTIFICATIONS */

function updateInquiryDonut(inquiries) {
    if (!Array.isArray(inquiries)) return;

    let submitted = 0;
    let reqSubmitted = 0;
    let underReview = 0;
    let approved = 0;
    let completed = 0;

    inquiries.forEach(i => {
        const s = (i.status || '').toLowerCase();
        if (s.includes('require')) reqSubmitted++;
        else if (s.includes('submit')) submitted++;
        else if (s.includes('review') || s.includes('pending')) underReview++;
        else if (s.includes('approv')) approved++;
        else if (s.includes('complete')) completed++;
        else underReview++;
    });

    const total = inquiries.length;
    const totalEl = document.getElementById('donutTotalInquiries');
    if (totalEl) totalEl.textContent = total;

    const lSub = document.getElementById('legendSubmittedCount');
    if (lSub) lSub.textContent = submitted;
    const lReq = document.getElementById('legendReqCount');
    if (lReq) lReq.textContent = reqSubmitted;
    const lRev = document.getElementById('legendReviewCount');
    if (lRev) lRev.textContent = underReview;
    const lApp = document.getElementById('legendApprovedCount');
    if (lApp) lApp.textContent = approved;
    const lComp = document.getElementById('legendCompletedCount');
    if (lComp) lComp.textContent = completed;

    const C = 377; // 2 * PI * 60
    const safeTotal = total > 0 ? total : 1;

    let offset = 0;
    const setSlice = (id, count) => {
        const el = document.getElementById(id);
        if (!el) return;
        const len = (count / safeTotal) * C;
        el.setAttribute('stroke-dasharray', `${len} ${C}`);
        el.setAttribute('stroke-dashoffset', `-${offset}`);
        offset += len;
    };

    setSlice('donutSubmitted', submitted);
    setSlice('donutReqSubmitted', reqSubmitted);
    setSlice('donutUnderReview', underReview);
    setSlice('donutApproved', approved);
    setSlice('donutCompleted', completed);
}

/* INQUIRY TABLE */

function renderInquiryRows(inquiries) {
    const tbody = document.getElementById("recentInquiriesBody") || document.getElementById("recentInquiryRows");

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
            inquiry.message || inquiry.notes || "No inquiry message provided."
        );

        const phone = escapeHTML(
            inquiry.client_phone || inquiry.phone || inquiry.contact_number || "N/A"
        );

        const email = escapeHTML(
            inquiry.client_email || inquiry.email || "N/A"
        );

        const scheduleDate = escapeHTML(
            inquiry.schedule_date || inquiry.preferred_date || ""
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
                        data-inquiry-id="${inquiryId}"
                        data-client-name="${clientName}"
                        data-property-title="${propertyTitle}"
                        data-created-at="${escapeHTML(createdAt)}"
                        data-status="${status}"
                        data-status-class="${statusClass}"
                        data-inquiry-phone="${phone}"
                        data-inquiry-email="${email}"
                        data-inquiry-message="${message}"
                        data-schedule-date="${scheduleDate}"
                        aria-label="View inquiry from ${clientName}"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        <span>View</span>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    updateInquiryEmptyState();
}

/* INQUIRY DETAILS MODAL UI */

function openInquiryModal(data) {
    const modal = document.getElementById("inquiryModal");
    const modalContent = document.getElementById("modalContent");
    if (!modal || !modalContent) return;

    const clientName = data.clientName || "Client";
    const inquiryId = data.inquiryId || "INQ-N/A";
    const propertyTitle = data.propertyTitle || "General Inquiry";
    const createdAt = data.createdAt || "Recent";
    const status = data.status || "Pending";
    const statusClass = data.statusClass || "gray";
    const phone = (data.inquiryPhone && data.inquiryPhone !== "N/A") ? data.inquiryPhone : "";
    const email = (data.inquiryEmail && data.inquiryEmail !== "N/A") ? data.inquiryEmail : "";
    const message = data.inquiryMessage || "No inquiry message provided.";
    const scheduleDate = (data.scheduleDate && data.scheduleDate !== "N/A") ? data.scheduleDate : "";

    const initials = clientName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("") || "CL";

    modalContent.innerHTML = `
        <div class="inquiry-modal-detail">
            <!-- Client Banner -->
            <div class="inquiry-client-banner">
                <div class="inquiry-client-info">
                    <div class="inquiry-avatar-pill" aria-hidden="true">${escapeHTML(initials)}</div>
                    <div>
                        <h4 class="inquiry-client-name">${escapeHTML(clientName)}</h4>
                        <span class="inquiry-submitted-date">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Submitted: ${escapeHTML(createdAt)}
                        </span>
                    </div>
                </div>
                <div class="inquiry-banner-meta">
                    <span class="status-pill ${escapeHTML(statusClass)}">${escapeHTML(status)}</span>
                    <span class="inquiry-id-tag">${escapeHTML(inquiryId)}</span>
                </div>
            </div>

            <!-- Details Grid -->
            <div class="inquiry-info-grid">
                <div class="info-grid-card">
                    <span class="info-label">Email Address</span>
                    ${email ? `
                        <a href="mailto:${escapeHTML(email)}" class="info-value info-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <span>${escapeHTML(email)}</span>
                        </a>
                    ` : `<span class="info-value muted">Not provided</span>`}
                </div>

                <div class="info-grid-card">
                    <span class="info-label">Phone Number</span>
                    ${phone ? `
                        <a href="tel:${escapeHTML(phone)}" class="info-value info-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span>${escapeHTML(phone)}</span>
                        </a>
                    ` : `<span class="info-value muted">Not provided</span>`}
                </div>

                <div class="info-grid-card">
                    <span class="info-label">Property Interested</span>
                    <div class="info-value">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span>${escapeHTML(propertyTitle)}</span>
                    </div>
                </div>

                <div class="info-grid-card">
                    <span class="info-label">Preferred Schedule</span>
                    <div class="info-value">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>${escapeHTML(scheduleDate || "No schedule requested")}</span>
                    </div>
                </div>
            </div>

            <!-- Message Box -->
            <div class="inquiry-message-section">
                <span class="info-label">Message / Client Request</span>
                <div class="inquiry-message-box">${escapeHTML(message)}</div>
            </div>

            <!-- Footer Actions -->
            <div class="modal-actions-footer">
                <button type="button" class="btn-modal-secondary btn-close-modal" id="modalCloseActionBtn">
                    Close
                </button>
                ${email ? `
                    <a href="mailto:${encodeURIComponent(email)}?subject=Re:%20Inquiry%20regarding%20${encodeURIComponent(propertyTitle)}" class="btn-modal-primary" target="_blank" rel="noopener">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                        <span>Reply via Email</span>
                    </a>
                ` : `
                    <a href="clients.html?view=inquiries" class="btn-modal-primary">
                        <span>Open in Clients &rarr;</span>
                    </a>
                `}
            </div>
        </div>
    `;

    modal.hidden = false;
    // Force layout recalculation for smooth CSS animation
    void modal.offsetWidth;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeInquiryModal() {
    const modal = document.getElementById("inquiryModal");
    if (!modal) return;
    modal.classList.remove("open");
    setTimeout(() => {
        if (!modal.classList.contains("open")) {
            modal.hidden = true;
        }
    }, 220);
    document.body.style.overflow = "";
}

document.addEventListener("click", event => {
    const viewButton = event.target.closest(".action-view-btn");
    if (viewButton) {
        event.preventDefault();
        openInquiryModal(viewButton.dataset);
        return;
    }

    const closeBtn = event.target.closest("#closeModalBtn, #modalCloseActionBtn, .btn-close-modal");
    if (closeBtn) {
        event.preventDefault();
        closeInquiryModal();
        return;
    }

    const modal = document.getElementById("inquiryModal");
    if (modal && event.target === modal) {
        closeInquiryModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        const modal = document.getElementById("inquiryModal");
        if (modal && modal.classList.contains("open")) {
            closeInquiryModal();
        }
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

function hydrateDashboardKPIs() {
    try {
        const cached = JSON.parse(localStorage.getItem("urbanscope_dashboard_kpis") || "null");
        if (cached) {
            if (cached.totalProperties != null) {
                const el = document.getElementById("kpiTotalProperties");
                if (el) el.textContent = cached.totalProperties;
                const ov = document.getElementById("overviewPropertyCount");
                if (ov) ov.textContent = cached.totalProperties;
            }
            if (cached.totalClients != null) {
                const el = document.getElementById("kpiTotalClients");
                if (el) el.textContent = cached.totalClients;
            }
            if (cached.totalInquiries != null) {
                const el = document.getElementById("kpiTotalInquiries");
                if (el) el.textContent = cached.totalInquiries;
            }
            if (cached.pendingInquiries != null) {
                const el = document.getElementById("kpiPendingInquiries");
                if (el) el.textContent = cached.pendingInquiries;
            }
            if (cached.completedInquiries != null) {
                const el = document.getElementById("kpiCompletedInquiries");
                if (el) el.textContent = cached.completedInquiries;
            }
        }
    } catch (_) {}
}

async function loadDashboardData() {
    try {
        hydrateDashboardKPIs();

        const [inquiriesRes, propertiesRes, kpisRes, usersRes] = await Promise.allSettled([
            (typeof apiGetInquiries === "function") ? apiGetInquiries() : Promise.resolve(null),
            (typeof apiGetProperties === "function") ? apiGetProperties() : Promise.resolve(null),
            (typeof apiGetDashboardKPIs === "function") ? apiGetDashboardKPIs() : Promise.resolve(null),
            (typeof apiGetUsers === "function") ? apiGetUsers() : Promise.resolve(null)
        ]);

        let inquiries = [];
        if (inquiriesRes.status === "fulfilled" && Array.isArray(inquiriesRes.value)) {
            inquiries = inquiriesRes.value;
        } else {
            inquiries = JSON.parse(localStorage.getItem("inquiries") || "[]");
        }

        let properties = [];
        if (propertiesRes.status === "fulfilled" && Array.isArray(propertiesRes.value)) {
            properties = propertiesRes.value;
        } else {
            properties = JSON.parse(localStorage.getItem("properties") || localStorage.getItem("cached_live_properties") || "[]");
        }

        let kpis = null;
        if (kpisRes.status === "fulfilled" && kpisRes.value) {
            kpis = kpisRes.value;
        }

        let users = [];
        if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) {
            users = usersRes.value;
        }

        // Metrics computation
        const totalInquiriesCount = inquiries.length;
        const pendingCount = inquiries.filter(inquiry => {
            const status = String(inquiry.status || "").toLowerCase();
            return status.includes("pending") || status.includes("review");
        }).length;

        const completedCount = inquiries.filter(inquiry => {
            return String(inquiry.status || "").toLowerCase().includes("completed");
        }).length;

        const totalPropertiesCount = properties.length;

        let totalClientsCount = 0;
        if (kpis && kpis.total_clients != null) {
            totalClientsCount = kpis.total_clients;
        } else if (users && users.length > 0) {
            totalClientsCount = users.filter(u => {
                const r = String(u.role || "client").toLowerCase();
                return r === "client" || r === "user";
            }).length;
        }

        // Update DOM elements
        const totalInquiriesEl = document.getElementById("kpiTotalInquiries");
        const pendingEl = document.getElementById("kpiPendingInquiries");
        const completedEl = document.getElementById("kpiCompletedInquiries");
        const propertyCountEl = document.getElementById("kpiTotalProperties");
        const overviewCountEl = document.getElementById("overviewPropertyCount");
        const totalClientsEl = document.getElementById("kpiTotalClients");

        if (totalInquiriesEl) totalInquiriesEl.textContent = totalInquiriesCount;
        if (pendingEl) pendingEl.textContent = pendingCount;
        if (completedEl) completedEl.textContent = completedCount;
        if (propertyCountEl) propertyCountEl.textContent = totalPropertiesCount;
        if (overviewCountEl) overviewCountEl.textContent = totalPropertiesCount;
        if (totalClientsEl) totalClientsEl.textContent = totalClientsCount;

        // Persist fresh numbers to cache to guarantee 0-flick on all subsequent visits
        try {
            localStorage.setItem("urbanscope_dashboard_kpis", JSON.stringify({
                totalProperties: totalPropertiesCount,
                totalClients: totalClientsCount,
                totalInquiries: totalInquiriesCount,
                pendingInquiries: pendingCount,
                completedInquiries: completedCount
            }));
        } catch (_) {}

        renderInquiryRows(inquiries);
        updateInquiryDonut(inquiries);
        renderDashboardProperties(properties);

        if (typeof window.loadAdminNotifications === "function") {
            window.loadAdminNotifications();
        }

        if (typeof apiGetAppointments === "function") {
            const appointmentsList = await apiGetAppointments();
            if (Array.isArray(appointmentsList) && appointmentsList.length > 0) {
                appointmentsList.forEach(apt => {
                    const dateKey = apt.appointment_date;
                    if (!sampleAppointments[dateKey]) {
                        sampleAppointments[dateKey] = [];
                    }
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

function renderDashboardProperties(list) {
    const tbody = document.getElementById("dashboardPropertyTableBody");
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px; color:#6b7f70;">No property records found. Click "+ Add Property" to create one.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => {
        const title = p.title || p.propertyName || "Listing";
        const type = p.property_type || "—";
        const loc = p.location || "—";
        const price = p.price ? "₱" + Number(p.price).toLocaleString() : "—";
        const rawStatus = (p.status || "Available").trim();
        const isSold = rawStatus.toLowerCase() === 'sold' || rawStatus.toLowerCase() === 'sold out';
        const displayStatus = isSold ? 'Sold' : 'Available';

        const imgSrc = p.image_url ? 
            (p.image_url.startsWith('http') || p.image_url.startsWith('data:') ? p.image_url : '../../' + p.image_url.replace(/^(\.\.\/)+/, '')) : 
            '../../assets/images/property1.jpg';

        return `
        <tr style="${isSold ? 'background:#fcfdfc;' : ''}">
            <td>
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${imgSrc}" alt="${title}" style="width:44px; height:44px; border-radius:6px; object-fit:cover; ${isSold ? 'filter:grayscale(1); opacity:0.8;' : ''}" onerror="this.src='../../assets/images/property1.jpg'">
                    <div>
                        <strong style="${isSold ? 'color:#64748b;' : 'color:#1b2e21;'} font-size:0.92rem;">${title}</strong><br>
                        <small style="color:#6b7f70;">ID #${p.id}</small>
                    </div>
                </div>
            </td>
            <td style="color:#2d3748; font-size:0.9rem;">${loc}</td>
            <td><span style="padding:4px 9px; border-radius:4px; background:#eef5ef; color:#1a3b23; font-size:0.8rem; font-weight:600;">${type}</span></td>
            <td style="font-weight:700; color:#1b2e21;">${price}</td>
            <td>
                <span style="padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:5px; ${isSold ? 'background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;' : 'background:#dcfce7; color:#15803d; border:1px solid #bbf7d0;'}">
                    <span style="width:6px; height:6px; border-radius:50%; background:${isSold ? '#ef4444' : '#22c55e'}; display:inline-block;"></span>
                    ${displayStatus}
                </span>
            </td>
            <td>
                <div style="display:flex; gap:8px; align-items:center;">
                    <a href="../properties/property-detail.html?id=${p.id}" target="_blank" style="padding:5px 12px; border-radius:4px; background:#eef5ef; color:#1a3b23; text-decoration:none; font-size:0.82rem; font-weight:600;">View</a>
                    <button type="button" onclick="togglePropertyStatus(${p.id}, '${displayStatus}')" style="padding:5px 12px; border-radius:4px; cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.2s; ${isSold ? 'background:#dcfce7; color:#15803d; border:1px solid #86efac;' : 'background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;'}">
                        ${isSold ? 'Mark Available' : 'Mark as Sold'}
                    </button>
                    <button type="button" onclick="deletePropertyListing(${p.id}, '${title.replace(/'/g, "\\'")}')" style="padding:5px 12px; border-radius:4px; cursor:pointer; font-size:0.82rem; font-weight:600; transition:all 0.2s; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

window.togglePropertyStatus = async function(id, currentStatus) {
    const isCurrentlySold = (currentStatus || '').toLowerCase() === 'sold' || (currentStatus || '').toLowerCase() === 'sold out';
    const newStatus = isCurrentlySold ? 'Available' : 'Sold';

    try {
        if (typeof apiUpdateProperty === 'function') {
            await apiUpdateProperty(id, { status: newStatus });
        } else {
            ['properties', 'cached_live_properties', 'urbanScopeProperties'].forEach(key => {
                const list = JSON.parse(localStorage.getItem(key) || '[]');
                const idx = list.findIndex(p => String(p.id) === String(id));
                if (idx !== -1) {
                    list[idx].status = newStatus;
                    localStorage.setItem(key, JSON.stringify(list));
                }
            });
        }
        await loadDashboardData();
    } catch (err) {
        console.error("Dashboard toggle status error:", err);
        alert("Failed to update property status. Please check your connection.");
    }
};

window.deletePropertyListing = async function(id, title) {
    const propTitle = title || 'this property';
    if (!confirm(`Are you sure you want to permanently delete "${propTitle}"?\n\nThis will remove it from the catalog and database.`)) {
        return;
    }

    try {
        let success = false;
        if (typeof apiDeleteProperty === 'function') {
            success = await apiDeleteProperty(id);
        } else {
            ['properties', 'cached_live_properties', 'urbanScopeProperties'].forEach(key => {
                const list = JSON.parse(localStorage.getItem(key) || '[]');
                const filtered = list.filter(p => String(p.id) !== String(id));
                localStorage.setItem(key, JSON.stringify(filtered));
            });
            success = true;
        }

        if (success) {
            await loadDashboardData();
        } else {
            alert("Could not delete property. Please verify your admin session.");
        }
    } catch (err) {
        console.error("Dashboard delete property error:", err);
        alert("Failed to delete property: " + (err.message || "Unknown error"));
    }
};

/* INITIALIZE */

document.addEventListener("DOMContentLoaded", () => {
    renderCalendar();
    renderAgenda();
    loadDashboardData();

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
});
