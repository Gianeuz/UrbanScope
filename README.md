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
├── run.py                       # Single-Command Python Server Launcher
├── index.html                   # Main Home Landing Page
├── index.css                    # Home landing page styles
├── index.js                     # Home interactive controls & category filter
├── README.md                    # Project Documentation
├── DATABASE.md                  # SQLite schema, seed data, migrations & Supabase mirror
├── AGENTS.md                    # Guide for AI coding agents (setup, conventions, known issues)
├── CLAUDE.md                    # Claude-specific instructions (imports AGENTS.md)
├── .gitignore                   # Git ignore patterns (.history, temporary files, pycache, .db)
│
├── backend/                     # 🐍 Python FastAPI & SQLite Backend
│   ├── app.py                   # FastAPI REST API routes, static hosting & CORS
│   ├── database.py              # SQLite connection, tables schema & seed data
│   ├── models.py                # Pydantic data schemas & request validation
│   ├── auth.py                  # PBKDF2 password hashing & PyJWT token auth
│   └── requirements.txt         # Python dependencies (fastapi, uvicorn, pydantic, pyjwt)
│
├── properties/                  # Properties Feature Module
│   ├── properties.html          # Properties catalog with filter drawer
│   ├── properties.css           # Properties listing & drawer styles
│   ├── properties.js            # Listing search, filters, category pills & dynamic cards
│   ├── property-detail.html     # Dynamic property details page
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
│       ├── api.js               # Python REST API Client (Properties, Inquiries, Auth)
│       ├── supabase.js          # Unified Service Gateway (bridges to Python REST API)
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
| **Dashboard**| `GET` | `/api/stats` | Aggregate counts for KPI metric cards |
| **Auth** | `POST` | `/api/auth/register` | Register new client account |
| **Auth** | `POST` | `/api/auth/login` | Authenticate client or admin |
| **Auth** | `POST` | `/api/auth/logout` | Revoke session / sign out |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Properties** | `GET` | `/api/properties` | Search & filter property catalog |
| **Properties** | `GET` | `/api/properties/{id}` | Retrieve individual property detail |
| **Properties** | `POST` | `/api/properties` | Add new property listing (Admin) |
| **Properties** | `PUT` | `/api/properties/{id}` | Update listing information |
| **Properties** | `DELETE` | `/api/properties/{id}` | Remove listing from database |
| **Inquiries** | `POST` | `/api/inquiries` | Submit client inquiry message |
| **Inquiries** | `GET` | `/api/inquiries` | Retrieve all inquiries (Admin) |

### 2. Default Seed Accounts & Data

When first launched, the SQLite database is automatically generated and populated:
- **Admin Staff:** `admin@cdmiranda.com` / `admin123`
- **Demo Client:** `client@example.com` / `client123`
- **Properties:** 5 showcase listings (Velemont Residences, Green Valley, Horizon Heights, Liora Homes, Airmen Triplex)
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
- **Properties Catalog:** `http://localhost:8000/properties/properties.html`
- **Admin Portal:** `http://localhost:8000/admin/login.html` (Login: `admin@cdmiranda.com` / `admin123`)
- **Swagger Interactive API Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

### Option 2: Live Server or Direct Browser Open

You can also run the frontend via VS Code Live Server (`http://127.0.0.1:5500`) or open `index.html` directly. The frontend REST client will automatically connect to `http://127.0.0.1:8000/api` with full CORS support!

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