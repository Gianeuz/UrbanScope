/**
 * UrbanScope - Admin Portal Authentication
 * Verifies administrative credentials and directs to the dashboard.
 */
document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = this.querySelector('.btn-submit');
    const originalText = btn.innerText;

    const adminId = document.getElementById('admin_id').value.trim();
    const password = document.getElementById('password').value;

    btn.disabled = true;
    btn.innerText = 'Verifying Admin...';

    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && adminId.includes('@')) {
        const res = await apiSignIn(adminId, password);
        if (res && res.success) {
            window.location.href = 'dashboard.html';
        } else {
            alert('Admin authentication failed: ' + (res.error || 'Invalid credentials.'));
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } else {
        // Demo fallback
        window.location.href = 'dashboard.html';
    }
});
