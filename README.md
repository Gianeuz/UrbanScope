# UrbanScope — CD Miranda Realty

> **Better Homes, Brighter Futures**  
> A modern, responsive real estate web platform designed for property discovery, client inquiry management, and administrative oversight.

---

## 📌 Project Overview

**UrbanScope** is a comprehensive real estate solution tailored for **CD Miranda Realty** and real estate agent **Mariam Lobren**. The platform enables homebuyers and investors to browse curated listings, filter by property type and location, explore detailed property specifications with interactive photo galleries, and submit formal inquiries. It also features a dedicated **Administrator Suite** for tracking KPIs, monthly inquiries, status breakdowns, and property records.

---

## 🚀 Key Features

### 🏡 Public & Client Portal
- **Hero & Advanced Search:** Floating multi-parameter search bar with filters for Property Type, City/Location, and Keywords.
- **Featured Listings:** Interactive category carousel tabs (*All, Villas, Apartments, Townhouses, Luxury Villas, House & Lot, Subdivision*).
- **Property Cards:** Interactive favorite (heart) and share actions, bedroom/bathroom/area specs, and price tags.
- **About the Agent:** Professional agent profile and biography section.
- **Client Testimonials:** Highlighting buyer reviews with 5-star ratings.
- **Call-to-Action (CTA):** Consultation booking banner with direct routing to inquiry form.
- **Properties Listing & Filter Drawer:** Slide-in drawer with price ranges, bedroom/bathroom counters, and real-time sorting (*Newest, Price: Low to High, Price: High to Low*).
- **Property Detail Page:**
  - Multi-image photo gallery carousel with clickable thumbnail switcher.
  - Quick specs banner (Bedrooms, Lot Area, Property Type, Location).
  - Detailed features and amenities checklist.
  - Interactive property location map.
  - Inquiry card leading to direct inquiry submission.
- **Client Submit Inquiry:** Pre-filled client account information, property summary snapshot, custom message field, and submission feedback.
- **🤖 Mira — AI Real Estate Concierge (Chatbot):**
  - Always-available floating assistant customized specifically for CD Miranda Realty & Mariam Lobren.
  - Interactive website navigation (shortcuts to Home, Catalog, Consultations, Account).
  - Natural language property queries by location (Las Piñas, Dasmariñas, Bacoor, Imus, Naic), price budget (e.g. "under 5M"), and property type (villas, townhouses, subdivisions).
  - Rich interactive property cards directly inside chat bubbles with pricing and "View Details" links.
  - Step-by-step guidance on booking consultations, requirements, and financing options (Pag-IBIG, bank loans).
  - Session chat history persistence across page navigation with subtle sound feedback.

### 🔐 Authentication Suite (`auth/`)
- **Client Login:** Secure split-screen layout with branding slideshow carousel, password visibility toggle, remember-me checkbox, and Google sign-in option.
- **Client Registration:** Name, email, Philippine phone number validation (`+639...` / `09...`), dynamic 4-stage password strength meter, real-time password matching hint, and terms checkbox.
- **Discreet Admin Access:** Direct route linking authorized staff to the restricted admin portal.

### 🛡️ Administrator Suite (`admin/`)
- **Admin Login:** Dedicated, restricted login page with security auditing notice and password visibility toggle.
- **Analytics Dashboard:**
  - **5 Metric KPI Cards:** Total Properties, Total Clients, Total Inquiries, Pending Review, and Completed Inquiries.
  - **Inquiries Overview Chart:** Monthly SVG bar chart with time period filter.
  - **Inquiry Status Donut Chart:** Visual breakdown with status legend (*Submitted, Requirements Submitted, Under Review, Approved, Completed*).
  - **Live Notifications Feed:** Recent platform alerts with relative timestamps.
  - **Recent Inquiries Data Table:** Client name, property, submission timestamp, color-coded status pills, and view actions.
  - **Slide-out Navigation Sidebar:** Accessible via hamburger menu, featuring expandable inquiry sub-categories and quick navigation links.
- **Property Management:**
  - Searchable and status-filterable property table.
  - Live **"+ Add Property"** modal dialog to create new property listings on the fly.
  - Row actions for viewing, editing, and deleting records.

---

## 📂 Project Directory Structure

```text
Mariam-Lobren-Real-Estate/
├── index.html                   # Main Home Landing Page
├── index.css                    # Home landing page styles
├── index.js                     # Home interactive controls & category filter
├── README.md                    # Project Documentation
├── .gitignore                   # Git ignore patterns (.history, temporary files)
│
├── properties/                  # Properties Feature Module
│   ├── properties.html          # Properties catalog with filter drawer
│   ├── properties.css           # Properties listing & drawer styles
│   ├── properties.js            # Listing search, filters, category pills & dynamic cards
│   ├── property-detail.html     # Dynamic property details page (Supabase / query param)
│   ├── property-detail.css      # Property details specs, gallery & booking card styles
│   ├── property-detail.js       # Gallery image carousel & dynamic listing loader
│   ├── Liora.html               # Featured listing: Liora Homes Executive Townhouse
│   └── Airmen.html              # Featured listing: Airmen Triplex Modern Residence
│
├── inquiry/                     # Client Inquiry Feature Module
│   ├── inquiry.html             # Client inquiry submission form
│   ├── inquiry.css              # Inquiry form layout, input groups & responsive styles
│   └── inquiry.js               # Form submission handling & validation
│
├── auth/                        # Client Authentication Feature Module
│   ├── login.html               # Client sign-in page
│   ├── login.js                 # Client login authentication logic & redirect
│   ├── register.html            # Client registration page
│   ├── register.js              # Registration form validation & account creation
│   ├── auth.css                 # Authentication split-screen layout & input styling
│   └── auth.js                  # Hero carousel, password visibility toggle & strength meter
│
├── admin/                       # Administrator Portal Feature Module
│   ├── login.html               # Admin login portal
│   ├── login.js                 # Admin authentication handler
│   ├── dashboard.html           # Admin dashboard analytics & KPI charts
│   ├── dashboard.css            # Dashboard layout, KPI cards & slide-out sidebar styles
│   ├── dashboard.js             # Dashboard metrics, chart interactions & sidebar toggle
│   ├── properties.html          # Property management table & modal dialog
│   ├── properties.css           # Admin data table, filter pills & modal styles
│   └── properties.js            # Admin property CRUD operations & modal controls
│
├── shared/                      # Shared Cross-Cutting Components
│   ├── css/
│   │   ├── common.css           # Global tokens, reset, typography, shared navbar & footer
│   │   ├── splash.css           # Welcome splash screen loader styles
│   │   ├── session.css          # User profile avatar, dropdown & login state styles
│   │   └── chatbot.css          # Mira AI chatbot widget styling & animations
│   └── js/
│       ├── supabase.js          # Supabase client SDK initialization & DB API helpers
│       ├── session.js           # Session manager, auth gate, profile pill & dropdown
│       ├── splash.js            # Animated welcome splash screen controller
│       └── chatbot.js           # Mira AI Real Estate Assistant chatbot engine
│
└── assets/                      # Static Media Assets
    └── images/                  # Project images, icons & photography
        ├── logo.png             # Real estate agent branding logo
        ├── logo-urban.png       # UrbanScope agency logo
        ├── favicon.jpg          # Browser tab icon
        ├── home-bg.png          # Hero backdrop photography
        ├── Urban.jpg            # Authentication showcase photography
        ├── agent.jpg            # Agent portrait (Mariam Lobren)
        ├── property1.jpg        # Property showcase 1 (Velemont)
        ├── property2.jpg        # Property showcase 2 (Green Valley)
        ├── property3.jpg        # Property showcase 3 (Horizon Heights)
        ├── LioraHomes.jpg       # Liora Homes cover
        ├── liora2.JPG, ...      # Liora gallery photos
        ├── AirmenTriplex.WEBP   # Airmen Triplex showcase
        └── *.png                # Interface & social media icons (search, email, phone, etc.)
```

---

## 🛠️ Technology Stack

- **HTML5:** Semantic elements, form validation, accessible attributes.
- **CSS3:** Responsive Grid, Flexbox, custom design tokens/variables, SVG charting, smooth transitions, mobile-first breakpoints.
- **JavaScript (ES6+):** Interactive image carousels, slide-in drawers, modal dialogs, client-side table filtering, and real-time form validation.
- **Typography:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [Dancing Script](https://fonts.google.com/specimen/Dancing+Script) via Google Fonts.
- **Backend / Database:** [Supabase](https://supabase.com) (PostgreSQL, Realtime, Auth, Storage) via `@supabase/supabase-js`.

---

## 🗄️ Database Integration (Supabase)

The platform is pre-wired to connect directly to your **Supabase** backend using client-side JavaScript.

### 1. Configure Your API Keys
Open [`assets/js/supabase.js`](assets/js/supabase.js) and paste your Project URL and Anon Public Key (found in **Supabase Dashboard &rarr; Project Settings &rarr; API**):

```javascript
const SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
};
```

### 2. Run Database SQL Migration
Execute the following script in your **Supabase SQL Editor** to create the required tables and public policies:

```sql
-- 1. Create Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    property_type TEXT DEFAULT 'Residential',
    price NUMERIC NOT NULL,
    bedrooms INT DEFAULT 3,
    bathrooms INT DEFAULT 2,
    lot_area NUMERIC DEFAULT 120,
    status TEXT DEFAULT 'Available',
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    property_title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'Under Review',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Public Policies
-- Allow anyone to view properties
CREATE POLICY "Allow public read properties" 
ON properties FOR SELECT USING (true);

-- Allow admins/clients to insert properties
CREATE POLICY "Allow insert properties" 
ON properties FOR INSERT WITH CHECK (true);

-- Allow deleting properties
CREATE POLICY "Allow delete properties" 
ON properties FOR DELETE USING (true);

-- Allow public to submit inquiries
CREATE POLICY "Allow public insert inquiries" 
ON inquiries FOR INSERT WITH CHECK (true);

-- Allow reading inquiries (admin / client)
CREATE POLICY "Allow select inquiries" 
ON inquiries FOR SELECT USING (true);

-- 5. Seed Initial Demo Properties
INSERT INTO properties (title, location, property_type, price, bedrooms, bathrooms, lot_area, status, image_url)
VALUES 
('Velemont Residences', 'Manuyo, Las Piñas City', 'Subdivision', 6880000, 3, 2, 120, 'Available', 'assets/images/property1.jpg'),
('Green Valley Villa', 'Dasmariñas, Cavite', 'Villa', 8200000, 3, 2, 120, 'Available', 'assets/images/property2.jpg'),
('Sunset Townhouse', 'Bacoor, Cavite', 'Townhouse', 3800000, 3, 2, 120, 'Available', 'assets/images/property3.jpg');
```

---

## 💻 Getting Started

You can run this project directly in any web browser without build tools or external dependencies.

### Option 1: Live Server (VS Code / Antigravity IDE)
1. Open the project folder in your IDE.
2. Right-click on `index.html` and select **"Open with Live Server"**.

### Option 2: Python Local Server
Run the following command in your terminal from the project root:
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### Option 3: Direct File Open
Simply double-click `index.html` or drag it into any modern web browser.

---

## 🗺️ Page Navigation Map

| Page | URL Path | Description |
| :--- | :--- | :--- |
| **Home** | [`index.html`](index.html) | Main landing page, search, featured homes, bio, testimonials |
| **Properties** | [`properties/properties.html`](properties/properties.html) | Listings catalog with interactive filter drawer & sorting |
| **Property Details** | [`properties/property-detail.html`](properties/property-detail.html) | High-res photo carousel, specs bar, map, and inquiry card |
| **Featured: Liora Homes** | [`properties/Liora.html`](properties/Liora.html) | Dedicated showcase for Liora Homes Executive Townhouse |
| **Featured: Airmen Triplex** | [`properties/Airmen.html`](properties/Airmen.html) | Dedicated showcase for Airmen Triplex Modern Residence |
| **Submit Inquiry** | [`inquiry/inquiry.html`](inquiry/inquiry.html) | Client inquiry form with pre-filled account details |
| **Client Login** | [`auth/login.html`](auth/login.html) | Client sign-in with split-screen branding |
| **Client Register** | [`auth/register.html`](auth/register.html) | Account registration with password strength meter |
| **Admin Login** | [`admin/login.html`](admin/login.html) | Restricted access portal for administrative staff |
| **Admin Dashboard** | [`admin/dashboard.html`](admin/dashboard.html) | Analytics charts, KPI cards, notifications, slide-out sidebar |
| **Admin Properties** | [`admin/properties.html`](admin/properties.html) | Manage listings table with "+ Add Property" modal |

---

## 📄 License & Credits

- **Realty:** CD Miranda Realty
- **Agent:** Mariam Lobren
- **Platform:** UrbanScope Real Estate System
- &copy; 2026 CD Miranda Realty. All rights reserved.