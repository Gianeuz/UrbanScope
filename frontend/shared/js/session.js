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
                    name: meta.full_name || (u.email || 'User').split('@')[0],
                    email: u.email || '',
                    phone: meta.phone || ''
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
                    '<span class="profile-avatar">' + esc(initials(user.name)) + '</span>' +
                    '<div><strong>' + esc(user.name) + '</strong><small>' + esc(user.email) + '</small></div>' +
                '</div>' +
                '<a href="' + base + 'index.html" role="menuitem">Home</a>' +
                '<a href="' + base + 'pages/properties/properties.html" role="menuitem">Browse Properties</a>' +
                '<a href="' + base + 'pages/inquiry/inquiry.html" role="menuitem">Submit an Inquiry</a>' +
                '<button type="button" class="signout-item" role="menuitem" data-action="signout">Sign Out</button>' +
            '</div>';
    }

    function renderNavProfile(user) {
        var acts = document.querySelector('.nav-acts');
        if (acts) {
            ['loginBtn', 'signupBtn'].forEach(function (id) {
                var b = document.getElementById(id);
                if (b) b.remove();
            });
            var wrap = document.createElement('div');
            wrap.className = 'profile-menu';
            wrap.id = 'profileMenu';
            wrap.innerHTML =
                '<button type="button" class="profile-chip" id="profileChip" aria-haspopup="true" aria-expanded="false">' +
                    '<span class="profile-avatar">' + esc(initials(user.name)) + '</span>' +
                    '<span class="profile-name">' + esc(user.name.split(' ')[0]) + '</span>' +
                    '<svg class="profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
                '</button>' + dropdownHtml(user);
            acts.appendChild(wrap);
            wrap.querySelector('#profileChip').addEventListener('click', function (e) {
                e.stopPropagation();
                var open = wrap.classList.toggle('open');
                this.setAttribute('aria-expanded', open);
            });
        }

        // Inquiry page top bar badge
        var badge = document.querySelector('.user-profile-badge');
        if (badge) {
            var av = badge.querySelector('.avatar-circle');
            var nm = badge.querySelector('.user-meta strong');
            if (av) av.textContent = initials(user.name);
            if (nm) nm.textContent = user.name;
            badge.insertAdjacentHTML('beforeend', dropdownHtml(user));
            badge.addEventListener('click', function (e) {
                if (e.target.closest('.profile-dropdown')) return;
                e.stopPropagation();
                badge.classList.toggle('open');
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
                    '<span class="profile-avatar" style="width:30px;height:30px;font-size:0.75rem;">' + esc(initials(user.name)) + '</span>' +
                    '<span>' + esc(user.name) + '</span>' +
                '</div>' +
                '<button type="button" class="m-signout-btn" data-action="signout">Sign Out</button>';
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

        if (requiresAuth && !currentUser) {
            location.replace(loginUrl(currentPage(), 'inquiry'));
            return;
        }

        if (currentUser) {
            renderNavProfile(currentUser);
            prefillInquiryForm(currentUser);
        }

        initMobileNav(currentUser);

        root.classList.remove('auth-pending', 'auth-checking');
        document.dispatchEvent(new CustomEvent('urbanscope:user', { detail: currentUser }));
    }

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
        var href = link.getAttribute('href');
        if (!/(^|\/)inquiry(\.html|\/)?(\?|#|$)/.test(href)) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;

        e.preventDefault();
        var user = resolved ? currentUser : await getUser();
        if (user) location.href = href;
        else location.href = loginUrl(rootRelative(href), 'inquiry');
    });

    window.UrbanSession = { getUser: getUser, logout: logout, loginUrl: loginUrl };
})();
