/**
 * UrbanScope - Shared Login Controller
 * Single sign-in page for clients, admins, and the superadmin. Handles credentials
 * submission, sign-out (?logout=1), and role-based post-login redirection.
 */

const params = new URLSearchParams(window.location.search);

// Admin / superadmin "Sign Out" links land here with ?logout=1 — clear the session
// (localStorage + server cookie) and drop the flag from the URL.
if (params.get('logout') === '1') {
    if (typeof apiSignOut === 'function') {
        apiSignOut();
    } else {
        localStorage.removeItem('urbanscope_jwt_token');
        localStorage.removeItem('urbanscope_user');
        localStorage.removeItem('adminUser');
    }
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    params.delete('logout');
    const rest = params.toString();
    history.replaceState(null, '', window.location.pathname + (rest ? '?' + rest : ''));
} else {
    // If an administrator or superadmin is already authenticated, redirect directly to their console
    try {
        const rawUser = localStorage.getItem('adminUser') || localStorage.getItem('urbanscope_user');
        if (rawUser) {
            const u = JSON.parse(rawUser);
            const r = (u.role || '').toLowerCase();
            const em = (u.email || '').toLowerCase().trim();
            if (r === 'superadmin' || em === 'urbanscope.cvsu@gmail.com') {
                window.location.replace('../superadmin/dashboard.html');
            } else if (r === 'admin' || em === 'admin.realestate@gmail.com') {
                window.location.replace('../admin/dashboard.html');
            }
        }
    } catch (e) {}
}
const rawNext = params.get('redirect') || '';
// Allow valid redirect paths relative to the frontend root (e.g. index.html, pages/properties/properties.html, pages/inquiry/inquiry.html)
const safeNext = /^[A-Za-z0-9_\-\/]+\.html([?#][A-Za-z0-9_\-=&%.]*)?$/.test(rawNext) ? rawNext : 'index.html';

if (params.get('reason') === 'inquiry') {
    const notice = document.getElementById('authNotice');
    if (notice) notice.hidden = false;
}

// Keep the redirect target when switching to the register page
const registerLink = document.querySelector('.register-prompt a');
if (registerLink && window.location.search) {
    registerLink.href = 'register.html' + window.location.search;
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = this.querySelector('.btn-submit');
        const originalText = btn.innerText;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        btn.disabled = true;
        btn.innerText = 'Signing In...';

        try {
            const res = await apiSignIn(email, password);
            if (res && res.success) {
                const user = res.data?.user || {};
                const cleanEmail = (user.email || email).toLowerCase();
                const role = user.role || 'user';
                const isAdminUser = (
                    (cleanEmail === 'admin.realestate@gmail.com' || cleanEmail === 'urbanscope.cvsu@gmail.com') &&
                    (role === 'admin' || role === 'superadmin')
                );

                // Relative paths so this works from both the FastAPI server and Live Server
                if (role === 'superadmin' && cleanEmail === 'urbanscope.cvsu@gmail.com') {
                    window.location.href = '../superadmin/dashboard.html';
                } else if (isAdminUser) {
                    window.location.href = '../admin/dashboard.html';
                } else {
                    // Normal user dashboard / destination
                    if (safeNext && safeNext !== 'index.html') {
                        window.location.href = '../../' + safeNext;
                    } else {
                        window.location.href = res.data?.redirect_url || '../../index.html';
                    }
                }
            } else {
                alert('Login failed: ' + (res?.error || 'Invalid email or password.'));
                btn.disabled = false;
                btn.innerText = originalText;
            }
        } catch (err) {
            alert('Login failed: ' + (err.message || 'An unexpected error occurred.'));
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });
}
