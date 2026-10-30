// profile.js - Admin Profile & Security Settings
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Admin Auth Check
    const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token');
    const storedAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (!token && !storedAdmin.email) {
        window.location.href = '../auth/login.html';
        return;
    }

    // UI Toggles (sidebar & profile dropdown) handled by admin-shell.js

    // Sign out handler
    document.querySelectorAll('.profile-signout, .logout-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            localStorage.removeItem('supabase_token');
            if (typeof apiSignOut === 'function') apiSignOut();
            window.location.href = '../auth/login.html?logout=1';
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
    const passwordAlertBox = document.getElementById('passwordAlertBox');

    function showAlert(message, type = 'success') {
        if (!alertBox) return;
        alertBox.className = `alert-box ${type}`;
        alertBox.style.display = 'flex';
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

    function showPasswordAlert(message, type = 'success') {
        if (passwordAlertBox) {
            passwordAlertBox.className = `alert-box ${type}`;
            passwordAlertBox.style.display = 'flex';
            passwordAlertBox.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${type === 'success' 
                        ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                    }
                </svg>
                <span>${message}</span>
            `;
            passwordAlertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                passwordAlertBox.style.display = 'none';
                passwordAlertBox.className = 'alert-box';
            }, 6000);
        }
        if (alertBox) {
            alertBox.className = `alert-box ${type}`;
            alertBox.style.display = 'flex';
            alertBox.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${type === 'success' 
                        ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
                    }
                </svg>
                <span>${message}</span>
            `;
            setTimeout(() => {
                alertBox.style.display = 'none';
                alertBox.className = 'alert-box';
            }, 6000);
        }
    }

    // 4. Populate current admin profile
    const defaultProfile = {
        name: 'Miriam Lobren (Admin)',
        title: 'Licensed Real Estate Broker / Agent',
        email: 'admin.realestate@gmail.com',
        phone: '+63 900 000 0000',
        license: 'PRC REB #0031892',
        brokerage: 'CD Miranda Realty',
        bio: 'Serving Las Piñas, Cavite, and surrounding prime locations with high-integrity real estate solutions.'
    };

    const savedProfile = JSON.parse(localStorage.getItem('urbanscope_admin_profile') || '{}');

    const currentProfile = {
        ...defaultProfile,
        ...savedProfile,
        ...storedAdmin,
        name: savedProfile.name || storedAdmin.name || storedAdmin.full_name || defaultProfile.name,
        phone: savedProfile.phone !== undefined ? savedProfile.phone : (storedAdmin.phone !== undefined ? storedAdmin.phone : defaultProfile.phone),
        email: savedProfile.email || storedAdmin.email || defaultProfile.email,
        license: savedProfile.license || savedProfile.license_number || storedAdmin.license || storedAdmin.license_number || defaultProfile.license,
        title: savedProfile.title !== undefined ? savedProfile.title : (storedAdmin.title !== undefined ? storedAdmin.title : defaultProfile.title),
        brokerage: savedProfile.brokerage !== undefined ? savedProfile.brokerage : (storedAdmin.brokerage !== undefined ? storedAdmin.brokerage : defaultProfile.brokerage),
        bio: savedProfile.bio !== undefined ? savedProfile.bio : (storedAdmin.bio !== undefined ? storedAdmin.bio : defaultProfile.bio)
    };

    if (fullNameInput) fullNameInput.value = currentProfile.name || '';
    if (titleInput) titleInput.value = currentProfile.title || '';
    if (emailInput) emailInput.value = currentProfile.email || '';
    if (phoneInput) phoneInput.value = currentProfile.phone || '';
    if (licenseInput) licenseInput.value = currentProfile.license || '';
    if (brokerageInput) brokerageInput.value = currentProfile.brokerage || '';
    if (bioInput) bioInput.value = currentProfile.bio || '';

    if (adminNameDisplay) adminNameDisplay.textContent = currentProfile.name || 'Miriam Lobren';
    if (bannerName) bannerName.textContent = currentProfile.name || 'Miriam Lobren';

    // Asynchronously refresh with server profile if available
    (async function refreshWithRemoteProfile() {
        try {
            if (typeof apiGetCurrentUser === 'function') {
                const u = await apiGetCurrentUser();
                if (u) {
                    if (u.phone && !savedProfile.phone && phoneInput) phoneInput.value = u.phone;
                    if ((u.full_name || u.name) && !savedProfile.name && fullNameInput) fullNameInput.value = u.full_name || u.name;
                    if (u.email && !savedProfile.email && emailInput) emailInput.value = u.email;
                    if (u.license_number && !savedProfile.license && licenseInput) licenseInput.value = u.license_number;
                    if (u.title && !savedProfile.title && titleInput) titleInput.value = u.title;
                    if (u.brokerage && !savedProfile.brokerage && brokerageInput) brokerageInput.value = u.brokerage;
                    if (u.bio && !savedProfile.bio && bioInput) bioInput.value = u.bio;
                }
            }
        } catch (_) {}
    })();

    // Avatar Elements
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const btnChangeAvatar = document.getElementById('btnChangeAvatar');
    const btnResetAvatar = document.getElementById('btnResetAvatar');
    const DEFAULT_AVATAR = '../../assets/images/agent.jpg';

    function resolveAdminAvatar(avatarUrl) {
        if (!avatarUrl || typeof avatarUrl !== 'string') return DEFAULT_AVATAR;
        const trimmed = avatarUrl.trim();
        if (!trimmed) return DEFAULT_AVATAR;
        if (trimmed.startsWith('data:') || /^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        if (trimmed.startsWith('/') || trimmed.startsWith('../')) {
            return trimmed;
        }
        const clean = trimmed.replace(/^\/+/, '');
        return '../../' + clean;
    }

    function isCustomAvatar(avatarUrl) {
        if (!avatarUrl || typeof avatarUrl !== 'string') return false;
        const trimmed = avatarUrl.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith('data:image/')) return true;
        if (/^https?:\/\//i.test(trimmed)) return true;
        if (trimmed.includes('agent.jpg')) return false;
        return true;
    }

    // Clean up any stale/corrupted default path stored in custom avatar key
    let cachedCustom = localStorage.getItem('urbanscope_profile_avatar');
    if (cachedCustom && (cachedCustom.includes('agent.jpg') || (!cachedCustom.startsWith('data:') && !/^https?:\/\//i.test(cachedCustom)))) {
        localStorage.removeItem('urbanscope_profile_avatar');
        cachedCustom = null;
    }

    // Populate avatar
    const storedAvatar = cachedCustom || storedAdmin.avatar_url || storedAdmin.avatar || DEFAULT_AVATAR;
    const resolvedAvatar = resolveAdminAvatar(storedAvatar);

    if (profileAvatarImg) {
        profileAvatarImg.onerror = function () {
            this.onerror = null;
            this.src = DEFAULT_AVATAR;
        };
        profileAvatarImg.src = resolvedAvatar;
    }

    document.querySelectorAll('.avatar-circle').forEach(img => {
        img.onerror = function () {
            this.onerror = null;
            this.src = DEFAULT_AVATAR;
        };
        img.src = resolvedAvatar;
    });

    // Only show "Reset Photo" button if there is a custom photo uploaded!
    const hasCustomPhoto = !!cachedCustom || isCustomAvatar(storedAdmin.avatar_url) || isCustomAvatar(storedAdmin.avatar);
    if (btnResetAvatar) {
        btnResetAvatar.style.display = hasCustomPhoto ? 'inline-flex' : 'none';
    }

    if (btnChangeAvatar && avatarFileInput) {
        btnChangeAvatar.addEventListener('click', () => {
            avatarFileInput.click();
        });
    }

    const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

    function readAndOptimizeAvatar(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.onload = (e) => {
                const img = new Image();
                img.onerror = () => reject(new Error('Invalid image data'));
                img.onload = () => {
                    const maxDim = 600;
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, w, h);
                    const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                    resolve(canvas.toDataURL(mimeType, 0.9));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', async () => {
            const file = avatarFileInput.files && avatarFileInput.files[0];
            if (!file) return;

            // Enforce file size strictly under 5MB
            if (file.size > MAX_AVATAR_BYTES) {
                showAlert(`Selected file is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Profile picture must be less than 5MB.`, 'error');
                avatarFileInput.value = '';
                return;
            }

            if (!file.type || !file.type.startsWith('image/')) {
                showAlert('Invalid file format. Please upload an image file (PNG, JPG, WebP).', 'error');
                avatarFileInput.value = '';
                return;
            }

            try {
                const dataUrl = await readAndOptimizeAvatar(file);

                if (profileAvatarImg) profileAvatarImg.src = dataUrl;
                document.querySelectorAll('.avatar-circle').forEach(img => {
                    img.src = dataUrl;
                });

                storedAdmin.avatar_url = dataUrl;
                storedAdmin.avatar = dataUrl;
                localStorage.setItem('adminUser', JSON.stringify(storedAdmin));
                localStorage.setItem('urbanscope_profile_avatar', dataUrl);

                try {
                    const usr = JSON.parse(localStorage.getItem('urbanscope_user') || '{}');
                    if (usr && (usr.role === 'admin' || usr.role === 'superadmin')) {
                        usr.avatar_url = dataUrl;
                        usr.avatar = dataUrl;
                        localStorage.setItem('urbanscope_user', JSON.stringify(usr));
                    }
                } catch (_) {}

                if (btnResetAvatar) btnResetAvatar.style.display = 'inline-flex';
                showAlert(`Profile picture updated successfully! (${(file.size / 1024).toFixed(1)} KB, under 5MB limit)`, 'success');
            } catch (err) {
                console.error('Avatar upload error:', err);
                showAlert('Failed to process image file. Please try another image.', 'error');
            } finally {
                avatarFileInput.value = '';
            }
        });
    }

    if (btnResetAvatar) {
        btnResetAvatar.addEventListener('click', async () => {
            if (profileAvatarImg) {
                profileAvatarImg.onerror = null;
                profileAvatarImg.src = DEFAULT_AVATAR;
            }
            document.querySelectorAll('.avatar-circle').forEach(img => {
                img.onerror = null;
                img.src = DEFAULT_AVATAR;
            });

            delete storedAdmin.avatar_url;
            delete storedAdmin.avatar;
            localStorage.setItem('adminUser', JSON.stringify(storedAdmin));
            localStorage.removeItem('urbanscope_profile_avatar');

            try {
                const usr = JSON.parse(localStorage.getItem('urbanscope_user') || '{}');
                if (usr && (usr.role === 'admin' || usr.role === 'superadmin')) {
                    delete usr.avatar_url;
                    delete usr.avatar;
                    localStorage.setItem('urbanscope_user', JSON.stringify(usr));
                }
            } catch (_) {}

            btnResetAvatar.style.display = 'none';

            try {
                if (typeof apiUpdateAdminProfile === 'function') {
                    await apiUpdateAdminProfile({ avatar_url: 'assets/images/agent.jpg' });
                }
            } catch (_) {}

            showAlert('Profile picture reset to default photo.', 'success');
        });
    }

    // 5. Handle Profile Form Submit
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('saveProfileBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span>Saving...</span>';
            }

            const newName = fullNameInput.value.trim();
            const newTitle = titleInput.value.trim();
            const newEmail = emailInput.value.trim();
            const newPhone = phoneInput.value.trim();
            const newLicense = licenseInput.value.trim();
            const newBrokerage = brokerageInput.value.trim();
            const newBio = bioInput.value.trim();

            const customAvatarNow = localStorage.getItem('urbanscope_profile_avatar');
            const avatarToPersist = customAvatarNow || (isCustomAvatar(storedAdmin.avatar_url) ? storedAdmin.avatar_url : 'assets/images/agent.jpg');
            const prevEmail = (storedAdmin.email || savedProfile.email || currentProfile.email || 'admin.realestate@gmail.com').trim().toLowerCase();

            const updatedData = {
                name: newName,
                full_name: newName,
                title: newTitle,
                email: newEmail,
                original_email: prevEmail,
                phone: newPhone,
                license: newLicense,
                license_number: newLicense,
                brokerage: newBrokerage,
                bio: newBio,
                avatar_url: avatarToPersist,
                role: 'admin'
            };

            // 1. Immediately cache in localStorage for instant offline & reload persistence
            localStorage.setItem('urbanscope_admin_profile', JSON.stringify(updatedData));
            const mergedAdmin = { ...storedAdmin, ...updatedData };
            localStorage.setItem('adminUser', JSON.stringify(mergedAdmin));
            localStorage.setItem('urbanscope_user', JSON.stringify(mergedAdmin));
            localStorage.setItem('urbanscope_demo_user', JSON.stringify(mergedAdmin));
            try {
                window.dispatchEvent(new CustomEvent('urbanscope:profileUpdated', { detail: updatedData }));
            } catch (e) {}

            try {
                if (typeof apiUpdateAdminProfile === 'function') {
                    await apiUpdateAdminProfile(updatedData);
                }

                currentProfile.email = newEmail;
                storedAdmin.email = newEmail;
                savedProfile.email = newEmail;

                if (adminNameDisplay) adminNameDisplay.textContent = newName;
                if (bannerName) bannerName.textContent = newName;

                // Sync topbar shell display
                if (typeof syncAdminProfileDisplay === 'function') {
                    syncAdminProfileDisplay();
                }

                showAlert('Profile information updated and saved successfully!', 'success');
            } catch (err) {
                console.error('Error updating profile:', err);
                showAlert('Changes saved locally. Sync note: ' + (err.message || 'Saved.'), 'success');
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
            const curPass = (currentPasswordInput.value || '').trim();
            const newPass = (newPasswordInput.value || '').trim();
            const confPass = (confirmPasswordInput.value || '').trim();

            if (!curPass) {
                showPasswordAlert('Please enter your current password.', 'error');
                return;
            }

            if (newPass !== confPass) {
                showPasswordAlert('New password and confirm password do not match.', 'error');
                return;
            }

            if (newPass.length < 6) {
                showPasswordAlert('New password must be at least 6 characters long.', 'error');
                return;
            }

            const savePassBtn = document.getElementById('savePasswordBtn');
            if (savePassBtn) {
                savePassBtn.disabled = true;
                savePassBtn.innerHTML = '<span>Updating...</span>';
            }

            try {
                let result = null;
                if (typeof apiUpdateAdminPassword === 'function') {
                    result = await apiUpdateAdminPassword(curPass, newPass);
                } else {
                    // Fallback to local storage
                    const activePass = localStorage.getItem('adminPassword') || 'realestate2026';
                    const updatedPass = localStorage.getItem('urbanscope_admin_password_updated') || '';
                    if (curPass !== activePass && curPass !== updatedPass && curPass !== 'realestate2026' && curPass !== 'urbanscope2026' && curPass !== 'urbanscope') {
                        result = { success: false, error: 'The current password you entered is incorrect.' };
                    } else {
                        localStorage.setItem('adminPassword', newPass);
                        localStorage.setItem('urbanscope_admin_password_updated', newPass);
                        result = { success: true };
                    }
                }

                if (!result || !result.success) {
                    showPasswordAlert(result?.error || result?.message || 'The current password you entered is incorrect.', 'error');
                    return;
                }

                showPasswordAlert('Password has been successfully updated!', 'success');
                passwordForm.reset();
            } catch (err) {
                console.error('Password change error:', err);
                showPasswordAlert(err.message || 'An error occurred while changing password.', 'error');
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
