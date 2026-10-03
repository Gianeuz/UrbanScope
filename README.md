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
CD-Miranda-1/
├── index.html                   # Main Home Landing Page
├── properties.html              # Property Listings with Slide-in Filter Drawer
├── property-detail.html         # Individual Property Detail & Gallery Page
├── inquiry.html                 # Client Submit Inquiry Form
├── README.md                    # Project Documentation
│
├── auth/                        # Public User Authentication
│   ├── login.html               # Client Sign-In Page
│   └── register.html            # Client Registration Page
│
├── admin/                       # Administrator Portal
│   ├── login.html               # Admin Sign-In Page
│   ├── dashboard.html           # Admin Analytics Dashboard & Slide-out Sidebar
│   └── properties.html          # Property Management & Add Property Modal
│
└── assets/                      # Centralized Static Assets
    ├── css/                     # Modular Stylesheets
    │   ├── home.css             # Landing page styles
    │   ├── properties.css       # Properties listings & drawer styles
    │   ├── property-detail.css  # Property details & gallery styles
    │   ├── inquiry.css          # Client inquiry styles
    │   ├── auth.css             # Authentication (login & register) styles
    │   ├── dashboard.css        # Admin dashboard & sidebar styles
    │   └── properties-admin.css # Admin property management styles
    │
    ├── js/                      # Frontend Scripts
    │   └── auth.js              # Slideshow carousel, password toggle & strength meter
    │
    └── images/                  # Project Images & Icons
        ├── logo.png             # Real estate agent logo
        ├── logo-urban.png       # UrbanScope branding logo
        ├── favicon.jpg          # Browser tab icon
        ├── home-bg.png          # Hero backdrop image
        ├── Urban.jpg            # Auth showcase image
        ├── agent.jpg            # Agent portrait
        ├── property1.jpg        # Property showcase 1
        ├── property2.jpg        # Property showcase 2
        ├── property3.jpg        # Property showcase 3
        └── *.png                # Interface & social media icons
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
| **Properties** | [`properties.html`](properties.html) | Listings catalog with interactive filter drawer & sorting |
| **Property Details** | [`property-detail.html`](property-detail.html) | High-res photo carousel, specs bar, map, and inquiry card |
| **Submit Inquiry** | [`inquiry.html`](inquiry.html) | Client inquiry form with pre-filled account details |
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