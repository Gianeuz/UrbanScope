/**
 * UrbanScope - Python REST API Client & Service Gateway
 * ==========================================================
 * Connects the frontend directly to the FastAPI Python backend.
 * Provides property querying, admin CRUD, inquiry submission,
 * and user authentication with JWT session persistence.
 */

(function (window) {
    'use strict';

    // ----------------------------------------------------------
    // 1. API CONFIGURATION & BASE URL RESOLUTION
    // ----------------------------------------------------------
    function resolveApiBase() {
        // If accessed through the Python backend server
        if (window.location.protocol.startsWith('http')) {
            if (window.location.port === '8000') {
                return window.location.origin + '/api';
            }
        }
        // Default to local Python FastAPI backend port 8000
        return 'http://127.0.0.1:8000/api';
    }

    const API_BASE = resolveApiBase();
    const TOKEN_KEY = 'urbanscope_jwt_token';
    const USER_KEY = 'urbanscope_user';
    const DEMO_KEY = 'urbanscope_demo_user';

    function getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    // Always reports configured because the Python backend is active
    function isBackendConfigured() {
        return true;
    }

    // ----------------------------------------------------------
    // 2. PROPERTY SERVICES
    // ----------------------------------------------------------
    async function apiGetProperties(filter = {}) {
        try {
            const params = new URLSearchParams();
            if (filter.type && filter.type !== 'all') params.append('type', filter.type);
            if (filter.location && filter.location !== 'all') params.append('location', filter.location);
            if (filter.search) params.append('search', filter.search);

            const url = API_BASE + '/properties' + (params.toString() ? '?' + params.toString() : '');
            const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return await res.json();
        } catch (err) {
            console.warn('Backend properties fetch failed, falling back to local dataset:', err.message);
            return null;
        }
    }

    async function apiGetPropertyById(id) {
        try {
            const res = await fetch(`${API_BASE}/properties/${id}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error(`Property #${id} not found`);
            return await res.json();
        } catch (err) {
            console.error(`Error fetching property #${id}:`, err.message);
            return null;
        }
    }

    async function apiAddProperty(property) {
        try {
            const res = await fetch(`${API_BASE}/properties`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(property)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error('Error adding property to Python backend:', err.message);
            alert('Backend error: ' + err.message);
            return null;
        }
    }

    async function apiUpdateProperty(id, property) {
        try {
            const res = await fetch(`${API_BASE}/properties/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(property)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error(`Error updating property #${id}:`, err.message);
            alert('Backend error: ' + err.message);
            return null;
        }
    }

    async function apiDeleteProperty(id) {
        try {
            const res = await fetch(`${API_BASE}/properties/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return res.ok;
        } catch (err) {
            console.error(`Error deleting property #${id}:`, err.message);
            return false;
        }
    }

    // ----------------------------------------------------------
    // 3. INQUIRY SERVICES
    // ----------------------------------------------------------
    async function apiSubmitInquiry(inquiry) {
        try {
            const res = await fetch(`${API_BASE}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inquiry)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Inquiry submission failed');
            }
            return await res.json();
        } catch (err) {
            console.warn('Python backend inquiry save failed, simulating local success:', err.message);
            return { success: true, localOnly: true };
        }
    }

    async function apiGetInquiries() {
        try {
            const res = await fetch(`${API_BASE}/inquiries`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error('Error fetching inquiries from Python backend:', err.message);
            return null;
        }
    }

    // ----------------------------------------------------------
    // 4. AUTHENTICATION SERVICES
    // ----------------------------------------------------------
    async function apiSignUp(email, password, fullName, phone) {
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    full_name: fullName,
                    phone: phone || ''
                })
            });

            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.detail || 'Registration failed' };
            }

            if (data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
            }
            if (data.user) {
                const userObj = {
                    ...data.user,
                    name: data.user.full_name,
                    user_metadata: { full_name: data.user.full_name, phone: data.user.phone }
                };
                localStorage.setItem(USER_KEY, JSON.stringify(userObj));
                localStorage.setItem(DEMO_KEY, JSON.stringify(userObj));
            }

            return {
                success: true,
                data: { session: true, user: data.user, token: data.token }
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiSignIn(email, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.detail || 'Invalid email or password' };
            }

            if (data.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
            }
            if (data.user) {
                const userObj = {
                    ...data.user,
                    name: data.user.full_name,
                    user_metadata: { full_name: data.user.full_name, phone: data.user.phone }
                };
                localStorage.setItem(USER_KEY, JSON.stringify(userObj));
                localStorage.setItem(DEMO_KEY, JSON.stringify(userObj));
            }

            return {
                success: true,
                data: { user: data.user, token: data.token }
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiSignOut() {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch (e) {
            // Ignored on client signout
        }
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(DEMO_KEY);
    }

    async function apiGetCurrentUser() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            try {
                return JSON.parse(localStorage.getItem(USER_KEY)) || JSON.parse(localStorage.getItem(DEMO_KEY));
            } catch (e) {
                return null;
            }
        }

        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });

            if (res.ok) {
                const user = await res.json();
                const formatted = {
                    ...user,
                    name: user.full_name,
                    user_metadata: { full_name: user.full_name, phone: user.phone }
                };
                localStorage.setItem(USER_KEY, JSON.stringify(formatted));
                return formatted;
            }
        } catch (err) {
            console.warn('Network issue fetching current user from backend, using cached profile.');
        }

        try {
            return JSON.parse(localStorage.getItem(USER_KEY)) || JSON.parse(localStorage.getItem(DEMO_KEY));
        } catch (e) {
            return null;
        }
    }

    // ----------------------------------------------------------
    // 5. EXPOSE TO GLOBAL SCOPE (BACKWARD COMPATIBLE)
    // ----------------------------------------------------------
    window.apiGetProperties = apiGetProperties;
    window.apiGetPropertyById = apiGetPropertyById;
    window.apiAddProperty = apiAddProperty;
    window.apiUpdateProperty = apiUpdateProperty;
    window.apiDeleteProperty = apiDeleteProperty;
    window.apiSubmitInquiry = apiSubmitInquiry;
    window.apiGetInquiries = apiGetInquiries;
    window.apiSignUp = apiSignUp;
    window.apiSignIn = apiSignIn;
    window.apiSignOut = apiSignOut;
    window.apiGetCurrentUser = apiGetCurrentUser;
    window.isSupabaseConfigured = isBackendConfigured;
    window.isBackendConfigured = isBackendConfigured;

    console.log('✓ UrbanScope Python REST API Client initialized! Target:', API_BASE);
})(window);
