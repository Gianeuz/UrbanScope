/**
 * UrbanScope - Admin Portal Authentication
 * Authenticates admin credentials and redirects to dashboard.
 */

const adminLoginForm = document.getElementById('adminLoginForm');

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = this.querySelector('.btn-submit');
        const originalText = btn.innerText;

        const adminId = document.getElementById('admin_id').value.trim();
        const password = document.getElementById('password').value;

        if (!adminId.includes('@')) {
            alert('Please enter your admin email address.');
            return;
        }

        btn.disabled = true;
        btn.innerText = 'Verifying Admin...';

        try {
            const cleanEmail = adminId.toLowerCase();

            // Strict admin email check
            if (cleanEmail !== 'admin.realestate@gmail.com' && cleanEmail !== 'urbanscope.cvsu@gmail.com') {
                throw new Error('Access denied: Only authorized administrators may log in here.');
            }

            // Authenticate through apiSignIn (FastAPI Backend + Session)
            if (typeof apiSignIn === 'function') {
                const res = await apiSignIn(adminId, password);
                if (res && res.success) {
                    const user = res.data?.user;
                    if (user && user.role === 'superadmin') {
                        window.location.href = res.data?.redirect_url || '../superadmin/dashboard.html';
                        return;
                    } else if (user && user.role === 'admin') {
                        window.location.href = 'dashboard.html';
                        return;
                    } else {
                        throw new Error('Access denied: Administrator privileges required.');
                    }
                } else {
                    throw new Error(res?.error || 'Invalid admin credentials.');
                }
            } else {
                throw new Error('Authentication gateway not available.');
            }
        } catch (error) {
            alert('Admin login failed: ' + error.message);
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });
}

