// profile.js - Admin Profile & Security Settings
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Admin Auth Check
    const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token');
    const storedAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (!token && !storedAdmin.email) {
        window.location.href = 'login.html';
        return;
    }

    // 2. UI Toggles
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const profileBtn = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');

    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
    };
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', toggleSidebar);
    if (backdrop) backdrop.addEventListener('click', toggleSidebar);

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }

    // Sign out handler
    document.querySelectorAll('.profile-signout, .logout-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('supabase_token');
            if (typeof apiSignOut === 'function') apiSignOut();
            window.location.href = 'login.html';
        });
    });

    // 3. Form Elements
    const alertBox = document.getElementById('alertBox');
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    const bannerName = document.getElementById('bannerName');

    const fullNameInput = document.getElementById('adminFullName');
    const titleInput = document.getElementById('adminTitle');
    const emailInput = document.getElementById('adminEmail');
    const phoneInput = document.getElementById('adminPhone');
    const licenseInput = document.getElementById('adminLicense');
    const brokerageInput = document.getElementById('adminBrokerage');
    const bioInput = document.getElementById('adminBio');
    const profileForm = document.getElementById('profileForm');

    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordForm = document.getElementById('passwordForm');

    function showAlert(message, type = 'success') {
        if (!alertBox) return;
        alertBox.className = `alert-box ${type}`;
        alertBox.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' 
                    ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                    : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                }
            </svg>
            <span>${message}</span>
        `;
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            alertBox.style.display = 'none';
            alertBox.className = 'alert-box';
        }, 5000);
    }

    // 4. Populate current admin profile
    const defaultProfile = {
        name: 'Miriam Lobren',
        title: 'Licensed Real Estate Broker / Agent',
        email: 'urbanscope.cvsu@gmail.com',
        phone: '+63 917 555 8888',
        license: 'PRC REB #0031892',
        brokerage: 'CD Miranda Realty',
        bio: 'Serving Las Piñas, Cavite, and surrounding prime locations with high-integrity real estate solutions.'
    };

    const currentProfile = { ...defaultProfile, ...storedAdmin };

    if (fullNameInput) fullNameInput.value = currentProfile.name || '';
    if (titleInput) titleInput.value = currentProfile.title || '';
    if (emailInput) emailInput.value = currentProfile.email || '';
    if (phoneInput) phoneInput.value = currentProfile.phone || '';
    if (licenseInput) licenseInput.value = currentProfile.license || '';
    if (brokerageInput) brokerageInput.value = currentProfile.brokerage || '';
    if (bioInput) bioInput.value = currentProfile.bio || '';

    if (adminNameDisplay) adminNameDisplay.textContent = currentProfile.name || 'Miriam Lobren';
    if (bannerName) bannerName.textContent = currentProfile.name || 'Miriam Lobren';

    // 5. Handle Profile Form Submit
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('saveProfileBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span>Saving...</span>';
            }

            const updatedData = {
                name: fullNameInput.value.trim(),
                title: titleInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                license: licenseInput.value.trim(),
                brokerage: brokerageInput.value.trim(),
                bio: bioInput.value.trim(),
                role: 'admin'
            };

            try {
                if (typeof apiUpdateAdminProfile === 'function') {
                    await apiUpdateAdminProfile(updatedData);
                } else {
                    localStorage.setItem('adminUser', JSON.stringify({ ...storedAdmin, ...updatedData }));
                }

                if (adminNameDisplay) adminNameDisplay.textContent = updatedData.name;
                if (bannerName) bannerName.textContent = updatedData.name;
                showAlert('Admin profile information updated successfully!', 'success');
            } catch (err) {
                console.error('Error updating profile:', err);
                showAlert('Failed to update profile: ' + (err.message || 'Please try again.'), 'error');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span>Save Profile Changes</span>
                    `;
                }
            }
        });
    }

    // 6. Handle Password Change Form Submit
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const curPass = currentPasswordInput.value;
            const newPass = newPasswordInput.value;
            const confPass = confirmPasswordInput.value;

            if (newPass !== confPass) {
                showAlert('New password and confirm password do not match.', 'error');
                return;
            }

            if (newPass.length < 6) {
                showAlert('New password must be at least 6 characters long.', 'error');
                return;
            }

            const savePassBtn = document.getElementById('savePasswordBtn');
            if (savePassBtn) {
                savePassBtn.disabled = true;
                savePassBtn.innerHTML = '<span>Updating...</span>';
            }

            try {
                if (typeof apiUpdateAdminPassword === 'function') {
                    const result = await apiUpdateAdminPassword(curPass, newPass);
                    if (!result || !result.success) {
                        showAlert(result?.error || result?.message || 'Incorrect current password. Please try again.', 'error');
                        return;
                    }
                } else {
                    // Fallback
                    const activePass = localStorage.getItem('adminPassword') || 'urbanscope';
                    if (curPass !== activePass) {
                        showAlert('Incorrect current password.', 'error');
                        return;
                    }
                    localStorage.setItem('adminPassword', newPass);
                }

                showAlert('Password has been successfully updated!', 'success');
                passwordForm.reset();
            } catch (err) {
                console.error('Password change error:', err);
                showAlert(err.message || 'An error occurred while changing password.', 'error');
            } finally {
                if (savePassBtn) {
                    savePassBtn.disabled = false;
                    savePassBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <span>Update Password</span>
                    `;
                }
            }
        });
    }
});
