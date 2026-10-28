-- ==============================================================================
-- URBANSCOPE - SEED DATA (development / demo only)
-- ==============================================================================
-- Taken from backend/supabase_schema.sql (section 8). Run automatically by
-- `supabase db reset` after all migrations. NOT applied by `supabase db push`.
--
-- Change from the original script: the duplicate users row (id 11) that reused
-- 'urbanscope.cvsu@gmail.com' with a plaintext password was dropped, because it
-- violates the UNIQUE(email) constraint and made the whole seed fail.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 8.1 Seed: Users (Admin Miriam Lobren & Clients)
-- Passwords:
--   urbanscope.cvsu@gmail.com -> urbanscope2026 (or urbanscope)
--   admin@cdmiranda.com       -> admin123
--   client@gmail.com        -> client123
-- ------------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, full_name, phone, role, license_number, avatar_url) VALUES
(
    1,
    'urbanscope.cvsu@gmail.com',
    'b91dfbecc4174a5caaa09dcb3a229bd8$e63fd67ec76ca851e88bcad117fa7ca803bb6015c0852e94d2da659ec48fc6cd',
    'Miriam Lobren',
    '+63 900 000 0000',
    'admin',
    'PRC-REBL #0023456',
    'assets/images/agent.jpg'
),
(
    2,
    'client@gmail.com',
    'e9705b77308841cf0438e44c4ffe5558$3bd6218d77fe579d417878e3e46ce1ea0df816ea49ec9e7d4ec2853e8ff49085',
    'Sample Client',
    '+63 912 345 6789',
    'client',
    NULL,
    'assets/images/agent.jpg'
),
(
    3,
    'sarah.j@gmail.com',
    NULL,
    'Sarah Jenkins',
    '+63 917 111 2233',
    'client',
    NULL,
    'assets/images/agent.jpg'
),
(
    4,
    'mark.cruz@gmail.com',
    NULL,
    'Mark Anthony Cruz',
    '+63 928 444 5566',
    'client',
    NULL,
    'assets/images/agent.jpg'
),
(
    5,
    'maria.santos@gmail.com',
    NULL,
    'Maria Elena Santos',
    '+63 905 777 8899',
    'client',
    NULL,
    'assets/images/agent.jpg'
);

ALTER SEQUENCE users_id_seq RESTART WITH 10;

-- ------------------------------------------------------------------------------
-- 8.2 Seed: Property Types
-- ------------------------------------------------------------------------------
INSERT INTO property_types (id, name, slug, description) VALUES
(1, 'Subdivision', 'subdivision', 'Gated suburban communities featuring standalone residences and security'),
(2, 'Villa', 'villa', 'Spacious luxury houses with landscaped yards and private architecture'),
(3, 'Condominium', 'condominium', 'Mid to high-rise residential buildings with shared amenities and security'),
(4, 'Townhouse', 'townhouse', 'Multi-floor modern residences sharing common side walls'),
(5, 'Triplex', 'triplex', 'Three-unit architectural residential developments with dedicated entries'),
(6, 'Single Attached', 'single-attached', 'Independent house with one boundary wall built against the property line');

ALTER SEQUENCE property_types_id_seq RESTART WITH 10;

-- ------------------------------------------------------------------------------
-- 8.3 Seed: Properties Catalog (All 6 Website Properties)
-- ------------------------------------------------------------------------------
INSERT INTO properties (
    id, agent_id, property_type_id, title, subdivision_name,
    address, city, province, location, property_type,
    price, bedrooms, bathrooms, lot_area, floor_area, carports, storeys,
    status, title_status, image_url, description, amenities, latitude, longitude
) VALUES
(
    1,
    1,
    1,
    'Velemont Residences',
    'Velemont Village',
    'Phase 2, Manuyo Uno',
    'Las Piñas City',
    'Metro Manila',
    'Manuyo, Las Piñas City',
    'Subdivision',
    6880000.00,
    3,
    2,
    120.00,
    95.00,
    2,
    2,
    'Available',
    'Clean Title',
    'assets/images/property1.jpg',
    'Modern suburban residence with spacious layout, 24/7 security, and convenient access to Metro Manila commercial hubs.',
    '24/7 Security, Clubhouse & Function Hall, Swimming Pool, Landscaped Parks, Perimeter Fence',
    14.4842,
    120.9852
),
(
    2,
    1,
    2,
    'Green Valley Villa',
    'Green Valley Heights',
    'Governor Drive, Salawag',
    'Dasmariñas',
    'Cavite',
    'Dasmariñas, Cavite',
    'Villa',
    5200000.00,
    3,
    2,
    95.00,
    82.00,
    1,
    2,
    'Available',
    'Clean Title',
    'assets/images/property2.jpg',
    'Contemporary family villa featuring private vehicle parking, landscaped pocket gardens, and clubhouse amenities.',
    'Gated Community, Pocket Garden, Swimming Pool, Clubhouse, 24/7 Guardhouse',
    14.3294,
    120.9367
),
(
    3,
    1,
    3,
    'Horizon Heights',
    'Horizon Tower Residences',
    'Alabang-Zapote Road, Pamplona Uno',
    'Las Piñas City',
    'Metro Manila',
    'Pamplona, Las Piñas City',
    'Condominium',
    3450000.00,
    1,
    1,
    42.00,
    42.00,
    1,
    15,
    'Available',
    'CCT Ready',
    'assets/images/property3.jpg',
    'High-rise condominium overlooking scenic city views, featuring rooftop infinity pool, fitness gym, and concierge.',
    'Infinity Pool, Rooftop Fitness Gym, Concierge Service, Passenger Elevators, CCTV Surveillance',
    14.4445,
    120.9782
),
(
    4,
    1,
    4,
    'Liora Homes Executive Townhouse',
    'Liora Homes Subdivision',
    'Pasong Buaya II',
    'Imus',
    'Cavite',
    'Pasong Buaya II, Imus, Cavite',
    'Townhouse',
    2400000.00,
    2,
    1,
    48.00,
    43.00,
    1,
    2,
    'Available',
    'Clean Title',
    'assets/images/LioraHomes.jpg',
    'Eco-friendly, modern townhouse community in Imus, Cavite equipped with solar-ready fixtures and community leisure facilities.',
    'Solar-Ready System, Eco-Friendly Lighting, Basketball Court, Children Playground, Multi-purpose Hall',
    14.3850,
    120.9570
),
(
    5,
    1,
    5,
    'Airmen Triplex Modern Residence',
    'Airmen Village',
    'Poblacion',
    'Naic',
    'Cavite',
    'Poblacion, Naic, Cavite',
    'Triplex',
    3100000.00,
    3,
    2,
    80.00,
    72.00,
    1,
    2,
    'Available',
    'Clean Title',
    'assets/images/AirmenTriplex.WEBP',
    'Triplex residential home featuring a master balcony, built-in car garage, contemporary finishes, and proximity to major schools.',
    'Master Bedroom Balcony, Built-in Garage, Modern Kitchen Counter, Cable & Fiber Ready, Accessible to Transport',
    14.3210,
    120.7680
),
(
    6,
    1,
    4,
    'Sunset Heights Executive Townhouse',
    'Sunset Heights Phase 1',
    'Habay I, Tirona Highway',
    'Bacoor',
    'Cavite',
    'Habay, Bacoor, Cavite',
    'Townhouse',
    3800000.00,
    3,
    2,
    100.00,
    75.00,
    1,
    2,
    'Available',
    'Clean Title',
    'assets/images/property3.jpg',
    'Charming 2-storey executive townhouse in Bacoor with immediate access to expressways, schools, and shopping malls.',
    '24/7 Security, Clubhouse, Playground, Basketball Court',
    14.4410,
    120.9420
);

ALTER SEQUENCE properties_id_seq RESTART WITH 20;

-- ------------------------------------------------------------------------------
-- 8.4 Seed: Property Gallery Images (Supports Liora & Airmen Showcases)
-- ------------------------------------------------------------------------------
INSERT INTO property_images (property_id, image_url, caption, display_order, is_primary) VALUES
-- Velemont Residences (ID: 1)
(1, 'assets/images/property1.jpg', 'Exterior Front View', 1, TRUE),
(1, 'assets/images/property2.jpg', 'Living Room & Dining Area', 2, FALSE),
(1, 'assets/images/property3.jpg', 'Master Bedroom', 3, FALSE),

-- Green Valley Villa (ID: 2)
(2, 'assets/images/property2.jpg', 'Villa Front Elevation', 1, TRUE),
(2, 'assets/images/property1.jpg', 'Backyard & Pocket Garden', 2, FALSE),

-- Horizon Heights (ID: 3)
(3, 'assets/images/property3.jpg', 'Building Facade & Amenities', 1, TRUE),
(3, 'assets/images/property1.jpg', 'Studio / 1BR Unit Layout', 2, FALSE),

-- Liora Homes (ID: 4) - Exact match to Liora.html carousel slides
(4, 'assets/images/LioraHomes.jpg', 'Liora Homes Exterior Front', 1, TRUE),
(4, 'assets/images/liora2.JPG', 'Patio Garden', 2, FALSE),
(4, 'assets/images/liora3.JPG', 'Carport Entry', 3, FALSE),
(4, 'assets/images/liora4.JPG', 'Dining Room', 4, FALSE),

-- Airmen Triplex (ID: 5) - Exact match to Airmen.html carousel slides
(5, 'assets/images/AirmenTriplex.WEBP', 'Airmen Triplex Modern Elevation', 1, TRUE),
(5, 'assets/images/liora2.JPG', 'Patio Garden', 2, FALSE),
(5, 'assets/images/liora3.JPG', 'Carport Entry', 3, FALSE),
(5, 'assets/images/liora4.JPG', 'Dining Room', 4, FALSE),

-- Sunset Heights (ID: 6)
(6, 'assets/images/property3.jpg', 'Townhouse Front Elevation', 1, TRUE);

-- ------------------------------------------------------------------------------
-- 8.5 Seed: Property Normalized Features
-- ------------------------------------------------------------------------------
INSERT INTO property_features (property_id, feature_name) VALUES
(1, '24/7 Security'), (1, 'Clubhouse'), (1, 'Swimming Pool'), (1, 'Landscaped Parks'),
(2, 'Gated Community'), (2, 'Pocket Garden'), (2, 'Swimming Pool'), (2, 'Guardhouse'),
(3, 'Infinity Pool'), (3, 'Fitness Gym'), (3, 'Concierge Service'), (3, 'Elevators'),
(4, 'Solar-Ready System'), (4, 'Eco-Friendly Lighting'), (4, 'Basketball Court'), (4, 'Playground'),
(5, 'Master Bedroom Balcony'), (5, 'Built-in Garage'), (5, 'Modern Kitchen Counter'), (5, 'Fiber Ready'),
(6, '24/7 Security'), (6, 'Clubhouse'), (6, 'Playground'), (6, 'Basketball Court');

-- ------------------------------------------------------------------------------
-- 8.6 Seed: Saved Properties (Client Favorites)
-- ------------------------------------------------------------------------------
INSERT INTO saved_properties (user_id, property_id) VALUES
(2, 4), -- Client bookmarked Liora Homes
(2, 5); -- Client bookmarked Airmen Triplex

-- ------------------------------------------------------------------------------
-- 8.7 Seed: Inquiries (Connected with Foreign Keys & Codes)
-- ------------------------------------------------------------------------------
INSERT INTO inquiries (
    id, inquiry_code, client_id, property_id, assigned_agent_id,
    property_title, client_name, client_email, client_phone, message, status
) VALUES
(
    1,
    'INQ-2026-0001',
    3,
    1,
    1,
    'Velemont Residences',
    'Sarah Jenkins',
    'sarah.j@gmail.com',
    '+63 917 111 2233',
    'Good day! I would like to schedule an in-person viewing this coming Saturday afternoon.',
    'Under Review'
),
(
    2,
    'INQ-2026-0002',
    4,
    3,
    1,
    'Horizon Heights',
    'Mark Anthony Cruz',
    'mark.cruz@gmail.com',
    '+63 928 444 5566',
    'Inquiring about payment terms and bank financing requirements for the 1-bedroom unit.',
    'Approved'
),
(
    3,
    'INQ-2026-0003',
    5,
    4,
    1,
    'Liora Homes Executive Townhouse',
    'Maria Elena Santos',
    'maria.santos@gmail.com',
    '+63 905 777 8899',
    'Interested in the reservation fee and expected turnover date for the townhouse.',
    'Completed'
);

ALTER SEQUENCE inquiries_id_seq RESTART WITH 10;

-- ------------------------------------------------------------------------------
-- 8.8 Seed: Inquiry Documents (Sample Proofs for Loan / Verification)
-- ------------------------------------------------------------------------------
INSERT INTO inquiry_documents (inquiry_id, document_type, file_name, file_url, file_size_mb, status, remarks, uploaded_at) VALUES
(2, 'government_id', 'passport_mark_cruz.pdf', 'documents/passport_mark_cruz.pdf', 2.45, 'verified', 'Valid government passport verified.', timezone('utc'::text, now())),
(2, 'proof_of_income', 'coe_payslip_3months.pdf', 'documents/coe_payslip_3months.pdf', 3.80, 'verified', 'Monthly gross income meets mortgage threshold.', timezone('utc'::text, now())),
(1, 'government_id', 'drivers_license_sarah.pdf', 'documents/drivers_license_sarah.pdf', 1.85, 'under_review', 'Awaiting secondary address verification.', timezone('utc'::text, now()));

-- ------------------------------------------------------------------------------
-- 8.9 Seed: Appointments (Viewings for Dashboard Calendar)
-- Matches sample calendar entries in dashboard.js
-- ------------------------------------------------------------------------------
INSERT INTO appointments (client_id, agent_id, property_id, client_name, client_email, client_phone, appointment_date, appointment_time, title, description, status) VALUES
(
    3, 1, 1,
    'Sarah Jenkins', 'sarah.j@gmail.com', '+63 917 111 2233',
    '2026-10-09', '10:00 AM',
    'Client viewing · Velemont Residences',
    'Scheduled in-person property walkthrough with buyer and family.',
    'completed'
),
(
    5, 1, 4,
    'Maria Elena Santos', 'maria.santos@gmail.com', '+63 905 777 8899',
    '2026-10-15', '2:00 PM',
    'Client viewing · Liora Homes',
    'Model unit tour, sample computation presentation, and site reservation.',
    'confirmed'
),
(
    4, 1, 1,
    'Mark Anthony Cruz', 'mark.cruz@gmail.com', '+63 928 444 5566',
    '2026-10-22', '9:30 AM',
    'Client viewing · Victoria Park Residences',
    'Orientation and Pag-IBIG housing loan requirements submission.',
    'scheduled'
);

-- ------------------------------------------------------------------------------
-- 8.10 Seed: Testimonials (Home Page Verified Reviews)
-- ------------------------------------------------------------------------------
INSERT INTO testimonials (user_id, author_name, location, rating, quote, is_featured) VALUES
(
    3,
    'Sarah Jenkins',
    'Las Piñas City',
    5,
    'Ms. Miriam Lobren made buying our first home at Velemont Residences so seamless and stress-free! She guided us through every bank requirement and inspection step with great patience.',
    TRUE
),
(
    4,
    'Mark Anthony Cruz',
    'Cavite',
    5,
    'Very professional and transparent realty service. All property titles and subdivision documents were clearly explained. Highly recommended for OFWs and young families!',
    TRUE
),
(
    5,
    'Maria Elena Santos',
    'Imus, Cavite',
    5,
    'From our very first website inquiry to our house turnover at Liora Homes, CD Miranda Realty and Miriam provided top-notch assistance. Thank you for our family dream home!',
    TRUE
);

-- ------------------------------------------------------------------------------
-- 8.11 Seed: Notifications (Header Bell Icon)
-- ------------------------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, reference_type, reference_id, is_read) VALUES
(1, 'New Property Inquiry', 'Sarah Jenkins submitted a viewing request for Velemont Residences.', 'inquiry', 1, FALSE),
(1, 'Document Uploaded', 'Mark Anthony Cruz submitted Proof of Income for Horizon Heights.', 'inquiry', 2, FALSE),
(1, 'Appointment Reminder', 'Upcoming viewing today at 2:00 PM: Maria Elena Santos at Liora Homes.', 'appointment', 2, FALSE);
