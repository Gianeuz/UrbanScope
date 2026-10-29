/**
 * UrbanScope Admin Shell — Unified Sidebar, Topbar & Navigation Engine
 * Guarantees consistent sidebar behavior and active item styling across all admin pages.
 */

(function () {
    "use strict";

    function initAdminSidebar() {
        const sidebar = document.getElementById("adminSidebar");
        const backdrop = document.getElementById("sidebarBackdrop");
        const toggleBtn = document.getElementById("sidebarToggle");
        const closeBtn = document.getElementById("closeSidebarBtn");

        if (!sidebar) return;

        function openSidebar() {
            sidebar.classList.add("open");
            if (backdrop) {
                backdrop.classList.add("active");
                backdrop.classList.add("show");
            }
            document.body.classList.add("sidebar-open");
        }

        function closeSidebar() {
            sidebar.classList.remove("open");
            if (backdrop) {
                backdrop.classList.remove("active");
                backdrop.classList.remove("show");
            }
            document.body.classList.remove("sidebar-open");
        }

        if (toggleBtn) {
            // Remove any clone listeners
            toggleBtn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (sidebar.classList.contains("open")) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            };
        }

        if (closeBtn) {
            closeBtn.onclick = function (e) {
                e.preventDefault();
                closeSidebar();
            };
        }

        if (backdrop) {
            backdrop.onclick = function () {
                closeSidebar();
            };
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && sidebar.classList.contains("open")) {
                closeSidebar();
            }
        });
    }

    function initProfileDropdown() {
        const profileButton = document.getElementById("profileButton");
        const profileDropdown = document.getElementById("profileDropdown");

        if (!profileButton || !profileDropdown) return;

        function closeDropdown() {
            profileDropdown.hidden = true;
            profileDropdown.classList.remove("show", "active");
            profileButton.setAttribute("aria-expanded", "false");
        }

        // Always ensure dropdown is closed initially
        closeDropdown();

        function toggleDropdown(e) {
            e.stopPropagation();
            const isHidden = profileDropdown.hidden || !profileDropdown.classList.contains("show");
            if (isHidden) {
                profileDropdown.hidden = false;
                profileDropdown.classList.add("show");
                profileButton.setAttribute("aria-expanded", "true");
            } else {
                closeDropdown();
            }
        }

        profileButton.onclick = toggleDropdown;

        document.addEventListener("click", function (e) {
            if (!profileDropdown.contains(e.target) && !profileButton.contains(e.target)) {
                closeDropdown();
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeDropdown();
        });
    }

    function formatTimeAgo(dateInput) {
        if (!dateInput) return "Recently";
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return "Recently";
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 45) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    function getInquiryPageUrl() {
        const p = window.location.pathname || "";
        if (p.includes("/pages/admin/")) {
            return "clients.html?view=inquiries";
        } else if (p.includes("/pages/superadmin/")) {
            return "../admin/clients.html?view=inquiries";
        } else if (p.includes("/pages/")) {
            return "../admin/clients.html?view=inquiries";
        }
        return "pages/admin/clients.html?view=inquiries";
    }

    function buildNotificationItems(inquiries) {
        const items = [];

        if (Array.isArray(inquiries)) {
            inquiries.forEach((inq, index) => {
                const id = inq.id || (index + 1);
                const code = inq.inquiry_code || `INQ-2026-${String(id).padStart(3, '0')}`;
                const clientName = inq.client_name || inq.name || 'Client';
                const status = (inq.status || 'Under Review').trim();
                const date = inq.created_at || new Date().toISOString();
                const timeAgo = formatTimeAgo(date);

                const isApproved = status.toLowerCase() === 'approved';
                const isCompleted = status.toLowerCase() === 'completed';

                if (isApproved) {
                    items.push({
                        type: 'approved',
                        avatarClass: 'check',
                        avatarIcon: '✓',
                        title: `Inquiry ${code} approved`,
                        subtitle: `Client: ${clientName} &bull; ${timeAgo}`,
                        time: new Date(date).getTime(),
                        inquiryId: id
                    });
                } else if (isCompleted) {
                    items.push({
                        type: 'completed',
                        avatarClass: 'check',
                        avatarIcon: '✓',
                        title: `Inquiry ${code} completed`,
                        subtitle: `Client: ${clientName} &bull; ${timeAgo}`,
                        time: new Date(date).getTime(),
                        inquiryId: id
                    });
                } else {
                    items.push({
                        type: 'new_inquiry',
                        avatarClass: 'user',
                        avatarIcon: '👤',
                        title: `New inquiry submitted by ${clientName}`,
                        subtitle: `${code} &bull; ${timeAgo}`,
                        time: new Date(date).getTime(),
                        inquiryId: id
                    });
                }
            });
        }
        // Sort real inquiry notifications by most recent first
        items.sort((a, b) => (b.time || 0) - (a.time || 0));
        return items;
    }

    function renderNotifHtml(items) {
        if (!items || !items.length) {
            return '<div class="notif-empty">No notifications yet.</div>';
        }
        const targetUrl = getInquiryPageUrl();
        return items.slice(0, 5).map(item => `
            <a href="${targetUrl}" class="notif-item" role="menuitem">
                <div class="notif-avatar ${item.avatarClass}">
                    ${item.avatarIcon}
                </div>
                <div class="notif-text">
                    <strong>${item.title}</strong>
                    <small>${item.subtitle}</small>
                </div>
            </a>
        `).join('');
    }

    async function loadNotifications() {
        let inquiries = [];
        if (typeof window.apiGetInquiries === "function") {
            try {
                const res = await window.apiGetInquiries();
                if (Array.isArray(res)) inquiries = res;
            } catch (_) {}
        }
        if (!inquiries.length) {
            try {
                inquiries = JSON.parse(localStorage.getItem("inquiries") || "[]");
            } catch (_) {}
        }

        const items = buildNotificationItems(inquiries);
        const html = renderNotifHtml(items);

        const topbarList = document.getElementById("topbarNotifList");
        if (topbarList) topbarList.innerHTML = html;

        const dashList = document.getElementById("dashboardNotifList");
        if (dashList) dashList.innerHTML = html;

        // Update badges
        const badges = document.querySelectorAll(".notif-badge");
        badges.forEach(b => {
            b.textContent = items.length > 0 ? items.length : "0";
            b.style.display = items.length > 0 ? "flex" : "none";
        });
    }

    // Expose globally so other scripts can call it
    window.loadAdminNotifications = loadNotifications;
    window.buildNotificationItems = buildNotificationItems;

    function initNotificationDropdown() {
        const notifBtn = document.querySelector(".notif-btn");
        const topbarRight = document.querySelector(".topbar-right");
        if (!notifBtn || !topbarRight) return;

        notifBtn.id = notifBtn.id || "notifButton";
        notifBtn.setAttribute("aria-haspopup", "true");
        notifBtn.setAttribute("aria-expanded", "false");
        notifBtn.setAttribute("aria-controls", "notifDropdown");

        let notifDropdown = document.getElementById("notifDropdown");
        const targetUrl = getInquiryPageUrl();

        if (!notifDropdown) {
            notifDropdown = document.createElement("div");
            notifDropdown.className = "notif-dropdown";
            notifDropdown.id = "notifDropdown";
            notifDropdown.setAttribute("role", "menu");
            notifDropdown.hidden = true;
            notifDropdown.innerHTML = `
                <div class="notif-dropdown-header">
                    <div class="notif-header-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <h3>Recent Notifications</h3>
                    </div>
                    <a href="${targetUrl}" class="view-all-link">View All</a>
                </div>
                <div class="notif-list" id="topbarNotifList">
                    <div class="notif-empty">Loading notifications...</div>
                </div>
            `;
            topbarRight.appendChild(notifDropdown);
        }

        function closeNotif() {
            notifDropdown.hidden = true;
            notifDropdown.classList.remove("show", "active");
            notifBtn.setAttribute("aria-expanded", "false");
        }

        closeNotif();

        function toggleNotif(e) {
            e.preventDefault();
            e.stopPropagation();

            // Close profile dropdown if open
            const profileDropdown = document.getElementById("profileDropdown");
            if (profileDropdown) {
                profileDropdown.hidden = true;
                profileDropdown.classList.remove("show", "active");
                const profileBtn = document.getElementById("profileButton");
                if (profileBtn) profileBtn.setAttribute("aria-expanded", "false");
            }

            const isHidden = notifDropdown.hidden || !notifDropdown.classList.contains("show");
            if (isHidden) {
                notifDropdown.hidden = false;
                notifDropdown.classList.add("show");
                notifBtn.setAttribute("aria-expanded", "true");
            } else {
                closeNotif();
            }
        }

        notifBtn.onclick = toggleNotif;

        // When profile button is clicked, close notifDropdown
        const profileBtn = document.getElementById("profileButton");
        if (profileBtn) {
            const originalProfileClick = profileBtn.onclick;
            profileBtn.onclick = function (e) {
                closeNotif();
                if (typeof originalProfileClick === "function") {
                    originalProfileClick.call(this, e);
                }
            };
        }

        document.addEventListener("click", function (e) {
            if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                closeNotif();
            }
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeNotif();
        });

        loadNotifications();
        setInterval(loadNotifications, 25000);
        window.addEventListener("inquirySubmitted", () => loadNotifications());
        window.addEventListener("storage", e => {
            if (e.key === "inquiries") loadNotifications();
        });
    }

    function updateActiveSidebarItem() {
        const path = (window.location.pathname || "").toLowerCase();
        const search = (window.location.search || "").toLowerCase();
        const navItems = document.querySelectorAll(".admin-sidebar .nav-item");

        if (!navItems.length) return;

        let activeSection = "home";
        if (path.includes("dashboard.html") || path.endsWith("/admin/")) {
            activeSection = "home";
        } else if (
            path.includes("propertylist.html") ||
            path.includes("properties.html") ||
            path.includes("add-property.html") ||
            path.includes("addproperty.html") ||
            path.includes("edit-property.html")
        ) {
            activeSection = "properties";
        } else if (path.includes("clients.html")) {
            if (search.includes("view=inquiries") || search.includes("status=")) {
                activeSection = "inquiries";
            } else {
                activeSection = "clients";
            }
        } else if (path.includes("profile.html")) {
            activeSection = "settings";
        }

        navItems.forEach(item => {
            const label = (item.querySelector("span")?.textContent || item.textContent || "").trim().toLowerCase();
            const href = (item.getAttribute("href") || "").toLowerCase();

            let match = false;
            if ((activeSection === "home" || activeSection === "dashboard") && (label === "home" || label === "dashboard" || href.includes("dashboard.html"))) {
                match = true;
            } else if (activeSection === "properties" && (label === "properties" || href.includes("propertylist.html"))) {
                match = true;
            } else if (activeSection === "clients" && label === "clients" && !href.includes("view=inquiries")) {
                match = true;
            } else if (activeSection === "inquiries" && (label === "inquiries" || href.includes("view=inquiries"))) {
                match = true;
            } else if (activeSection === "settings" && (label === "settings" || href.includes("profile.html"))) {
                match = true;
            }

            if (match) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });
    }

    // Initialize on DOM Ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            initAdminSidebar();
            initProfileDropdown();
            initNotificationDropdown();
            updateActiveSidebarItem();
        });
    } else {
        initAdminSidebar();
        initProfileDropdown();
        initNotificationDropdown();
        updateActiveSidebarItem();
    }
})();
