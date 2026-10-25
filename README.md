# UrbanScope — CD Miranda Realty

> **Better Homes, Brighter Futures**  
> A modern, responsive real estate web platform designed for property discovery, client inquiry management, and administrative oversight.

---

## 📌 Project Overview

**UrbanScope** is a comprehensive real estate solution tailored for **CD Miranda Realty** and real estate agent **Miriam Lobren**. The platform enables homebuyers and investors to browse curated listings, filter by property type and location, explore detailed property specifications with interactive photo galleries, and submit formal inquiries. It also features a dedicated **Administrator Suite** for tracking KPIs, monthly inquiries, status breakdowns, and property records.

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
  - Always-available floating assistant customized specifically for CD Miranda Realty & Miriam Lobren.
  - Interactive website navigation (shortcuts to Home, Catalog, Consultations, Account).
  - Natural language property queries by location (Las Piñas, Dasmariñas, Bacoor, Imus, Naic), price budget (e.g. "under 5M"), and property type (villas, townhouses, subdivisions).
  - Rich interactive property cards directly inside chat bubbles with pricing and "View Details" links.
  - Step-by-step guidance on booking consultations, requirements, and financing options (Pag-IBIG, bank loans).
  - Session chat history persistence across page navigation with subtle sound feedback.

### 🔐 Authentication Suite (`frontend/pages/auth/`)
- **Unified Sign-In:** Secure split-screen layout with branding slideshow carousel, password visibility toggle, remember-me checkbox, and Google sign-in option. Role-based redirection automatically routes Superadmins to `/pages/superadmin/dashboard.html`, Admins to `/pages/admin/dashboard.html`, and Clients to their requested page or Home.
- **Client Registration:** Name, email, Philippine phone number validation (`+639...` / `09...`), dynamic 4-stage password strength meter, real-time password matching hint, and terms checkbox.
- **Discreet Admin Access:** Role-gated backend middleware protecting administrative consoles with automatic redirects to the unified sign-in page.

### 🛡️ Administrator Suite (`frontend/pages/admin/`)
- **Analytics Dashboard (`dashboard.html`):**
  - **5 Metric KPI Cards:** Total Properties, Total Clients, Total Inquiries, Pending Review, and Completed Inquiries.
  - **Inquiries Overview Chart:** Monthly SVG bar chart with time period filter.
  - **Inquiry Status Donut Chart:** Visual breakdown with status legend (*Submitted, Requirements Submitted, Under Review, Approved, Completed*).
  - **Live Notifications Feed:** Recent platform alerts with relative timestamps.
  - **Recent Inquiries Data Table:** Client name, property, submission timestamp, color-coded status pills, and view actions.
  - **Slide-out Navigation Sidebar:** Accessible via hamburger menu, featuring expandable inquiry sub-categories and quick navigation links.
- **Property Management (`propertylist.html`):**
  - Searchable and status-filterable property table connected directly to the database API.
  - Quick actions for viewing property details, editing listings, toggling status (*Available* / *Sold*), and deleting properties.
- **Property Creation (`add-property.html`):** Full-page form for publishing new properties with specifications, amenities, and image upload.
- **Property Editor (`edit-property.html`):** Dedicated editor to update existing listing specifications and pricing.
- **Client Inquiries (`clients.html`):** Dedicated table to manage client leads, view submitted contact details, and update inquiry review status.
- **User Management (`users.html`):** Overview of registered client accounts.
- **Admin Profile (`profile.html`):** Profile details and security settings for logged-in administrators.

---

## 📂 Project Directory Structure

```text
Mariam-Lobren-Real-Estate/
├── run.py                       # Single-Command Python Server Launcher
├── README.md                    # Project Documentation
├── DATABASE.md                  # SQLite schema, seed data, migrations & Supabase mirror
├── AGENTS.md                    # Guide for AI coding agents (setup, conventions, known issues)
├── CLAUDE.md                    # Claude-specific instructions (imports AGENTS.md)
├── .gitignore                   # Git ignore patterns (.history, temporary files, pycache, .db)
│
├── backend/                     # 🐍 Python FastAPI & SQLite Backend
│   ├── app.py                   # FastAPI REST API routes, static hosting, RBAC guard & CORS
│   ├── database.py              # SQLite connection, tables schema, triggers & seed data
│   ├── models.py                # Pydantic data schemas & request validation
│   ├── auth.py                  # PBKDF2 password hashing, JWT auth & RBAC route dependencies
│   ├── seed_rbac.py             # RBAC migration & admin account verification script
│   ├── migration_rbac.sql       # SQLite triggers & role migration SQL
│   ├── requirements.txt         # Python dependencies (fastapi, uvicorn, pydantic, pyjwt)
│   └── supabase_schema.sql      # Optional PostgreSQL / Supabase mirror (drops tables!)
│
├── frontend/                    # 🌐 Static website (served at /)
│   ├── index.html               # Main Home Landing Page
│   ├── index.css                # Home landing page styles
│   ├── index.js                 # Home interactive controls & category filter
│   │
│   ├── pages/                   # One folder per feature; each page keeps its .html/.css/.js together
│   │   ├── properties/          # Properties Feature Module
│   │   │   ├── properties.html          # Properties catalog with filter drawer
│   │   │   ├── properties.css           # Properties listing & drawer styles
│   │   │   ├── properties.js            # Listing search, filters, category pills & dynamic cards
│   │   │   ├── property-detail.html     # Dynamic property details page
│   │   │   ├── property-detail.css      # Property details specs, gallery & booking card styles
│   │   │   ├── property-detail.js       # Gallery image carousel & dynamic listing loader
│   │   │   ├── Liora.html               # Featured listing: Liora Homes Executive Townhouse
│   │   │   └── Airmen.html              # Featured listing: Airmen Triplex Modern Residence
│   │   │
│   │   ├── inquiry/             # Client Inquiry Feature Module
│   │   │   ├── inquiry.html             # Client inquiry submission form
│   │   │   ├── inquiry.css              # Inquiry form layout, input groups & responsive styles
│   │   │   └── inquiry.js               # Form submission handling & validation
│   │   │
│   │   ├── auth/                # Client Authentication Feature Module
│   │   │   ├── login.html               # Unified sign-in page (auto-routes by RBAC role)
│   │   │   ├── login.js                 # Sign-in authentication logic & role router
│   │   │   ├── register.html            # Client registration page
│   │   │   ├── register.js              # Registration form validation & account creation
│   │   │   ├── auth.css                 # Authentication split-screen layout & input styling
│   │   │   └── auth.js                  # Hero carousel, password visibility toggle & strength meter
│   │   │
│   │   ├── admin/               # Administrator Portal Feature Module
│   │   │   ├── login.html               # Legacy portal login (redirects to /pages/auth/login.html)
│   │   │   ├── dashboard.html           # Admin dashboard analytics & KPI charts
│   │   │   ├── dashboard.css            # Dashboard layout, KPI cards & slide-out sidebar styles
│   │   │   ├── dashboard.js             # Dashboard metrics, chart interactions & sidebar toggle
│   │   │   ├── propertylist.html        # Property management table & live actions
│   │   │   ├── properties.css           # Admin data table, filter pills & modal styles
│   │   │   ├── properties.js            # Admin property CRUD operations, status toggles & delete modal
│   │   │   ├── add-property.html        # Full-page add-property form
│   │   │   ├── add-property.css         # Add-property form styles
│   │   │   ├── add-property.js          # Add-property API submission & cache sync
│   │   │   ├── edit-property.html       # Edit property listing form
│   │   │   ├── edit-property.css        # Edit property form styles
│   │   │   ├── edit-property.js         # Edit property fetch & PUT update handler
│   │   │   ├── clients.html             # Client inquiries & leads management table
│   │   │   ├── clients.css              # Client inquiries styling
│   │   │   ├── clients.js               # Inquiries list, filter & status updater
│   │   │   ├── users.html               # Registered accounts management
│   │   │   ├── users.css                # Users list styles
│   │   │   ├── users.js                 # Users table loader
│   │   │   ├── profile.html             # Admin profile and credentials view
│   │   │   ├── profile.css              # Admin profile styles
│   │   │   └── profile.js               # Admin profile data binder
│   │   │
│   │   └── superadmin/          # Executive Superadmin Console Feature Module
│   │       ├── dashboard.html           # Master overview, system diagnostics & RBAC
│   │       ├── dashboard.css            # Luxury emerald & gold executive console styling
│   │       └── dashboard.js             # RBAC role management, user CRUD & live KPIs
│   │
│   ├── shared/                  # Shared Cross-Cutting Components
│   │   ├── css/
│   │   │   ├── common.css           # Global tokens, reset, typography, shared navbar & footer
│   │   │   ├── splash.css           # Welcome splash screen loader styles
│   │   │   ├── session.css          # User profile avatar, dropdown & login state styles
│   │   │   └── chatbot.css          # Mira AI chatbot widget styling & animations
│   │   └── js/
│   │       ├── api.js               # Python REST API Client (Properties, Inquiries, Auth)
│   │       ├── supabase.js          # Unified Service Gateway (bridges to Python REST API)
│   │       ├── session.js           # Session manager, auth gate, profile pill & dropdown
│   │       ├── splash.js            # Animated welcome splash screen controller
│   │       └── chatbot.js           # Mira AI Real Estate Assistant chatbot engine
│   │
│   └── assets/                  # Static Media Assets
│       └── images/              # Project images, icons & photography
│           ├── logo.png             # Real estate agent branding logo
│           ├── logo-urban.png       # UrbanScope agency logo
│           ├── favicon.jpg          # Browser tab icon
│           ├── home-bg.png          # Hero backdrop photography
│           ├── auth-slide1.jpg, ... # Authentication showcase carousel slides (1-4)
│           ├── Urban.jpg            # Hero showcase photography
│           ├── agent.jpg            # Agent portrait (Miriam Lobren)
│           ├── property1.jpg        # Property showcase 1 (Velemont)
│           ├── property2.jpg        # Property showcase 2 (Green Valley)
│           ├── property3.jpg        # Property showcase 3 (Horizon Heights)
│           ├── LioraHomes.jpg       # Liora Homes cover
│           ├── liora2.JPG, ...      # Liora gallery photos
│           ├── AirmenTriplex.WEBP   # Airmen Triplex showcase
│           └── *.png                # Interface & social media icons (search, email, phone, etc.)
│
└── next-app/                    # 🚧 Unfinished Next.js + Prisma rewrite (not used by run.py)
    ├── package.json, next.config.ts, tsconfig.json, .env.example
    ├── prisma/schema.prisma
    └── src/lib/                 # constants.ts, db.ts, format.ts
```

---

## 🛠️ Technology Stack

- **Backend:** **Python 3** with **FastAPI** (asynchronous, high performance), **Uvicorn** ASGI server.
- **Database & Storage:** **SQLite** with automated relational schema migrations and seed population.
- **Security & Auth:** PBKDF2-HMAC-SHA256 password hashing (standard library `hashlib`) & **PyJWT** token authorization.
- **API Documentation:** Interactive Swagger UI (`/docs`) and ReDoc (`/redoc`).
- **Frontend Core:** HTML5, Modern Vanilla CSS3 (Custom design tokens, Flexbox, Responsive Grid), JavaScript (ES6+).
- **Typography:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [Dancing Script](https://fonts.google.com/specimen/Dancing+Script) via Google Fonts.

---

## 🐍 Python Backend Architecture

The backend is organized under the [`backend/`](backend/) directory and provides a complete RESTful API:

### 1. API Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Service health status |
| **Dashboard**| `GET` | `/api/stats` | Aggregate counts for KPI metric cards *(Admin only)* |
| **Auth** | `POST` | `/api/auth/register` | Register new client account |
| **Auth** | `POST` | `/api/auth/login` | Authenticate client, admin, or superadmin |
| **Auth** | `POST` | `/api/auth/logout` | Revoke session / sign out |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Properties** | `GET` | `/api/properties` | Search & filter property catalog |
| **Properties** | `GET` | `/api/properties/{id}` | Retrieve individual property detail |
| **Properties** | `POST` | `/api/properties` | Add new property listing *(Admin only)* |
| **Properties** | `PUT` | `/api/properties/{id}` | Update listing information *(Admin only)* |
| **Properties** | `DELETE` | `/api/properties/{id}` | Remove listing from database *(Admin only)* |
| **Inquiries** | `POST` | `/api/inquiries` | Submit client inquiry message |
| **Inquiries** | `GET` | `/api/inquiries` | Retrieve all inquiries *(Admin only)* |
| **Superadmin** | `GET` | `/api/superadmin/overview` | Master counts, database metrics & trigger status |
| **Superadmin** | `GET` | `/api/superadmin/users` | List all accounts with RBAC roles |
| **Superadmin** | `PUT` | `/api/superadmin/users/{id}/role` | Promote/demote account roles |
| **Superadmin** | `POST` | `/api/superadmin/users` | Create user/admin from console |
| **Superadmin** | `DELETE` | `/api/superadmin/users/{id}` | Delete account with safety guards |
| **Superadmin** | `GET` | `/api/superadmin/integrity` | Database integrity, foreign keys & trigger checks |

### 2. Default Seed Accounts & Data

When first launched, the SQLite database is automatically generated and populated:
- **Superadmin:** `urbanscope.cvsu@gmail.com` / `urbanscope2026` (role: `superadmin`)
- **Admin Staff:** `admin.realestate@gmail.com` / `realestate2026` (role: `admin`)
- **Demo Client:** `client@example.com` / `client123` (role: `user`)
- **Properties:** 6 showcase listings (Velemont Residences, Green Valley Villa, Horizon Heights, Liora Homes Executive Townhouse, Airmen Triplex Modern Residence, Sunset Heights Executive Townhouse)
- **Inquiries:** Sample client leads pre-loaded for dashboard KPI display.

---

## 💻 Getting Started

### Option 1: Run with Python Server (Recommended)

Run the single-command server runner from the root directory:

```bash
python3 run.py
```

The terminal will launch the server and display all accessible endpoints:
- **Web Application:** `http://localhost:8000/`
- **Properties Catalog:** `http://localhost:8000/pages/properties/properties.html`
- **Sign-In Portal:** `http://localhost:8000/pages/auth/login.html` (auto-routes by role: Superadmin, Admin, Client)
- **Swagger Interactive API Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

> Legacy pre-reorganization URLs (e.g. `/properties/properties.html`, `/pages/admin/properties.html`)
> are permanently redirected to their active `/pages/...` locations.

### Option 2: Live Server or Direct Browser Open

You can also run the frontend via VS Code Live Server (`http://127.0.0.1:5500/frontend/`) or open `frontend/index.html` directly. The frontend REST client will automatically connect to `http://127.0.0.1:8000/api` with full CORS support!

---

## 🗺️ Page Navigation Map

| Page | File | Description |
| :--- | :--- | :--- |
| **Home** | [`frontend/index.html`](frontend/index.html) | Main landing page, search, featured homes, bio, testimonials |
| **Properties** | [`frontend/pages/properties/properties.html`](frontend/pages/properties/properties.html) | Listings catalog with interactive filter drawer & sorting |
| **Property Details** | [`frontend/pages/properties/property-detail.html`](frontend/pages/properties/property-detail.html) | High-res photo carousel, specs bar, map, and inquiry card |
| **Featured: Liora Homes** | [`frontend/pages/properties/Liora.html`](frontend/pages/properties/Liora.html) | Dedicated showcase for Liora Homes Executive Townhouse |
| **Featured: Airmen Triplex** | [`frontend/pages/properties/Airmen.html`](frontend/pages/properties/Airmen.html) | Dedicated showcase for Airmen Triplex Modern Residence |
| **Submit Inquiry** | [`frontend/pages/inquiry/inquiry.html`](frontend/pages/inquiry/inquiry.html) | Client inquiry form with pre-filled account details |
| **Unified Sign-In** | [`frontend/pages/auth/login.html`](frontend/pages/auth/login.html) | Sign-in with split-screen branding & role router |
| **Client Register** | [`frontend/pages/auth/register.html`](frontend/pages/auth/register.html) | Account registration with password strength meter |
| **Admin Login (Legacy)** | [`frontend/pages/admin/login.html`](frontend/pages/admin/login.html) | Redirects to unified sign-in (`pages/auth/login.html`) |
| **Admin Dashboard** | [`frontend/pages/admin/dashboard.html`](frontend/pages/admin/dashboard.html) | Analytics charts, KPI cards, notifications, slide-out sidebar |
| **Admin Property List** | [`frontend/pages/admin/propertylist.html`](frontend/pages/admin/propertylist.html) | Manage listings table with status toggles (*Available*/*Sold*) & delete modal |
| **Admin Add Property** | [`frontend/pages/admin/add-property.html`](frontend/pages/admin/add-property.html) | Full-page form for publishing a listing to database |
| **Admin Edit Property** | [`frontend/pages/admin/edit-property.html`](frontend/pages/admin/edit-property.html) | Dedicated editor to update listing specifications & pricing |
| **Admin Client Inquiries**| [`frontend/pages/admin/clients.html`](frontend/pages/admin/clients.html) | Review client leads, messages, and update status |
| **Admin User Accounts** | [`frontend/pages/admin/users.html`](frontend/pages/admin/users.html) | Overview of registered client accounts & role badges |
| **Admin Profile** | [`frontend/pages/admin/profile.html`](frontend/pages/admin/profile.html) | Administrator personal details & security credentials |
| **Superadmin Console** | [`frontend/pages/superadmin/dashboard.html`](frontend/pages/superadmin/dashboard.html) | Executive diagnostics, database integrity & RBAC management |

When served by `run.py`, each file's URL is its path with `frontend/` removed
(e.g. `frontend/pages/auth/login.html` → `http://localhost:8000/pages/auth/login.html`).

---

## 📄 License & Credits

- **Realty:** CD Miranda Realty
- **Agent:** Miriam Lobren
- **Platform:** UrbanScope Real Estate System
- &copy; 2026 CD Miranda Realty. All rights reserved.