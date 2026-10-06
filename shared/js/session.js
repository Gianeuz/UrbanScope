/**
 * UrbanScope - Session & Access Control
 * ==========================================================
 * - The public site (home, properties, details) is open to everyone.
 * - Any link to inquiry sends visitors who are not logged in to
 *   auth/login.html (they return to their target page afterwards).
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

    function getBasePath() {
        var p = location.pathname.replace(/\\/g, '/');
        if (p.indexOf('/auth/') !== -1 || 
            p.indexOf('/admin/') !== -1 || 
            p.indexOf('/properties/') !== -1 || 
            p.indexOf('/inquiry/') !== -1) {
            return '../';
        }
        return './';
    }

    function currentPage() {
        var p = location.pathname.replace(/\\/g, '/');
        var base = getBasePath();
        if (base === '../') {
            var parts = p.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return parts.slice(-2).join('/') + location.search;
            }
        }
        var file = p.split('/').pop() || 'index.html';
        return file + location.search;
    }

    function loginUrl(next, reason) {
        var base = getBasePath();
        var url = base + 'auth/login.html?redirect=' + encodeURIComponent(next || 'index.html');
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
                '<a href="' + base + 'properties/properties.html" role="menuitem">Browse Properties</a>' +
                '<a href="' + base + 'inquiry/inquiry.html" role="menuitem">Submit an Inquiry</a>' +
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
        else location.href = loginUrl(href, 'inquiry');
    });

    window.UrbanSession = { getUser: getUser, logout: logout, loginUrl: loginUrl };
})();
