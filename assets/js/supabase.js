/**
 * UrbanScope - Supabase Client & Database Services
 * ==========================================================
 * Paste your Supabase Project URL and Anon Public Key below.
 * You can find them in Supabase: Project Settings -> API.
 */

const SUPABASE_CONFIG = {
    // 1. Supabase Project URL:
    url: 'https://vfspjuqymfbagesjxjmc.supabase.co',

    // 2. Supabase Anon/Public API Key:
    anonKey: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
};

// Check if credentials have been provided
function isSupabaseConfigured() {
    return SUPABASE_CONFIG.url &&
        !SUPABASE_CONFIG.url.includes('YOUR_PROJECT_ID') &&
        SUPABASE_CONFIG.anonKey &&
        !SUPABASE_CONFIG.anonKey.includes('YOUR_SUPABASE_ANON') &&
        SUPABASE_CONFIG.anonKey.length > 25; // Anon keys are long tokens
}

// Initialize Supabase Client
let dbClient = null;

if (window.supabase && isSupabaseConfigured()) {
    try {
        const targetUrl = SUPABASE_CONFIG.url.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
        dbClient = window.supabase.createClient(targetUrl, SUPABASE_CONFIG.anonKey);
        console.log('✓ Supabase successfully connected!');
    } catch (err) {
        console.error('Supabase initialization failed:', err);
    }
} else {
    console.info('ℹ️ Supabase not yet configured. Update your credentials in assets/js/supabase.js');
}


// ==========================================================
// PROPERTY SERVICES
// ==========================================================

/**
 * Fetch all properties from Supabase
 */
async function apiGetProperties(filter = {}) {
    if (!dbClient) {
        console.warn('Supabase not connected. Using local static data.');
        return null;
    }

    try {
        let query = dbClient.from('properties').select('*').order('created_at', { ascending: false });

        if (filter.type && filter.type !== 'all') {
            query = query.ilike('property_type', `%${filter.type}%`);
        }
        if (filter.location && filter.location !== 'all') {
            query = query.ilike('location', `%${filter.location}%`);
        }
        if (filter.search) {
            query = query.or(`title.ilike.%${filter.search}%,location.ilike.%${filter.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching properties from Supabase:', err.message);
        return null;
    }
}

/**
 * Fetch a single property by ID
 */
async function apiGetPropertyById(id) {
    if (!dbClient) return null;

    try {
        const { data, error } = await dbClient.from('properties').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    } catch (err) {
        console.error(`Error fetching property #${id}:`, err.message);
        return null;
    }
}

/**
 * Add a new property (Admin)
 */
async function apiAddProperty(property) {
    if (!dbClient) {
        alert('Supabase credentials needed in assets/js/supabase.js to save to database.');
        return null;
    }

    try {
        const { data, error } = await dbClient.from('properties').insert([property]).select();
        if (error) throw error;
        return data[0];
    } catch (err) {
        console.error('Error adding property:', err.message);
        alert('Database error: ' + err.message);
        return null;
    }
}

/**
 * Delete a property (Admin)
 */
async function apiDeleteProperty(id) {
    if (!dbClient) return false;

    try {
        const { error } = await dbClient.from('properties').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error(`Error deleting property #${id}:`, err.message);
        return false;
    }
}


// ==========================================================
// INQUIRY SERVICES
// ==========================================================

/**
 * Submit client inquiry
 */
async function apiSubmitInquiry(inquiry) {
    if (!dbClient) {
        console.warn('Supabase not connected. Simulating submission.');
        return { success: true, localOnly: true };
    }

    try {
        const { data, error } = await dbClient.from('inquiries').insert([inquiry]).select();
        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('Error saving inquiry:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Fetch all inquiries (Admin)
 */
async function apiGetInquiries() {
    if (!dbClient) return null;

    try {
        const { data, error } = await dbClient.from('inquiries').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching inquiries:', err.message);
        return null;
    }
}


// ==========================================================
// AUTHENTICATION SERVICES
// ==========================================================

/**
 * Sign up new user
 */
async function apiSignUp(email, password, fullName, phone) {
    if (!dbClient) {
        alert('Please configure your Supabase URL & Key in assets/js/supabase.js');
        return { success: false };
    }

    try {
        const { data, error } = await dbClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone
                }
            }
        });

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Sign in existing user
 */
async function apiSignIn(email, password) {
    if (!dbClient) {
        alert('Please configure your Supabase URL & Key in assets/js/supabase.js');
        return { success: false };
    }

    try {
        const { data, error } = await dbClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Sign out current user
 */
async function apiSignOut() {
    if (!dbClient) return;
    await dbClient.auth.signOut();
}

/**
 * Get current session / user
 */
async function apiGetCurrentUser() {
    if (!dbClient) return null;
    const { data: { session } } = await dbClient.auth.getSession();
    return session ? session.user : null;
}
