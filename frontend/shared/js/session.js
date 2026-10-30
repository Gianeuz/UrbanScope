/**
 * UrbanScope - Session & Access Control
 * ==========================================================
 * - The public site (home, properties, details) is open to everyone.
 * - Any link to inquiry sends visitors who are not logged in to
 *   pages/auth/login.html (they return to their target page afterwards).
 * - Logged-in users see their profile (avatar + name + menu) in the navbar.
 *
 * Load AFTER shared/js/supabase.js. Works with Supabase auth, and falls
 * back to a local demo session if Supabase is not configured.
 */
(function () {
    // Restrict administrators and superadmin:
    // They are restricted strictly to the admin portal and must not access the public home page or catalog.
    try {
        var rawUser = localStorage.getItem('adminUser') || localStorage.getItem('urbanscope_user');
        if (rawUser) {
            var parsed = JSON.parse(rawUser);
            var role = (parsed.role || '').toLowerCase();
            var email = (parsed.email || '').toLowerCase().trim();
            var isSuperadmin = (role === 'superadmin' || email === 'urbanscope.cvsu@gmail.com');
            var isAdmin = (role === 'admin' || email === 'admin.realestate@gmail.com');
            
            var path = location.pathname.toLowerCase().replace(/\\/g, '/');
            var inAdmin = path.includes('/pages/admin/') || path.includes('/pages/superadmin/');
            var inAuth = path.includes('/pages/auth/');
            
            if (!inAdmin && !inAuth && (isSuperadmin || isAdmin)) {
                var p = location.pathname.replace(/\\/g, '/');
                var basePath = p.indexOf('/pages/') !== -1 ? '../../' : './';
                var target = isSuperadmin ? (basePath + 'pages/superadmin/dashboard.html') : (basePath + 'pages/admin/dashboard.html');
                location.replace(target);
                return;
            }
        }
    } catch (e) {}

    var DEMO_USER_KEY = 'urbanscope_demo_user';
    var root = document.documentElement;
    var requiresAuth = root.hasAttribute('data-require-auth');
    var currentUser = null;
    var resolved = false;

    root.classList.add('auth-pending');
    if (requiresAuth) root.classList.add('auth-checking');

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function initials(name) {
        var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'U';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function usingSupabase() {
        return typeof isSupabaseConfigured === 'function' && isSupabaseConfigured();
    }

    // Every section page lives at frontend/pages/<section>/<file>.html,
    // so it is two folders below the frontend root (index.html).
    function getBasePath() {
        var p = location.pathname.replace(/\\/g, '/');
        return p.indexOf('/pages/') !== -1 ? '../../' : './';
    }

    // Turns any link (relative or absolute) into a path relative to the
    // frontend root, e.g. 'pages/properties/property-detail.html?id=3'.
    function rootRelative(href) {
        try {
            var rootPath = new URL(getBasePath(), location.href).pathname;
            var u = new URL(href || location.href, location.href);
            var path = u.pathname;
            if (path.indexOf(rootPath) === 0) path = path.slice(rootPath.length);
            return (path || 'index.html') + u.search;
        } catch (e) {
            return 'index.html';
        }
    }

    function currentPage() {
        return rootRelative(location.href);
    }

    function loginUrl(next, reason) {
        var base = getBasePath();
        var url = base + 'pages/auth/login.html?redirect=' + encodeURIComponent(next || 'index.html');
        if (reason) url += '&reason=' + encodeURIComponent(reason);
        return url;
    }

    // ------------------------------------------------------------------
    // Session lookup
    // ------------------------------------------------------------------
    async function getUser() {
        try {
            if (usingSupabase() && typeof apiGetCurrentUser === 'function') {
                var u = await apiGetCurrentUser();
                if (!u) return null;
                var meta = u.user_metadata || {};
                return {
                    name: meta.full_name || u.full_name || u.name || (u.email || 'User').split('@')[0],
                    email: u.email || '',
                    phone: meta.phone || u.phone || '',
                    role: u.role || 'user',
                    avatar_url: u.avatar_url || meta.avatar_url || ''
                };
            }
        } catch (err) {
            console.error('Session lookup failed:', err);
        }
        try {
            return JSON.parse(localStorage.getItem(DEMO_USER_KEY));
        } catch (e) {
            return null;
        }
    }

    function hasCustomClientAvatar(user) {
        var url = String((user && user.avatar_url) || '').trim();
        return /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
    }

    function avatarInnerHtml(user) {
        var init = esc(initials(user.name));
        if (hasCustomClientAvatar(user)) {
            return '<img src="' + esc(user.avatar_url) + '" alt="' + init + '" referrerpolicy="no-referrer" data-fallback-initials="' + init + '">';
        }
        return init;
    }

    function wireAvatarFallbacks(container) {
        if (!container) return;
        container.querySelectorAll('.profile-avatar img[data-fallback-initials]').forEach(function (img) {
            img.addEventListener('error', function () {
                var parent = img.parentElement;
                if (parent) parent.textContent = img.getAttribute('data-fallback-initials') || 'U';
            }, { once: true });
        });
    }

    async function logout() {
        try {
            if (usingSupabase() && typeof apiSignOut === 'function') await apiSignOut();
        } catch (err) { console.error(err); }
        try { localStorage.removeItem(DEMO_USER_KEY); } catch (e) {}
        location.href = getBasePath() + 'index.html';
    }

    // ------------------------------------------------------------------
    // UI: dropdown + profile chip
    // ------------------------------------------------------------------
    function dropdownHtml(user) {
        var base = getBasePath();
        return '' +
            '<div class="profile-dropdown" role="menu">' +
                '<div class="profile-dropdown-head">' +
                    '<span class="profile-avatar">' + avatarInnerHtml(user) + '</span>' +
                    '<div><strong>' + esc(user.name) + '</strong><small>' + esc(user.email) + '</small></div>' +
                '</div>' +
                '<a href="' + base + 'index.html" role="menuitem">Home</a>' +
                '<a href="' + base + 'pages/inquiry/inquiry.html" role="menuitem">Submit an Inquiry</a>' +
                '<a href="' + base + 'pages/inquiry/history.html" role="menuitem">Inquiry History</a>' +
                '<button type="button" class="signout-item" role="menuitem" data-action="signout">Sign Out</button>' +
            '</div>';
    }

    function renderNavProfile(user) {
        var path = location.pathname.toLowerCase().replace(/\\/g, '/');
        var inAdmin = path.includes('/pages/admin/') || path.includes('/pages/superadmin/');
        if (inAdmin) return;

        var acts = document.querySelector('.navbar .nav-acts, .inquiry-topbar .nav-acts, .history-topbar .nav-acts, .nav-acts');
        if (acts) {
            ['loginBtn', 'signupBtn'].forEach(function (id) {
                var b = document.getElementById(id);
                if (b) b.remove();
            });
            var oldMenu = acts.querySelector('#profileMenu');
            if (oldMenu) oldMenu.remove();

            var oldNotif = acts.querySelector('.notif-btn');
            if (oldNotif) oldNotif.remove();

            var oldBadge = acts.querySelector('.user-profile-badge');
            if (oldBadge) oldBadge.remove();

            var wrap = document.createElement('div');
            wrap.className = 'profile-menu';
            wrap.id = 'profileMenu';
            wrap.innerHTML =
                '<button type="button" class="profile-chip" id="profileChip" aria-haspopup="true" aria-expanded="false">' +
                    '<span class="profile-avatar">' + avatarInnerHtml(user) + '</span>' +
                    '<span class="profile-name">' + esc(user.name.split(' ')[0]) + '</span>' +
                    '<svg class="profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
                '</button>' + dropdownHtml(user);
            wireAvatarFallbacks(wrap);
            acts.appendChild(wrap);
            wrap.querySelector('#profileChip').addEventListener('click', function (e) {
                e.stopPropagation();
                var open = wrap.classList.toggle('open');
                this.setAttribute('aria-expanded', open);
            });
        }
    }

    function prefillInquiryForm(user) {
        var map = { clientName: user.name, clientEmail: user.email, clientPhone: user.phone };
        Object.keys(map).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = map[id] || '';
        });
    }

    // ------------------------------------------------------------------
    // UI: Mobile Navigation Drawer
    // ------------------------------------------------------------------
    function initMobileNav(user) {
        var path = location.pathname.toLowerCase().replace(/\\/g, '/');
        var inAdmin = path.includes('/pages/admin/') || path.includes('/pages/superadmin/');
        if (inAdmin) return;

        var navbar = document.querySelector('.navbar');
        var nav = document.getElementById('mainNav');
        if (!navbar || !nav) return;

        var acts = navbar.querySelector('.nav-acts');
        var toggle = document.getElementById('mobileNavToggle');
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.className = 'mobile-nav-toggle';
            toggle.id = 'mobileNavToggle';
            toggle.type = 'button';
            toggle.setAttribute('aria-label', 'Toggle navigation menu');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML =
                '<span class="hamburger-line"></span>' +
                '<span class="hamburger-line"></span>' +
                '<span class="hamburger-line"></span>';
            if (acts) acts.appendChild(toggle);
            else navbar.appendChild(toggle);
        }

        var backdrop = document.querySelector('.mobile-nav-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'mobile-nav-backdrop';
            document.body.appendChild(backdrop);
        }

        // Render mobile auth/user drawer section
        var existingAuth = nav.querySelector('.mobile-drawer-auth, .mobile-drawer-user');
        if (existingAuth) existingAuth.remove();

        var base = getBasePath();
        if (user) {
            var userSection = document.createElement('div');
            userSection.className = 'mobile-drawer-user';
            userSection.innerHTML =
                '<div class="mobile-user-info">' +
                    '<span class="profile-avatar" style="width:30px;height:30px;font-size:0.75rem;">' + avatarInnerHtml(user) + '</span>' +
                    '<span>' + esc(user.name) + '</span>' +
                '</div>' +
                '<a href="' + base + 'pages/inquiry/history.html" class="m-inquiry-link" style="display:block;padding:8px 0;color:#1e5c33;font-weight:600;text-decoration:none;">Inquiry History</a>' +
                '<button type="button" class="m-signout-btn" data-action="signout">Sign Out</button>';
            wireAvatarFallbacks(userSection);
            nav.appendChild(userSection);
        } else {
            var authSection = document.createElement('div');
            authSection.className = 'mobile-drawer-auth';
            authSection.innerHTML =
                '<a href="' + base + 'pages/auth/login.html" class="m-login-btn">Log In</a>' +
                '<a href="' + base + 'pages/auth/register.html" class="m-signup-btn">Sign Up</a>';
            nav.appendChild(authSection);
        }

        function setMenuOpen(open) {
            nav.classList.toggle('mobile-open', open);
            toggle.classList.toggle('active', open);
            toggle.setAttribute('aria-expanded', String(open));
            backdrop.classList.toggle('active', open);
            document.body.classList.toggle('nav-locked', open);
        }

        toggle.onclick = function (e) {
            e.stopPropagation();
            setMenuOpen(!nav.classList.contains('mobile-open'));
        };

        backdrop.onclick = function () {
            setMenuOpen(false);
        };

        nav.onclick = function (e) {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && nav.classList.contains('mobile-open')) {
                setMenuOpen(false);
            }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 768 && nav.classList.contains('mobile-open')) {
                setMenuOpen(false);
            }
        });
    }

    // ------------------------------------------------------------------
    // Init
    // ------------------------------------------------------------------
    async function init() {
        currentUser = await getUser();
        resolved = true;

        if (currentUser) {
            var role = (currentUser.role || '').toLowerCase();
            var email = (currentUser.email || '').toLowerCase().trim();
            var isSuperadmin = (role === 'superadmin' || email === 'urbanscope.cvsu@gmail.com');
            var isAdmin = (role === 'admin' || email === 'admin.realestate@gmail.com');
            var path = location.pathname.toLowerCase().replace(/\\/g, '/');
            var inAdmin = path.includes('/pages/admin/') || path.includes('/pages/superadmin/');
            var inAuth = path.includes('/pages/auth/');

            if (!inAdmin && !inAuth && (isSuperadmin || isAdmin)) {
                var target = isSuperadmin ? (getBasePath() + 'pages/superadmin/dashboard.html') : (getBasePath() + 'pages/admin/dashboard.html');
                location.replace(target);
                return;
            }
        }

        if (requiresAuth && !currentUser) {
            location.replace(loginUrl(currentPage(), 'inquiry'));
            return;
        }

        if (currentUser) {
            renderNavProfile(currentUser);
            prefillInquiryForm(currentUser);
        }

        initMobileNav(currentUser);
        syncGlobalFooterContact();

        root.classList.remove('auth-pending', 'auth-checking');
        document.dispatchEvent(new CustomEvent('urbanscope:user', { detail: currentUser }));
    }

    function syncGlobalFooterContact() {
        var p = null;
        try {
            p = JSON.parse(localStorage.getItem('urbanscope_admin_profile') || 'null');
            if (!p) {
                var adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
                if (adminUser && (adminUser.role === 'admin' || adminUser.email === 'admin.realestate@gmail.com')) {
                    p = adminUser;
                }
            }
        } catch (e) {}

        function applyContact(phone, email) {
            if (!phone && !email) return;
            var cleanPhone = phone || '+63 900 000 0000';
            var cleanEmail = email || 'admin.realestate@gmail.com';
            var cleanDigits = cleanPhone.replace(/[^\d+]/g, '');

            document.querySelectorAll('.footer-contact a[href^="tel:"], footer a[href^="tel:"], #footerAgentPhone').forEach(function(el) {
                el.textContent = cleanPhone;
                el.setAttribute('href', 'tel:' + cleanDigits);
            });

            document.querySelectorAll('.footer-contact a[href^="mailto:"], footer a[href^="mailto:"], #footerAgentEmail').forEach(function(el) {
                el.textContent = cleanEmail;
                el.setAttribute('href', 'mailto:' + cleanEmail);
            });
        }

        if (p) {
            applyContact(p.phone, p.email);
        }

        if (typeof window.apiGetLeadAgentProfile === 'function') {
            window.apiGetLeadAgentProfile().then(function(lead) {
                if (lead && (lead.phone || lead.email)) {
                    applyContact(lead.phone, lead.email);
                }
            }).catch(function() {});
        }
    }

    window.addEventListener('storage', function(e) {
        if (e.key === 'urbanscope_admin_profile' || e.key === 'adminUser') {
            syncGlobalFooterContact();
        }
    });

    window.addEventListener('urbanscope:profileUpdated', function() {
        syncGlobalFooterContact();
    });

    window.addEventListener('focus', function() {
        syncGlobalFooterContact();
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // Failsafe so a slow network can never leave the page hidden
    setTimeout(function () {
        if (!requiresAuth) root.classList.remove('auth-pending');
        else if (!resolved) location.replace(loginUrl(currentPage(), 'inquiry'));
    }, 5000);

    // ------------------------------------------------------------------
    // Global handlers
    // ------------------------------------------------------------------
    document.addEventListener('click', async function (e) {
        // Sign out
        if (e.target.closest('[data-action="signout"]')) {
            e.preventDefault();
            logout();
            return;
        }

        // Close open dropdowns when clicking elsewhere
        if (!e.target.closest('.profile-menu') && !e.target.closest('.user-profile-badge')) {
            document.querySelectorAll('.profile-menu.open, .user-profile-badge.open').forEach(function (m) {
                m.classList.remove('open');
            });
        }

        // Inquiry gate: contacting / inquiring needs an account
        var link = e.target.closest('a[href]');
        if (!link) return;
        if (e.defaultPrevented) return;

        // If on homepage with consultation intent modal, let modal triggers open the modal first
        if (document.getElementById('consultationIntentModal') && !link.closest('#consultationIntentModal')) {
            var rawHref = link.getAttribute('href') || '';
            if (link.matches('#ctaConsultBtn, .cta-consult-btn, .faqs-contact-link') ||
                rawHref === 'pages/inquiry/inquiry.html') {
                return;
            }
        }

        var href = link.getAttribute('href');
        if (!href || !/(^|\/)inquiry(\.html|\/)?(\?|#|$)/.test(href)) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;

        e.preventDefault();
        var user = resolved ? currentUser : await getUser();
        if (user) location.href = href;
        else location.href = loginUrl(rootRelative(href), 'inquiry');
    });

    window.UrbanSession = { getUser: getUser, logout: logout, loginUrl: loginUrl };
})();
