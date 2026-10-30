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

// ==========================================
// FORM DRAFT PRESERVATION
// Automatically caches user inputs in sessionStorage so navigating
// to Terms of Service or Privacy Policy and clicking Back preserves all fields.
// ==========================================
const DRAFT_STORAGE_KEY = 'urbanscope_register_draft';

function saveRegisterDraft() {
    try {
        const draft = {
            fullname: document.getElementById('fullname')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            terms: document.getElementById('terms')?.checked || false
        };
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {}
}

function restoreRegisterDraft() {
    try {
        const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (!saved) return;
        const draft = JSON.parse(saved);
        if (draft.fullname) {
            const el = document.getElementById('fullname');
            if (el && !el.value) el.value = draft.fullname;
        }
        if (draft.phone) {
            const el = document.getElementById('phone');
            if (el && !el.value) el.value = draft.phone;
        }
        if (draft.email) {
            const el = document.getElementById('email');
            if (el && !el.value) el.value = draft.email;
        }
        if (typeof draft.terms === 'boolean') {
            const el = document.getElementById('terms');
            if (el) el.checked = draft.terms;
        }
    } catch (e) {}
}

restoreRegisterDraft();

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('input', saveRegisterDraft);
    registerForm.addEventListener('change', saveRegisterDraft);

    document.querySelectorAll('.terms-label a').forEach(link => {
        link.addEventListener('click', saveRegisterDraft);
    });

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
                try { sessionStorage.removeItem(DRAFT_STORAGE_KEY); } catch (err) {}
                if (res.data && res.data.session) {
                    window.location.href = '../../' + safeNext;
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
            try { sessionStorage.removeItem(DRAFT_STORAGE_KEY); } catch (err) {}
            localStorage.setItem('urbanscope_demo_user', JSON.stringify({ name: fullname, email: email, phone: phone }));
            window.location.href = '../../' + safeNext;
        }
    });
}
