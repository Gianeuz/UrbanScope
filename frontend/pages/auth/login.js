/**
 * UrbanScope - Client Login Controller
 * Handles credentials submission, Supabase authentication, and post-login redirection.
 */

const params = new URLSearchParams(window.location.search);
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

                if (isAdminUser) {
                    window.location.href = res.data?.redirect_url || '../admin/dashboard.html';
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
