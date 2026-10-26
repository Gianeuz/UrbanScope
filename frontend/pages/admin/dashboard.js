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
