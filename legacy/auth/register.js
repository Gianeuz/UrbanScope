/**
 * UrbanScope - Client Registration Controller
 * Handles account creation, validation, and post-signup redirection.
 */

const params = new URLSearchParams(window.location.search);
const rawNext = params.get('redirect') || '';
const safeNext = /^[A-Za-z0-9_\-\/]+\.html([?#][A-Za-z0-9_\-=&%.]*)?$/.test(rawNext) ? rawNext : 'index.html';

if (params.get('reason') === 'inquiry') {
    const notice = document.getElementById('authNotice');
    if (notice) notice.hidden = false;
}

const loginLink = document.querySelector('.register-prompt a');
if (loginLink && window.location.search) {
    loginLink.href = 'login.html' + window.location.search;
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = this.querySelector('.btn-submit');
        const originalText = btn.innerText;

        const fullname = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match. Please re-enter.');
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Creating Account...';

        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            const res = await apiSignUp(email, password, fullname, phone);
            if (res && res.success) {
                if (res.data && res.data.session) {
                    window.location.href = '../' + safeNext;
                } else {
                    alert('✓ Account created! Please check your email to confirm your registration, then log in.');
                    window.location.href = 'login.html' + window.location.search;
                }
            } else {
                alert('Registration failed: ' + (res.error || 'Please try again.'));
                btn.disabled = false;
                btn.innerText = originalText;
            }
        } else {
            // Demo session when Supabase is not configured
            localStorage.setItem('urbanscope_demo_user', JSON.stringify({ name: fullname, email: email, phone: phone }));
            window.location.href = '../' + safeNext;
        }
    });
}
