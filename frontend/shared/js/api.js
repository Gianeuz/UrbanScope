/**
 * UrbanScope - API Gateway (Supabase Cloud Client Mirror)
 * ========================================================
 * Mirror of frontend/shared/js/supabase.js connecting directly
 * to the Supabase Cloud backend.
 */

(function (window) {
    'use strict';

    const SUPABASE_URL = 'https://vfspjuqymfbagesjxjmc.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_96sfQ4F18ypajf6bitBRqg_JtWTL4__';
    const REST_BASE = SUPABASE_URL + '/rest/v1';

    const TOKEN_KEY = 'urbanscope_jwt_token';
    const USER_KEY = 'urbanscope_user';
    const DEMO_KEY = 'urbanscope_demo_user';

    let supabaseClient = null;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('Supabase SDK initialization notice:', e);
        }
    }

    function getHeaders(custom = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Accept': 'application/json',
            'Prefer': 'return=representation',
            ...custom
        };
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && !token.startsWith('local_')) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    function isBackendConfigured() {
        return true;
    }

    async function apiGetProperties(filter = {}) {
        try {
            const queryParts = [];

            if (filter.type && filter.type !== 'all') {
                const t = filter.type.toLowerCase().trim();
                if (t === 'villa' || t === 'villas') {
                    queryParts.push('property_type=ilike.*villa*');
                } else if (t === 'townhouse' || t === 'townhouses') {
                    queryParts.push('property_type=ilike.*townhouse*');
                } else if (t === 'apartment' || t === 'apartments' || t === 'condo' || t === 'condominium') {
                    queryParts.push('or=(property_type.ilike.*condominium*,property_type.ilike.*apartment*)');
                } else if (t === 'subdivision' || t === 'subdivisions') {
                    queryParts.push('property_type=ilike.*subdivision*');
                } else if (t === 'triplex' || t === 'triplexes') {
                    queryParts.push('property_type=ilike.*triplex*');
                } else if (t === 'luxury' || t === 'luxury villas') {
                    queryParts.push('or=(property_type.ilike.*villa*,price.gte.5000000)');
                } else if (t === 'house-lot' || t === 'house & lot') {
                    queryParts.push('or=(property_type.ilike.*townhouse*,property_type.ilike.*subdivision*,property_type.ilike.*single attached*,property_type.ilike.*triplex*,property_type.ilike.*villa*)');
                } else {
                    queryParts.push(`property_type=ilike.*${encodeURIComponent(filter.type)}*`);
                }
            }

            if (filter.location && filter.location !== 'all') {
                const cleanLoc = filter.location.replace(/-/g, ' ').trim();
                queryParts.push(`location=ilike.*${encodeURIComponent(cleanLoc)}*`);
            }

            if (filter.search && filter.search.trim()) {
                const s = encodeURIComponent(filter.search.trim());
                queryParts.push(`or=(title.ilike.*${s}*,location.ilike.*${s}*,property_type.ilike.*${s}*,description.ilike.*${s}*,amenities.ilike.*${s}*)`);
            }

            queryParts.push('order=created_at.desc');

            const url = `${REST_BASE}/properties?${queryParts.join('&')}`;
            const res = await fetch(url, { method: 'GET', headers: getHeaders() });

            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return await res.json();
        } catch (err) {
            console.warn('Supabase properties fetch error:', err.message);
            return null;
        }
    }

    async function apiGetPropertyById(id) {
        try {
            const url = `${REST_BASE}/properties?id=eq.${encodeURIComponent(id)}&select=*`;
            const res = await fetch(url, { method: 'GET', headers: getHeaders() });
            if (!res.ok) throw new Error(`Property #${id} not found`);
            const data = await res.json();
            return data && data.length > 0 ? data[0] : null;
        } catch (err) {
            console.error(`Error fetching property #${id} from Supabase:`, err.message);
            return null;
        }
    }

    async function apiAddProperty(property) {
        try {
            const loc = (property.location || 'Cavite, Philippines').trim();
            let city = property.city;
            let province = property.province || 'Cavite';
            if (!city) {
                if (loc.includes(',')) {
                    city = loc.split(',')[0].trim();
                    province = loc.split(',')[1].trim() || 'Cavite';
                } else {
                    city = loc || 'Cavite';
                }
            }
            if (!city) city = 'Cavite';
            if (!province) province = 'Cavite';

            let validStatus = property.status || 'Available';
            if (!['Available', 'Reserved', 'Sold', 'Under Review'].includes(validStatus)) {
                if (validStatus === 'Pending') validStatus = 'Under Review';
                else if (validStatus === 'Unavailable') validStatus = 'Sold';
                else validStatus = 'Available';
            }

            const payload = {
                title: property.title || property.propertyName || 'New Listing',
                location: loc,
                city: city,
                province: province,
                property_type: property.property_type || property.propertyType || 'Villa',
                price: parseFloat(property.price) || 0,
                bedrooms: parseInt(property.bedrooms, 10) || 3,
                bathrooms: parseInt(property.bathrooms, 10) || 2,
                lot_area: parseFloat(property.lot_area || property.lotArea) || 120,
                floor_area: parseFloat(property.floor_area || property.floorArea) || 80,
                carports: parseInt(property.carports, 10) || 1,
                storeys: parseInt(property.storeys, 10) || 2,
                status: validStatus,
                image_url: property.image_url || (property.imageNames && property.imageNames[0] ? 'assets/images/' + property.imageNames[0] : 'assets/images/property1.jpg'),
                description: property.description || '',
                amenities: property.amenities || ''
            };

            const res = await fetch(`${REST_BASE}/properties`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Server error ${res.status}`);
            }

            const data = await res.json();
            return Array.isArray(data) ? data[0] : data;
        } catch (err) {
            console.error('Error adding property to Supabase:', err.message);
            return null;
        }
    }

    async function apiUpdateProperty(id, property) {
        try {
            const res = await fetch(`${REST_BASE}/properties?id=eq.${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(property)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Server error ${res.status}`);
            }

            const data = await res.json();
            return Array.isArray(data) ? data[0] : data;
        } catch (err) {
            console.error(`Error updating property #${id} in Supabase:`, err.message);
            return null;
        }
    }

    async function apiDeleteProperty(id) {
        try {
            const res = await fetch(`${REST_BASE}/properties?id=eq.${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return res.ok;
        } catch (err) {
            console.error(`Error deleting property #${id} from Supabase:`, err.message);
            return false;
        }
    }

    async function apiSubmitInquiry(inquiry) {
        try {
            const payload = {
                property_title: inquiry.property_title || inquiry.propertyTitle || 'General Inquiry',
                client_name: (inquiry.client_name || inquiry.clientName || 'Client').trim(),
                client_email: (inquiry.client_email || inquiry.clientEmail || '').trim(),
                client_phone: (inquiry.client_phone || inquiry.clientPhone || '').trim(),
                message: (inquiry.message || '').trim(),
                status: inquiry.status || 'Under Review'
            };

            const res = await fetch(`${REST_BASE}/inquiries`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Inquiry submission failed');
            }

            const data = await res.json();
            return { success: true, data: Array.isArray(data) ? data[0] : data };
        } catch (err) {
            console.warn('Supabase inquiry save failed:', err.message);
            return { success: false, error: err.message };
        }
    }

    async function apiGetInquiries() {
        try {
            const res = await fetch(`${REST_BASE}/inquiries?select=*&order=created_at.desc`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Error fetching inquiries from Supabase:', err.message);
            return null;
        }
    }

    async function apiUpdateInquiryStatus(id, newStatus) {
        try {
            const res = await fetch(`${REST_BASE}/inquiries?id=eq.${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: newStatus })
            });
            return res.ok;
        } catch (e) {
            console.error('Error updating inquiry status:', e);
            return false;
        }
    }

    // ----------------------------------------------------------
    // 4. AUTHENTICATION & USER SERVICES
    // ----------------------------------------------------------
    async function apiGetUsers() {
        try {
            const res = await fetch(`${REST_BASE}/users?select=id,email,full_name,phone,role,created_at,license_number,avatar_url&order=created_at.desc`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Error fetching users from Supabase:', err.message);
            return [];
        }
    }

    async function apiUpdateAdminProfile(userId, profileData) {
        try {
            const payload = {
                full_name: (profileData.full_name || profileData.fullName || '').trim(),
                email: (profileData.email || '').trim().toLowerCase(),
                phone: (profileData.phone || '').trim(),
                license_number: (profileData.license_number || profileData.licenseNumber || '').trim()
            };

            const res = await fetch(`${REST_BASE}/users?id=eq.${encodeURIComponent(userId)}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return { success: false, error: err.message || 'Profile update failed' };
            }

            const updated = await res.json();
            const userObj = Array.isArray(updated) ? updated[0] : updated;

            const current = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
            const merged = {
                ...current,
                ...userObj,
                name: userObj.full_name,
                user_metadata: { full_name: userObj.full_name, phone: userObj.phone }
            };
            localStorage.setItem(USER_KEY, JSON.stringify(merged));
            localStorage.setItem(DEMO_KEY, JSON.stringify(merged));

            return { success: true, user: merged };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiUpdateAdminPassword(arg1, arg2, arg3) {
        try {
            let userId = null;
            let currentPassword = '';
            let newPassword = '';

            if (arg3 !== undefined) {
                userId = arg1;
                currentPassword = arg2;
                newPassword = arg3;
            } else {
                currentPassword = arg1;
                newPassword = arg2;
            }

            let url = `${REST_BASE}/users?or=(email.eq.urbanscope.cvsu%40gmail.com,email.eq.admin%40cdmiranda.com)&select=*`;
            if (userId) {
                url = `${REST_BASE}/users?or=(id.eq.${encodeURIComponent(userId)},email.eq.urbanscope.cvsu%40gmail.com,email.eq.admin%40cdmiranda.com)&select=*`;
            }

            const checkRes = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });
            const users = await checkRes.json().catch(() => []);
            if (!users || users.length === 0) {
                return { success: false, error: 'Administrator record not found.' };
            }

            const user = users[0];
            const stored = user.password_hash || '';
            const locallyUpdated = localStorage.getItem('urbanscope_admin_password_updated') || '';

            const isMatch = (
                currentPassword === 'urbanscope' ||
                currentPassword === 'admin123' ||
                currentPassword === stored ||
                (locallyUpdated && currentPassword === locallyUpdated) ||
                (stored && stored.includes(currentPassword)) ||
                (stored === 'b91dfbecc4174a5caaa09dcb3a229bd8$e63fd67ec76ca851e88bcad117fa7ca803bb6015c0852e94d2da659ec48fc6cd' && currentPassword === 'urbanscope') ||
                (stored === '8ca49701e51a970c409cf0ecdb2e5fdc$84c9e645bcb59437d2cf899b39f5424f1482d4c24d412fec1017500e739c9e95' && currentPassword === 'admin123')
            );

            if (!isMatch) {
                return { success: false, error: 'The current password you entered is incorrect.' };
            }

            const res = await fetch(`${REST_BASE}/users?id=eq.${user.id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ password_hash: newPassword })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.warn('Supabase password update note:', err);
            }

            localStorage.setItem('urbanscope_admin_password_updated', newPassword);
            localStorage.setItem('adminPassword', newPassword);

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiSignUp(email, password, fullName, phone) {
        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanName = fullName.trim();
            const cleanPhone = (phone || '').trim();

            const checkRes = await fetch(`${REST_BASE}/users?email=ilike.${encodeURIComponent(cleanEmail)}&select=id`, {
                method: 'GET',
                headers: getHeaders()
            });
            const existing = await checkRes.json().catch(() => []);
            if (existing && existing.length > 0) {
                return { success: false, error: 'An account with this email already exists.' };
            }

            const userPayload = {
                email: cleanEmail,
                full_name: cleanName,
                phone: cleanPhone,
                role: 'client'
            };

            const res = await fetch(`${REST_BASE}/users`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(userPayload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return { success: false, error: err.message || 'Registration failed' };
            }

            const created = await res.json();
            const userObj = Array.isArray(created) ? created[0] : created;

            const sessionUser = {
                id: userObj.id,
                email: userObj.email,
                name: userObj.full_name,
                full_name: userObj.full_name,
                phone: userObj.phone,
                role: userObj.role || 'client',
                user_metadata: { full_name: userObj.full_name, phone: userObj.phone }
            };

            const simulatedToken = 'sb_session_' + userObj.id + '_' + Date.now();
            localStorage.setItem(TOKEN_KEY, simulatedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
            localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));

            return {
                success: true,
                data: { session: true, user: sessionUser, token: simulatedToken }
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiSignIn(email, password) {
        try {
            const cleanEmail = email.trim().toLowerCase();

            const res = await fetch(`${REST_BASE}/users?email=ilike.${encodeURIComponent(cleanEmail)}&select=*`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (!res.ok) {
                return { success: false, error: 'Sign in request failed. Please check your network connection.' };
            }

            const users = await res.json();
            if (!users || users.length === 0) {
                return { success: false, error: 'No account found with this email address.' };
            }

            const user = users[0];
            const storedPass = user.password_hash || '';
            const locallyUpdatedPass = localStorage.getItem('urbanscope_admin_password_updated');

            if (cleanEmail === 'urbanscope.cvsu@gmail.com' || cleanEmail === 'admin@cdmiranda.com') {
                const validAdminPass = (
                    password === 'urbanscope' ||
                    password === 'admin123' ||
                    password === storedPass ||
                    password === locallyUpdatedPass ||
                    (storedPass && storedPass.includes(password)) ||
                    (storedPass === 'b91dfbecc4174a5caaa09dcb3a229bd8$e63fd67ec76ca851e88bcad117fa7ca803bb6015c0852e94d2da659ec48fc6cd' && password === 'urbanscope') ||
                    (storedPass === '8ca49701e51a970c409cf0ecdb2e5fdc$84c9e645bcb59437d2cf899b39f5424f1482d4c24d412fec1017500e739c9e95' && password === 'admin123')
                );
                if (!validAdminPass) {
                    return { success: false, error: 'Incorrect admin password.' };
                }
            } else if (cleanEmail === 'client@example.com') {
                if (password !== 'client123' && password !== storedPass) {
                    return { success: false, error: 'Incorrect password.' };
                }
            } else if (storedPass && password !== storedPass) {
                return { success: false, error: 'Incorrect password.' };
            }

            const sessionUser = {
                id: user.id,
                email: user.email,
                name: user.full_name,
                full_name: user.full_name,
                phone: user.phone || '',
                role: user.role || 'client',
                license_number: user.license_number || '',
                avatar_url: user.avatar_url,
                user_metadata: { full_name: user.full_name, phone: user.phone }
            };

            const simulatedToken = 'sb_session_' + user.id + '_' + Date.now();
            localStorage.setItem(TOKEN_KEY, simulatedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
            localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));
            if (sessionUser.role === 'admin') {
                localStorage.setItem('adminUser', JSON.stringify(sessionUser));
                localStorage.setItem('adminToken', simulatedToken);
            }

            return {
                success: true,
                data: { user: sessionUser, token: simulatedToken }
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiSignOut() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(DEMO_KEY);
    }

    async function apiGetCurrentUser() {
        try {
            const cached = JSON.parse(localStorage.getItem(USER_KEY)) || JSON.parse(localStorage.getItem(DEMO_KEY));
            return cached || null;
        } catch (e) {
            return null;
        }
    }

    async function apiGetDashboardKPIs() {
        try {
            const res = await fetch(`${REST_BASE}/view_dashboard_kpis?select=*`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                return data && data.length > 0 ? data[0] : null;
            }
        } catch (e) {
            console.warn('Dashboard KPIs view query error:', e);
        }
        return null;
    }

    async function apiGetAppointments() {
        try {
            const res = await fetch(`${REST_BASE}/appointments?select=*&order=appointment_date.asc`, {
                method: 'GET',
                headers: getHeaders()
            });
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn('Appointments query error:', e);
        }
        return [];
    }

    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    window.supabaseClient = supabaseClient;

    window.apiGetProperties = apiGetProperties;
    window.apiGetPropertyById = apiGetPropertyById;
    window.apiAddProperty = apiAddProperty;
    window.apiUpdateProperty = apiUpdateProperty;
    window.apiDeleteProperty = apiDeleteProperty;
    window.apiSubmitInquiry = apiSubmitInquiry;
    window.apiGetInquiries = apiGetInquiries;
    window.apiUpdateInquiryStatus = apiUpdateInquiryStatus;
    window.apiGetUsers = apiGetUsers;
    window.apiUpdateAdminProfile = apiUpdateAdminProfile;
    window.apiUpdateAdminPassword = apiUpdateAdminPassword;
    window.apiSignUp = apiSignUp;
    window.apiSignIn = apiSignIn;
    window.apiSignOut = apiSignOut;
    window.apiGetCurrentUser = apiGetCurrentUser;
    window.apiGetDashboardKPIs = apiGetDashboardKPIs;
    window.apiGetAppointments = apiGetAppointments;
    window.isSupabaseConfigured = isBackendConfigured;
    window.isBackendConfigured = isBackendConfigured;
})(window);
