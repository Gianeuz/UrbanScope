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

    // Optional client-side Google OAuth Client ID fallback (primarily loaded via /api/auth/google/config from .env)
    const GOOGLE_CLIENT_ID = window.URBANSCOPE_GOOGLE_CLIENT_ID || '981770655747-t222jr0ias09rl7aga3302p9am64so43.apps.googleusercontent.com';

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
        return {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Accept': 'application/json',
            'Prefer': 'return=representation',
            ...custom
        };
    }

    function isBackendConfigured() {
        return true;
    }

    function isLocalDevHost() {
        return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    }

    async function apiGetProperties(filter = {}) {
        let liveProperties = [];

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

            queryParts.push('order=id.desc');

            const url = `${REST_BASE}/properties?${queryParts.join('&')}`;
            const res = await fetch(url, { method: 'GET', headers: getHeaders() });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    liveProperties = data;
                }
            }
        } catch (err) {
            console.warn('Supabase properties fetch notice, attempting fallback:', err.message);
        }

        // Fallback 1: Local Python backend if available
        if (liveProperties.length === 0) {
            try {
                const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
                const localRes = await fetch(`${localBase}/properties`, { method: 'GET' });
                if (localRes.ok) {
                    const localData = await localRes.json();
                    if (Array.isArray(localData) && localData.length > 0) {
                        liveProperties = localData;
                    }
                }
            } catch (e) { }
        }

        // Fallback 2: Cached properties in localStorage
        if (liveProperties.length === 0) {
            try {
                const cached = JSON.parse(localStorage.getItem('cached_live_properties') || '[]');
                if (Array.isArray(cached) && cached.length > 0) {
                    liveProperties = cached;
                }
            } catch (e) { }
        }

        // Always merge any locally created properties that are not yet in liveProperties
        try {
            const localProps = JSON.parse(localStorage.getItem('urbanScopeProperties') || localStorage.getItem('properties') || '[]');
            if (Array.isArray(localProps) && localProps.length > 0) {
                const existingIds = new Set(liveProperties.map(p => String(p.id)));
                const existingTitles = new Set(liveProperties.map(p => (p.title || p.propertyName || '').toLowerCase().trim()));

                localProps.forEach(lp => {
                    const lpTitle = (lp.title || lp.propertyName || '').toLowerCase().trim();
                    if (!existingIds.has(String(lp.id)) && (!lpTitle || !existingTitles.has(lpTitle))) {
                        liveProperties.unshift(lp);
                        existingIds.add(String(lp.id));
                    }
                });
            }
        } catch (e) { }

        if (liveProperties.length > 0) {
            try {
                localStorage.setItem('cached_live_properties', JSON.stringify(liveProperties));
            } catch (e) { }
            return liveProperties;
        }

        return null;
    }

    async function apiGetPropertyById(id) {
        try {
            const url = `${REST_BASE}/properties?id=eq.${encodeURIComponent(id)}&select=*`;
            const res = await fetch(url, { method: 'GET', headers: getHeaders() });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) return data[0];
            }
        } catch (err) {
            console.warn(`Supabase notice fetching property #${id}:`, err.message);
        }

        // Fallback 1: Local backend
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const localRes = await fetch(`${localBase}/properties/${encodeURIComponent(id)}`);
            if (localRes.ok) return await localRes.json();
        } catch (e) { }

        // Fallback 2: Cache / local storage
        try {
            const all = JSON.parse(localStorage.getItem('cached_live_properties') || '[]')
                .concat(JSON.parse(localStorage.getItem('urbanScopeProperties') || '[]'))
                .concat(JSON.parse(localStorage.getItem('properties') || '[]'));
            const found = all.find(p => String(p.id) === String(id));
            if (found) return found;
        } catch (e) { }

        return null;
    }

    async function apiAddProperty(property) {
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

        let created = null;

        // 1. Insert into Supabase
        try {
            const res = await fetch(`${REST_BASE}/properties`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                created = Array.isArray(data) ? data[0] : data;
            }
        } catch (err) {
            console.warn('Supabase property insert notice:', err.message);
        }

        // 2. Also ALWAYS sync to local Python backend
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const localRes = await fetch(`${localBase}/properties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (localRes.ok) {
                const localData = await localRes.json();
                if (!created) created = localData;
            }
        } catch (e) {
            console.warn('Local backend property insert notice:', e);
        }

        // If both failed over network, create in-memory object
        if (!created) {
            created = {
                id: property.id || Date.now(),
                ...payload,
                created_at: new Date().toISOString()
            };
        }

        // 3. Immediately update all browser caches so frontend displays it instantly
        try {
            const cached = JSON.parse(localStorage.getItem('cached_live_properties') || '[]');
            cached.unshift(created);
            localStorage.setItem('cached_live_properties', JSON.stringify(cached));
        } catch (e) { }

        try {
            const urbanProps = JSON.parse(localStorage.getItem('urbanScopeProperties') || '[]');
            urbanProps.unshift(created);
            localStorage.setItem('urbanScopeProperties', JSON.stringify(urbanProps));
        } catch (e) { }

        try {
            const adminProps = JSON.parse(localStorage.getItem('properties') || '[]');
            adminProps.unshift({
                id: created.id,
                name: created.title,
                title: created.title,
                location: created.location,
                type: created.property_type,
                property_type: created.property_type,
                price: created.price,
                status: created.status,
                image_url: created.image_url
            });
            localStorage.setItem('properties', JSON.stringify(adminProps));
        } catch (e) { }

        return created;
    }

    async function apiUpdateProperty(id, property) {
        let updated = null;

        // 1. Try local FastAPI backend first
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('urbanscope_jwt_token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const localRes = await fetch(`${localBase}/properties/${encodeURIComponent(id)}`, {
                method: 'PUT',
                credentials: 'include',
                headers: headers,
                body: JSON.stringify(property)
            });

            if (localRes.ok) {
                updated = await localRes.json();
            }
        } catch (e) {
            console.warn('Local backend property update notice:', e);
        }

        // 2. Also try live Supabase if available
        try {
            const res = await fetch(`${REST_BASE}/properties?id=eq.${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(property)
            });

            if (res.ok) {
                const data = await res.json();
                const supaData = Array.isArray(data) ? data[0] : data;
                if (!updated) updated = supaData;
            }
        } catch (err) {
            console.warn(`Supabase update notice for property #${id}:`, err.message);
        }

        // 3. In-memory object fallback if network was unreachable
        if (!updated) {
            updated = { id: Number(id) || id, ...property };
        }

        // 4. Immediately sync all local storage property caches
        try {
            ['cached_live_properties', 'urbanScopeProperties', 'properties'].forEach(key => {
                const list = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(list) && list.length > 0) {
                    const idx = list.findIndex(p => String(p.id) === String(id));
                    if (idx !== -1) {
                        list[idx] = { ...list[idx], ...property };
                        localStorage.setItem(key, JSON.stringify(list));
                    }
                }
            });
        } catch (e) { }

        return updated;
    }

    async function apiDeleteProperty(id) {
        let deleted = false;

        // 1. Try local FastAPI backend first
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('urbanscope_jwt_token') || localStorage.getItem('adminToken') || localStorage.getItem('urbanscope_token') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const localRes = await fetch(`${localBase}/properties/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: headers
            });

            if (localRes.ok) {
                deleted = true;
            }
        } catch (e) {
            console.warn('Local backend property delete notice:', e);
        }

        // 2. Also try Supabase if configured
        try {
            const res = await fetch(`${REST_BASE}/properties?id=eq.${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (res.ok) {
                deleted = true;
            }
        } catch (err) {
            console.warn(`Supabase delete notice for property #${id}:`, err.message);
        }

        // 3. Immediately clean up all local storage property caches
        try {
            ['cached_live_properties', 'urbanScopeProperties', 'properties'].forEach(key => {
                const list = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(list) && list.length > 0) {
                    const filtered = list.filter(p => String(p.id) !== String(id));
                    localStorage.setItem(key, JSON.stringify(filtered));
                }
            });
            // If offline, still treat as deleted locally
            if (!deleted) deleted = true;
        } catch (e) { }

        return deleted;
    }

    async function apiSubmitInquiry(inquiry) {
        const payload = {
            property_title: inquiry.property_title || inquiry.propertyTitle || 'General Inquiry',
            client_name: (inquiry.client_name || inquiry.clientName || 'Client').trim(),
            client_email: (inquiry.client_email || inquiry.clientEmail || '').trim(),
            client_phone: (inquiry.client_phone || inquiry.clientPhone || '').trim(),
            message: (inquiry.message || '').trim(),
            status: inquiry.status || 'Under Review'
        };

        let result = null;

        // Try Supabase Cloud
        try {
            const res = await fetch(`${REST_BASE}/inquiries`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                result = { success: true, data: Array.isArray(data) ? data[0] : data };
            }
        } catch (err) {
            console.warn('Supabase inquiry save notice:', err.message);
        }

        // Fallback 1: Local FastAPI Python backend
        if (!result) {
            try {
                const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
                const localRes = await fetch(`${localBase}/inquiries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (localRes.ok) {
                    const localData = await localRes.json();
                    result = { success: true, data: localData.data || localData };
                }
            } catch (e) { }
        }

        // Cache in localStorage & broadcast event for active admin listeners
        try {
            const cached = JSON.parse(localStorage.getItem('inquiries') || '[]');
            const record = (result && result.data) ? result.data : {
                id: Date.now(),
                ...payload,
                created_at: new Date().toISOString()
            };
            cached.unshift(record);
            localStorage.setItem('inquiries', JSON.stringify(cached));
            window.dispatchEvent(new CustomEvent('inquirySubmitted', { detail: record }));
        } catch (_) { }

        return result || { success: true, data: payload };
    }

    async function apiGetInquiries() {
        let list = [];

        // 1. Try Supabase REST
        try {
            const res = await fetch(`${REST_BASE}/inquiries?select=*&order=created_at.desc`, {
                method: 'GET',
                headers: getHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    list = data;
                }
            }
        } catch (err) {
            console.warn('Supabase inquiries fetch notice:', err.message);
        }

        // 2. Fallback: Local FastAPI backend
        if (!list.length) {
            try {
                const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
                const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token');
                const localRes = await fetch(`${localBase}/inquiries`, {
                    method: 'GET',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (localRes.ok) {
                    const localData = await localRes.json();
                    if (Array.isArray(localData) && localData.length > 0) {
                        list = localData;
                    }
                }
            } catch (e) { }
        }

        // 3. Fallback: localStorage
        if (!list.length) {
            try {
                const cached = JSON.parse(localStorage.getItem('inquiries') || '[]');
                if (Array.isArray(cached) && cached.length > 0) {
                    list = cached;
                }
            } catch (_) { }
        }

        if (list.length > 0) {
            try {
                localStorage.setItem('inquiries', JSON.stringify(list));
            } catch (_) { }
            return list;
        }

        return null;
    }

    async function apiUpdateInquiryStatus(id, newStatus) {
        let updated = false;

        // 1. Try Supabase
        try {
            const res = await fetch(`${REST_BASE}/inquiries?id=eq.${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) updated = true;
        } catch (e) { }

        // 2. Try FastAPI
        if (!updated) {
            try {
                const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
                const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token');
                const res = await fetch(`${localBase}/inquiries/${encodeURIComponent(id)}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                if (res.ok) updated = true;
            } catch (e) { }
        }

        // 3. Always update localStorage cache
        try {
            const cached = JSON.parse(localStorage.getItem('inquiries') || '[]');
            const idx = cached.findIndex(i => String(i.id) === String(id));
            if (idx !== -1) {
                cached[idx].status = newStatus;
                localStorage.setItem('inquiries', JSON.stringify(cached));
            }
        } catch (_) { }

        return updated;
    }

    async function apiGetMyInquiries(email) {
        let list = [];
        const cleanEmail = (email || '').trim().toLowerCase();

        // 1. Try FastAPI backend
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('access_token') || localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
            const url = cleanEmail ? `${localBase}/inquiries/my?email=${encodeURIComponent(cleanEmail)}` : `${localBase}/inquiries/my`;
            const res = await fetch(url, {
                method: 'GET',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) list = data;
            }
        } catch (e) {}

        // 2. Try Supabase Cloud
        if (!list.length && cleanEmail) {
            try {
                const res = await fetch(`${REST_BASE}/inquiries?client_email=ilike.${encodeURIComponent(cleanEmail)}&order=created_at.desc`, {
                    method: 'GET',
                    headers: getHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) list = data;
                }
            } catch (err) {}
        }

        // 3. Fallback: filter cached inquiries in localStorage
        if (!list.length && cleanEmail) {
            try {
                const cached = JSON.parse(localStorage.getItem('inquiries') || '[]');
                if (Array.isArray(cached) && cached.length > 0) {
                    list = cached.filter(i => (i.client_email || i.clientEmail || '').trim().toLowerCase() === cleanEmail);
                }
            } catch (_) {}
        }

        return list;
    }

    async function apiUpdateMyInquiry(id, updates, email) {
        let updated = false;
        let updatedRecord = null;
        const cleanEmail = (email || '').trim().toLowerCase();
        const payload = { ...updates };
        if (cleanEmail && !payload.client_email) payload.client_email = cleanEmail;

        // 1. Try FastAPI
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('access_token') || localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
            const res = await fetch(`${localBase}/inquiries/${encodeURIComponent(id)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                updated = true;
                updatedRecord = data.data || data;
            }
        } catch (e) {}

        // 2. Try Supabase
        if (!updated) {
            try {
                const res = await fetch(`${REST_BASE}/inquiries?id=eq.${encodeURIComponent(id)}`, {
                    method: 'PATCH',
                    headers: getHeaders(),
                    body: JSON.stringify(updates)
                });
                if (res.ok) {
                    updated = true;
                }
            } catch (e) {}
        }

        // 3. Update localStorage cache
        try {
            const cached = JSON.parse(localStorage.getItem('inquiries') || '[]');
            const idx = cached.findIndex(i => String(i.id) === String(id));
            if (idx !== -1) {
                cached[idx] = { ...cached[idx], ...updates };
                localStorage.setItem('inquiries', JSON.stringify(cached));
                if (!updatedRecord) updatedRecord = cached[idx];
            }
        } catch (_) {}

        return { success: updated || Boolean(updatedRecord), data: updatedRecord };
    }

    async function apiDeleteMyInquiry(id, email) {
        let deleted = false;
        const cleanEmail = (email || '').trim().toLowerCase();

        // 1. Try FastAPI
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('access_token') || localStorage.getItem('supabase_token') || localStorage.getItem('adminToken');
            const url = cleanEmail ? `${localBase}/inquiries/${encodeURIComponent(id)}?client_email=${encodeURIComponent(cleanEmail)}` : `${localBase}/inquiries/${encodeURIComponent(id)}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) deleted = true;
        } catch (e) {}

        // 2. Try Supabase
        if (!deleted) {
            try {
                const res = await fetch(`${REST_BASE}/inquiries?id=eq.${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                if (res.ok) deleted = true;
            } catch (e) {}
        }

        // 3. Remove from localStorage cache
        try {
            const cached = JSON.parse(localStorage.getItem('inquiries') || '[]');
            const filtered = cached.filter(i => String(i.id) !== String(id));
            localStorage.setItem('inquiries', JSON.stringify(filtered));
        } catch (_) {}

        return { success: true };
    }

    async function apiCancelMyInquiry(id, email) {
        return apiUpdateMyInquiry(id, { status: 'Cancelled' }, email);
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
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) return data;
            }
        } catch (err) {
            console.warn('Supabase users fetch notice, trying local API:', err.message);
        }

        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token') || localStorage.getItem(TOKEN_KEY);
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const localRes = await fetch(`${localBase}/users`, {
                method: 'GET',
                headers: headers
            });
            if (localRes.ok) {
                const localUsers = await localRes.json();
                if (Array.isArray(localUsers)) return localUsers;
            }
        } catch (_) { }

        return [];
    }

    async function apiUpdateAdminProfile(arg1, arg2) {
        try {
            let profileData = {};
            let userId = null;
            if (arg2 !== undefined) {
                userId = arg1;
                profileData = arg2 || {};
            } else {
                profileData = arg1 || {};
            }

            const storedAdmin = JSON.parse(localStorage.getItem('adminUser') || localStorage.getItem(USER_KEY) || '{}');
            const targetEmail = (profileData.email || storedAdmin.email || 'urbanscope.cvsu@gmail.com').trim().toLowerCase();
            const fullName = (profileData.full_name || profileData.name || profileData.fullName || storedAdmin.name || 'Miriam Lobren').trim();
            const phone = (profileData.phone || storedAdmin.phone || '').trim();
            const license = (profileData.license_number || profileData.license || profileData.licenseNumber || '').trim();

            const payload = {
                full_name: fullName,
                email: targetEmail,
                phone: phone,
                license_number: license
            };

            let filter = userId ? `id=eq.${encodeURIComponent(userId)}` : `email=ilike.${encodeURIComponent(targetEmail)}`;

            const res = await fetch(`${REST_BASE}/users?${filter}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            let updatedUser = null;
            if (res.ok) {
                const updated = await res.json().catch(() => []);
                updatedUser = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;
            }

            // Sync local storage sessions
            const current = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
            const merged = {
                ...current,
                ...storedAdmin,
                ...(updatedUser || {}),
                ...profileData,
                name: fullName,
                full_name: fullName,
                email: targetEmail,
                phone: phone,
                role: 'admin',
                user_metadata: { full_name: fullName, phone: phone }
            };

            localStorage.setItem(USER_KEY, JSON.stringify(merged));
            localStorage.setItem(DEMO_KEY, JSON.stringify(merged));
            localStorage.setItem('adminUser', JSON.stringify(merged));

            return { success: true, user: merged };
        } catch (err) {
            console.warn('apiUpdateAdminProfile notice:', err);
            try {
                const storedAdmin = JSON.parse(localStorage.getItem('adminUser') || '{}');
                const merged = { ...storedAdmin, ...(arg1 || {}) };
                localStorage.setItem('adminUser', JSON.stringify(merged));
                return { success: true, user: merged };
            } catch (e) { }
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

            const storedAdmin = JSON.parse(localStorage.getItem('adminUser') || localStorage.getItem(USER_KEY) || '{}');
            const adminEmail = (storedAdmin.email || 'urbanscope.cvsu@gmail.com').trim().toLowerCase();

            // Find admin user in Supabase by ID or email
            let url = `${REST_BASE}/users?email=ilike.${encodeURIComponent(adminEmail)}&select=*`;
            if (userId) {
                url = `${REST_BASE}/users?or=(id.eq.${encodeURIComponent(userId)},email.ilike.${encodeURIComponent(adminEmail)})&select=*`;
            }

            const checkRes = await fetch(url, {
                method: 'GET',
                headers: getHeaders()
            });
            const users = await checkRes.json().catch(() => []);
            const user = users && users.length > 0 ? users[0] : null;

            const stored = user ? (user.password_hash || '') : '';
            const locallyUpdated = localStorage.getItem('urbanscope_admin_password_updated') || '';
            const activePass = localStorage.getItem('adminPassword') || '';

            // Verify current password against known seeds, database hash, or local updates
            const isMatch = (
                currentPassword === 'urbanscope' ||
                currentPassword === 'urbanscope2026' ||
                currentPassword === 'admin123' ||
                (locallyUpdated && currentPassword === locallyUpdated) ||
                (activePass && currentPassword === activePass) ||
                (stored && currentPassword === stored) ||
                (stored && stored.includes(currentPassword)) ||
                (stored === 'b91dfbecc4174a5caaa09dcb3a229bd8$e63fd67ec76ca851e88bcad117fa7ca803bb6015c0852e94d2da659ec48fc6cd' && currentPassword === 'urbanscope') ||
                (stored === '8ca49701e51a970c409cf0ecdb2e5fdc$84c9e645bcb59437d2cf899b39f5424f1482d4c24d412fec1017500e739c9e95' && currentPassword === 'admin123')
            );

            if (!isMatch) {
                return { success: false, error: 'The current password you entered is incorrect.' };
            }

            // Update password in Supabase if record found
            if (user && user.id) {
                await fetch(`${REST_BASE}/users?id=eq.${user.id}`, {
                    method: 'PATCH',
                    headers: getHeaders(),
                    body: JSON.stringify({ password_hash: newPassword })
                }).catch(() => { });
            }

            // Store updated password locally for immediate sign-in verification
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
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';

            // 1. Direct registration with FastAPI backend
            try {
                const res = await fetch(`${localBase}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: cleanEmail,
                        password: password,
                        full_name: cleanName,
                        phone: cleanPhone
                    })
                });

                if (res.ok) {
                    const regData = await res.json();
                    if (regData.success && regData.user) {
                        const u = regData.user;
                        const sessionUser = {
                            id: u.id,
                            email: u.email,
                            name: u.full_name,
                            full_name: u.full_name,
                            phone: u.phone || '',
                            role: u.role || 'user',
                            avatar_url: u.avatar_url || '',
                            user_metadata: { full_name: u.full_name, phone: u.phone, avatar_url: u.avatar_url || '' }
                        };

                        localStorage.setItem(TOKEN_KEY, regData.token);
                        localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
                        localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));
                        if (sessionUser.role === 'admin' || sessionUser.role === 'superadmin') {
                            localStorage.setItem('adminUser', JSON.stringify(sessionUser));
                        }

                        return {
                            success: true,
                            data: {
                                session: true,
                                user: sessionUser,
                                token: regData.token,
                                redirect_url: regData.redirect_url
                            }
                        };
                    }
                } else {
                    const err = await res.json().catch(() => ({}));
                    return { success: false, error: err.detail || 'Registration failed' };
                }
            } catch (err) {
                console.warn('Backend register attempt notice, using local session:', err);
            }

            // Local fallback
            let role = 'user';
            if (cleanEmail === 'urbanscope.cvsu@gmail.com') role = 'superadmin';
            else if (cleanEmail === 'admin.realestate@gmail.com') role = 'admin';

            const sessionUser = {
                id: Date.now(),
                email: cleanEmail,
                name: cleanName,
                full_name: cleanName,
                phone: cleanPhone,
                role: role,
                user_metadata: { full_name: cleanName, phone: cleanPhone }
            };

            const simulatedToken = 'sb_session_' + sessionUser.id + '_' + Date.now();
            localStorage.setItem(TOKEN_KEY, simulatedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
            localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));

            return {
                success: true,
                data: {
                    session: true,
                    user: sessionUser,
                    token: simulatedToken,
                    redirect_url: (role === 'admin' || role === 'superadmin') ? '/pages/admin/dashboard.html' : '/index.html'
                }
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiSignIn(email, password) {
        try {
            const cleanEmail = email.trim().toLowerCase();
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';

            // 1. Direct authentication with FastAPI Backend
            try {
                const res = await fetch(`${localBase}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail, password: password })
                });

                if (res.ok) {
                    const authRes = await res.json();
                    if (authRes.success && authRes.user) {
                        const u = authRes.user;
                        const sessionUser = {
                            id: u.id,
                            email: u.email,
                            name: u.full_name,
                            full_name: u.full_name,
                            phone: u.phone || '',
                            role: u.role || 'user',
                            avatar_url: u.avatar_url || '',
                            user_metadata: { full_name: u.full_name, phone: u.phone, avatar_url: u.avatar_url || '' }
                        };

                        localStorage.setItem(TOKEN_KEY, authRes.token);
                        localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
                        localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));
                        if (sessionUser.role === 'admin' || sessionUser.role === 'superadmin') {
                            localStorage.setItem('adminUser', JSON.stringify(sessionUser));
                        }

                        return {
                            success: true,
                            data: {
                                user: sessionUser,
                                token: authRes.token,
                                redirect_url: authRes.redirect_url
                            }
                        };
                    }
                } else if (res.status === 401) {
                    const errData = await res.json().catch(() => ({}));
                    return { success: false, error: errData.detail || 'Invalid email or password.' };
                }
            } catch (backendErr) {
                console.warn('Backend login attempt notice, falling back:', backendErr);
            }

            // Fallback for offline or static demo sessions
            let role = 'user';
            if (cleanEmail === 'urbanscope.cvsu@gmail.com') {
                if (password !== 'urbanscope2026') return { success: false, error: 'Incorrect admin password.' };
                role = 'superadmin';
            } else if (cleanEmail === 'admin.realestate@gmail.com') {
                if (password !== 'realestate2026') return { success: false, error: 'Incorrect admin password.' };
                role = 'admin';
            }

            const name = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const sessionUser = {
                id: (role === 'superadmin' ? 1 : (role === 'admin' ? 2 : 10)),
                email: cleanEmail,
                name: name,
                full_name: name,
                phone: '',
                role: role,
                user_metadata: { full_name: name }
            };

            const simulatedToken = 'sb_session_' + sessionUser.id + '_' + Date.now();
            localStorage.setItem(TOKEN_KEY, simulatedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
            localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));
            if (sessionUser.role === 'admin' || sessionUser.role === 'superadmin') {
                localStorage.setItem('adminUser', JSON.stringify(sessionUser));
            }

            const redirectUrl = (role === 'superadmin') 
                ? '/pages/superadmin/dashboard.html' 
                : (role === 'admin' ? '/pages/admin/dashboard.html' : '/index.html');

            return {
                success: true,
                data: { user: sessionUser, token: simulatedToken, redirect_url: redirectUrl }
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async function apiGetGoogleConfig() {
        if (isLocalDevHost()) {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            try {
                const res = await fetch(`${localBase}/auth/google/config`, { method: 'GET' });
                if (res.ok) {
                    const cfg = await res.json();
                    const cid = (cfg.client_id || '').trim();
                    if (cid && !cid.toLowerCase().startsWith('your_google_client_id')) {
                        return { enabled: true, client_id: cid };
                    }
                }
            } catch (e) {}
        }

        const fallbackCid = (window.URBANSCOPE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID || '').trim();
        if (fallbackCid && !fallbackCid.toLowerCase().startsWith('your_google_client_id')) {
            return { enabled: true, client_id: fallbackCid };
        }
        return { enabled: false, client_id: '' };
    }

    async function syncGoogleUserToSupabase(userObj) {
        if (!userObj || !userObj.email) return null;
        try {
            const cleanEmail = userObj.email.trim().toLowerCase();
            const checkRes = await fetch(
                `${REST_BASE}/users?email=ilike.${encodeURIComponent(cleanEmail)}&select=id,google_id,avatar_url,role`,
                { method: 'GET', headers: getHeaders() }
            );
            if (!checkRes.ok) return null;
            const rows = await checkRes.json().catch(() => []);
            const existing = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

            if (existing && existing.id) {
                const patchBody = {};
                if (userObj.google_id && !existing.google_id) {
                    patchBody.google_id = userObj.google_id;
                }
                const isRegular = existing.role === 'user' || existing.role === 'client';
                if (userObj.avatar_url && (!existing.avatar_url || (isRegular && existing.avatar_url === 'assets/images/agent.jpg'))) {
                    patchBody.avatar_url = userObj.avatar_url;
                }
                if (Object.keys(patchBody).length > 0) {
                    await fetch(`${REST_BASE}/users?id=eq.${encodeURIComponent(existing.id)}`, {
                        method: 'PATCH',
                        headers: getHeaders(),
                        body: JSON.stringify(patchBody)
                    }).catch(() => {});
                }
                return existing;
            } else {
                const supaRole = (userObj.role === 'superadmin' || userObj.role === 'admin') ? 'admin' : 'user';
                const insertRes = await fetch(`${REST_BASE}/users`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        email: cleanEmail,
                        full_name: userObj.full_name || userObj.name || cleanEmail.split('@')[0],
                        phone: userObj.phone || '',
                        role: supaRole,
                        avatar_url: userObj.avatar_url || 'assets/images/agent.jpg',
                        google_id: userObj.google_id || null
                    })
                });
                if (insertRes.ok) {
                    const created = await insertRes.json().catch(() => []);
                    return Array.isArray(created) ? created[0] : created;
                }
            }
        } catch (err) {
            console.warn('Supabase Google user sync notice:', err.message);
        }
        return null;
    }

    async function apiSignInWithGoogle(googlePayload = {}) {
        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const body = {
                credential: googlePayload.credential || null,
                access_token: googlePayload.access_token || null
            };

            if (isLocalDevHost()) {
                try {
                    const res = await fetch(`${localBase}/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });

                    if (res.ok) {
                        const authRes = await res.json();
                        if (authRes.success && authRes.user) {
                            const u = authRes.user;
                            const sessionUser = {
                                id: u.id,
                                email: u.email,
                                name: u.full_name,
                                full_name: u.full_name,
                                phone: u.phone || '',
                                role: u.role || 'user',
                                avatar_url: u.avatar_url || '',
                                google_id: u.google_id || null,
                                user_metadata: {
                                    full_name: u.full_name,
                                    phone: u.phone || '',
                                    avatar_url: u.avatar_url || ''
                                }
                            };

                            localStorage.setItem(TOKEN_KEY, authRes.token);
                            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
                            localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));
                            if (sessionUser.role === 'admin' || sessionUser.role === 'superadmin') {
                                localStorage.setItem('adminUser', JSON.stringify(sessionUser));
                            } else {
                                localStorage.removeItem('adminUser');
                            }

                            syncGoogleUserToSupabase(u).catch(() => {});

                            return {
                                success: true,
                                data: {
                                    session: true,
                                    user: sessionUser,
                                    token: authRes.token,
                                    redirect_url: authRes.redirect_url
                                }
                            };
                        }
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        return {
                            success: false,
                            error: errData.detail || 'Google authentication failed.'
                        };
                    }
                } catch (networkErr) {
                    console.warn('Local FastAPI Google auth unreachable, attempting static cloud verification:', networkErr);
                }
            }

            const cfg = await apiGetGoogleConfig();
            if (!cfg.enabled || !cfg.client_id) {
                return {
                    success: false,
                    error: 'Google Sign-In is not configured. Add GOOGLE_CLIENT_ID to your .env file.'
                };
            }

            let profile = null;
            if (body.access_token) {
                const tRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(body.access_token)}`);
                if (!tRes.ok) return { success: false, error: 'Invalid or expired Google access token.' };
                const tInfo = await tRes.json();
                if (tInfo.aud !== cfg.client_id && tInfo.azp !== cfg.client_id) {
                    return { success: false, error: 'Google token client ID mismatch.' };
                }
                const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${body.access_token}` }
                });
                if (!uRes.ok) return { success: false, error: 'Unable to fetch Google account profile.' };
                profile = await uRes.json();
            } else if (body.credential) {
                const idRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`);
                if (!idRes.ok) return { success: false, error: 'Invalid or expired Google ID token.' };
                profile = await idRes.json();
                if (profile.aud !== cfg.client_id) {
                    return { success: false, error: 'Google token client ID mismatch.' };
                }
            } else {
                return { success: false, error: 'Missing Google authentication token.' };
            }

            const cleanEmail = (profile.email || '').trim().toLowerCase();
            const isVerified = profile.email_verified === true || String(profile.email_verified).toLowerCase() === 'true';
            if (!cleanEmail || !isVerified) {
                return { success: false, error: 'Google account email is not verified.' };
            }

            let role = 'user';
            if (cleanEmail === 'urbanscope.cvsu@gmail.com') role = 'superadmin';
            else if (cleanEmail === 'admin.realestate@gmail.com') role = 'admin';

            const fullName = (profile.name || cleanEmail.split('@')[0]).trim();
            const avatarUrl = (profile.picture || '').trim();
            const googleSub = (profile.sub || '').trim();

            const supaRecord = await syncGoogleUserToSupabase({
                email: cleanEmail,
                full_name: fullName,
                phone: '',
                role: role,
                avatar_url: avatarUrl,
                google_id: googleSub
            });

            const sessionUser = {
                id: (supaRecord && supaRecord.id) ? supaRecord.id : Date.now(),
                email: cleanEmail,
                name: fullName,
                full_name: fullName,
                phone: '',
                role: role,
                avatar_url: avatarUrl,
                google_id: googleSub,
                user_metadata: { full_name: fullName, avatar_url: avatarUrl }
            };

            const simulatedToken = 'sb_google_' + sessionUser.id + '_' + Date.now();
            localStorage.setItem(TOKEN_KEY, simulatedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
            localStorage.setItem(DEMO_KEY, JSON.stringify(sessionUser));
            if (role === 'admin' || role === 'superadmin') {
                localStorage.setItem('adminUser', JSON.stringify(sessionUser));
            } else {
                localStorage.removeItem('adminUser');
            }

            const redirectUrl = (role === 'superadmin')
                ? '/pages/superadmin/dashboard.html'
                : (role === 'admin' ? '/pages/admin/dashboard.html' : '/index.html');

            return {
                success: true,
                data: { session: true, user: sessionUser, token: simulatedToken, redirect_url: redirectUrl }
            };
        } catch (err) {
            return { success: false, error: err.message || 'Google authentication failed.' };
        }
    }

    async function apiSignOut() {
        if (isLocalDevHost()) {
            try {
                const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
                await fetch(`${localBase}/auth/logout`, { method: 'POST' }).catch(() => {});
            } catch (e) {}
        }
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(DEMO_KEY);
        localStorage.removeItem('adminUser');
    }

    async function apiGetCurrentUser() {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token && isLocalDevHost()) {
                try {
                    const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
                    const res = await fetch(`${localBase}/auth/me`, {
                        method: 'GET',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    if (res.ok) {
                        const u = await res.json();
                        return {
                            id: u.id,
                            email: u.email,
                            name: u.full_name,
                            full_name: u.full_name,
                            phone: u.phone || '',
                            role: u.role || 'user',
                            avatar_url: u.avatar_url || '',
                            google_id: u.google_id || null,
                            user_metadata: {
                                full_name: u.full_name,
                                phone: u.phone || '',
                                avatar_url: u.avatar_url || ''
                            }
                        };
                    }
                } catch (e) {}
            }
            const cached = JSON.parse(localStorage.getItem(USER_KEY)) || JSON.parse(localStorage.getItem(DEMO_KEY));
            return cached || null;
        } catch (e) {
            return null;
        }
    }

    // ----------------------------------------------------------
    // 5. DASHBOARD & APPOINTMENTS SERVICES
    // ----------------------------------------------------------
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

        try {
            const localBase = (location.port === '8000') ? '/api' : 'http://127.0.0.1:8000/api';
            const token = localStorage.getItem('adminToken') || localStorage.getItem('supabase_token') || localStorage.getItem(TOKEN_KEY);
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const localRes = await fetch(`${localBase}/view_dashboard_kpis`, {
                method: 'GET',
                headers: headers
            });
            if (localRes.ok) {
                const localData = await localRes.json();
                return localData && localData.length > 0 ? localData[0] : null;
            }
        } catch (_) {}

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

    // ----------------------------------------------------------
    // 6. EXPOSE TO GLOBAL SCOPE
    // ----------------------------------------------------------
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
    window.apiGetMyInquiries = apiGetMyInquiries;
    window.apiUpdateMyInquiry = apiUpdateMyInquiry;
    window.apiDeleteMyInquiry = apiDeleteMyInquiry;
    window.apiCancelMyInquiry = apiCancelMyInquiry;
    window.apiGetUsers = apiGetUsers;
    window.apiUpdateAdminProfile = apiUpdateAdminProfile;
    window.apiUpdateAdminPassword = apiUpdateAdminPassword;
    window.apiSignUp = apiSignUp;
    window.apiSignIn = apiSignIn;
    window.apiGetGoogleConfig = apiGetGoogleConfig;
    window.apiSignInWithGoogle = apiSignInWithGoogle;
    window.apiSignOut = apiSignOut;
    window.apiGetCurrentUser = apiGetCurrentUser;
    window.apiGetDashboardKPIs = apiGetDashboardKPIs;
    window.apiGetAppointments = apiGetAppointments;
    window.isSupabaseConfigured = isBackendConfigured;
    window.isBackendConfigured = isBackendConfigured;

    console.log('✓ UrbanScope Live Supabase Cloud Client Connected:', SUPABASE_URL);
})(window);
