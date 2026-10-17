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

            // 1. Direct credentials verification for authorized admins
            const isCVSUAdmin = (cleanEmail === 'urbanscope.cvsu@gmail.com' && password === 'urbanscope2026');
            const isDefaultAdmin = (cleanEmail === 'admin@cdmiranda.com' && (
                password === 'admin123' ||
                password === localStorage.getItem('urbanscope_admin_password_updated')
            ));

            if (isCVSUAdmin || isDefaultAdmin) {
                const adminProfile = {
                    id: isCVSUAdmin ? 11 : 1,
                    email: cleanEmail,
                    name: isCVSUAdmin ? 'UrbanScope Admin' : 'Miriam Lobren',
                    full_name: isCVSUAdmin ? 'UrbanScope Admin' : 'Miriam Lobren',
                    phone: '+63 900 000 0000',
                    role: 'admin',
                    avatar_url: 'assets/images/agent.jpg',
                    user_metadata: { full_name: isCVSUAdmin ? 'UrbanScope Admin' : 'Miriam Lobren' }
                };

                const simulatedToken = 'sb_admin_' + adminProfile.id + '_' + Date.now();
                localStorage.setItem('urbanscope_jwt_token', simulatedToken);
                localStorage.setItem('urbanscope_user', JSON.stringify(adminProfile));
                localStorage.setItem('urbanscope_demo_user', JSON.stringify(adminProfile));
                localStorage.setItem('adminUser', JSON.stringify(adminProfile));

                window.location.href = 'dashboard.html';
                return;
            }

            // 2. Authenticate through apiSignIn if available
            if (typeof apiSignIn === 'function') {
                const res = await apiSignIn(adminId, password);
                if (res && res.success && res.data?.user?.role === 'admin') {
                    window.location.href = 'dashboard.html';
                    return;
                } else if (res && !res.success) {
                    throw new Error(res.error || 'Invalid admin credentials.');
                }
            }

            // 3. Fallback: Supabase Auth client if configured
            if (window.supabaseClient?.auth) {
                try {
                    const { data: authData, error: authError } =
                        await window.supabaseClient.auth.signInWithPassword({
                            email: adminId,
                            password: password
                        });

                    if (!authError && authData?.user) {
                        window.location.href = 'dashboard.html';
                        return;
                    }
                } catch (authErr) {
                    console.warn('Supabase Auth attempt notice:', authErr);
                }
            }

            throw new Error('Invalid email or password.');

        } catch (error) {
            alert('Admin login failed: ' + error.message);
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });
}

