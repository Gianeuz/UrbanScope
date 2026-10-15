
/**

* UrbanScope - Admin Portal Authentication
* Authenticates through Supabase and verifies admin authorization.
  */

const adminLoginForm = document.getElementById('adminLoginForm');

if (adminLoginForm) {
adminLoginForm.addEventListener('submit', async function (e) {
e.preventDefault();

    const btn = this.querySelector('.btn-submit');
    const originalText = btn.innerText;

    const adminId = document.getElementById('admin_id').value.trim();
    const password = document.getElementById('password').value;

    if (!window.supabaseClient) {
        alert('Supabase is not initialized. Please check your supabase.js file.');
        return;
    }

    if (!adminId.includes('@')) {
        alert('Please enter your admin email address.');
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Verifying Admin...';

    try {
        // 1. Authenticate using real Supabase Auth
        const { data: authData, error: authError } =
            await window.supabaseClient.auth.signInWithPassword({
                email: adminId,
                password: password
            });

        if (authError) {
            throw new Error('Invalid email or password.');
        }

        const user = authData.user;

        // 2. Verify that this authenticated user is an admin
        const { data: adminRecord, error: adminError } =
            await window.supabaseClient
                .from('admin_users')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle();

        if (adminError) {
            await window.supabaseClient.auth.signOut();
            throw new Error(
                'Unable to verify admin access. Please check your admin_users table and RLS policies.'
            );
        }

        if (!adminRecord) {
            await window.supabaseClient.auth.signOut();
            throw new Error('This account is not authorized to access the admin portal.');
        }

        // 3. Redirect only after authentication and admin verification
        window.location.href = 'dashboard.html';

    } catch (error) {
        alert('Admin login failed: ' + error.message);
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

}
