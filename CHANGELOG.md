# UrbanScope — Development Changelog & Chat History

This document records all features, enhancements, bug fixes, user requests, architectural decisions, and verification steps implemented during our pair-programming sessions.

---

## 📌 Session Summary Table

| Date | Category | Summary of Changes | Key Files |
| :--- | :--- | :--- | :--- |
| **Oct 2026** | **Admin Features** | Profile picture upload with strict `< 5MB` limit, canvas compression, topbar avatar sync, reset photo option | `profile.html`, `profile.js`, `profile.css` |
| **Oct 2026** | **Admin UI** | Inquiry details modal (`#inquiryModal`) replacing native browser `alert()` popups with mailto trigger | `dashboard.html`, `dashboard.js`, `dashboard.css` |
| **Oct 2026** | **Inquiry Flow** | Consultation intent modal (`#consultationIntentModal`) on homepage for general vs. property inquiries | `index.html`, `index.js`, `index.css` |
| **Oct 2026** | **Inquiry Page** | Dual-mode inquiry form (General Consultation topic picker vs Specific Property picker), pre-selection support | `inquiry.html`, `inquiry.js`, `inquiry.css` |
| **Oct 2026** | **Navigation** | Replaced placeholder hamburger menu in inquiry header with dedicated pill "Go Back" button (`.go-back-btn`) | `inquiry.html`, `inquiry.css` |
| **Oct 2026** | **UI Consistency** | Unified client profile chip (`.profile-chip` / `.profile-menu`) between homepage and inquiry page | `inquiry.html`, `session.js`, `session.css` |
| **Oct 2026** | **Session Menu** | Removed redundant "Browse Properties" link from client profile dropdown menu | `frontend/shared/js/session.js` |
| **Oct 2026** | **Event Handling** | Fixed `session.js` global document click interceptor bypassing consultation modal on homepage | `session.js`, `index.js` |
| **Oct 2026** | **Legal Hub** | Added Terms of Service (`terms.html`) compliant with RESA (RA 9646) and Privacy Policy (`privacy.html`) compliant with DPA (RA 10173) | `frontend/pages/legal/` |
| **Oct 2026** | **Registration Flow** | Same-tab legal link navigation with `?from=register`, mouse/keyboard back button support, and input draft persistence (`sessionStorage`) | `register.html`, `register.js`, `legal.js`, `legal.css` |
| **Oct 2026** | **Google Auth** | Added Google Identity Services (OAuth 2.0) sign-in & sign-up with FastAPI token verification, SQLite `google_id` migration, Supabase cloud sync, and navbar Google avatar rendering | `backend/auth.py`, `backend/app.py`, `backend/database.py`, `supabase.js`, `auth.js`, `session.js` |

---

## 🔍 Detailed Chronological Log of User Requests & Implementations

### 1. Admin Profile Picture Upload (< 5MB Limit)
- **User Prompt:** *"is it possible to add here a change profile picture and must less than 5mb"*
- **Rationale & Implementation:**
  - Administrators needed the ability to upload and update their profile picture from the `/pages/admin/profile.html` settings page.
  - Added a file input strictly enforcing a **5MB limit** (`file.size <= 5 * 1024 * 1024`), rejecting larger files with an inline warning.
  - Validates image MIME types (`image/png`, `image/jpeg`, `image/webp`).
  - Utilizes HTML5 canvas downsampling to resize and compress avatars into an optimized Data URL.
  - Automatically synchronizes all topbar avatar circles and dropdown menus via `syncAdminProfileDisplay()`.
  - Added a **"Reset Photo"** button allowing administrators to revert back to Miriam Lobren's default photo anytime.
  - Non-destructive SQLite schema support for `avatar_url` in the database.

---

### 2. Consultation Intent Flow & Dual-Mode Inquiry System
- **User Prompt:** *"when im logged in, and when i click this, it redirect to the property i dont want, it should be redirect first to task if it inquiry for property or just asking for specific something"*
- **Rationale & Implementation:**
  - Previously, clicking "Book a Free Consultation" on the homepage directly redirected clients to the inquiry form with a random pre-selected property.
  - Implemented an interactive consultation intent modal (`#consultationIntentModal`) presenting two clear choices:
    1. **General Consultation / Question** (`pages/inquiry/inquiry.html?type=general`): For site viewing, loan pre-approval, and general real estate questions without selecting a specific property.
    2. **Inquire About a Specific Property** (`pages/inquiry/inquiry.html?type=property`): For inquiring on verified accredited listings.
  - In `frontend/pages/inquiry/inquiry.html`:
    - Added segmented mode tabs (`[ General Consultation / Question ]` / `[ Specific Property Inquiry ]`) allowing clients to switch between modes anytime.
    - In **General Consultation mode**: The property summary card is replaced by a Consultation Topic selector and optional date/time schedule picker.
    - In **Property Inquiry mode**: Properties load dynamically via `apiGetProperties()` into `<select id="propertySelect">`, updating thumbnail, title, location, specs, and price in real-time.
    - Property detail and showcase pages (`property-detail.html`, `Liora.html`, `Airmen.html`) pass `?type=property&id=...` or `?title=...` to ensure property-specific inquiries pre-select the correct listing.

---

### 3. Consultation Intent Trigger Event Interception Fix
- **User Prompt:** *"when i click this, it should directly go, it should ask first which one to inquire"*
- **Bug Diagnosis:**
  - `frontend/shared/js/session.js` had a global `document.addEventListener('click', ...)` handler that caught any link containing `inquiry.html` and immediately executed `location.href = href;`, completely intercepting and bypassing the consultation modal.
- **Resolution:**
  - In `session.js`, added checks: `if (e.defaultPrevented) return;` and guarded against elements with `data-bypass-session-nav="true"`, `.cta-consult-btn`, or `#ctaConsultBtn`.
  - In `index.js`, attached the consultation modal click listener using capture phase (`true`) with `e.preventDefault()` and `e.stopPropagation()`.

---

### 4. Inquiry Topbar Navigation & "Go Back" Button
- **User Prompt:** *"remove this on the submit inquiry page, change to go back."*
- **Rationale & Implementation:**
  - The inquiry page had a non-functional placeholder hamburger menu icon in its topbar.
  - Replaced it with a dedicated pill **"Go Back"** button (`.go-back-btn`) containing an SVG left arrow and label.
  - Triggers `window.history.back()` with a fallback to `../../index.html` if direct entry occurred.

---

### 5. Unified Profile Chip Across Home and Inquiry Pages
- **User Prompt:** *"the ui of this should be same on the home page"*
- **Rationale & Implementation:**
  - The inquiry page previously had an outdated, static two-line client badge and placeholder notification bell.
  - Replaced it with the exact unified profile chip (`.profile-chip` / `.profile-menu`) used on the homepage.
  - Renders the dark green circular avatar with client initials, user first name, dropdown chevron toggle, and dropdown menu (Home, Submit an Inquiry, Sign Out).

---

### 6. Session Dropdown Menu Clean-Up
- **User Prompt:** *"remove the browse property here"*
- **Rationale & Implementation:**
  - The public properties catalog (`properties.html`) was deprecated earlier in favor of featured showcase listings.
  - Removed the redundant "Browse Properties" item from the user profile dropdown in `frontend/shared/js/session.js`.

---

### 7. Terms of Service & Privacy Policy Legal Pages
- **User Prompt:** *"add terms of services and privacy policy"*
- **Rationale & Implementation:**
  - Built a dedicated legal hub under `frontend/pages/legal/` (`terms.html`, `privacy.html`, and `legal.css`).
  - **Terms of Service (`terms.html`)**:
    - Tailored to Philippine real estate brokerage operations for Miriam Lobren / CD Miranda Realty.
    - Fully compliant with **Republic Act No. 9646** (Real Estate Service Act - RESA), Professional Regulation Commission (PRC), and DHSUD.
    - 10 sections: Acceptance & Scope, Real Estate Representation, Property Listings & Pricing, Site Viewing & Consultations, Client Accounts & Security, Reservations & Financing, Intellectual Property, Limitation of Liability, Governing Philippine Law (Las Piñas City & Cavite jurisdiction), and Contact Details.
  - **Privacy Policy (`privacy.html`)**:
    - Fully compliant with the **Philippine Data Privacy Act of 2012** (Republic Act No. 10173) and National Privacy Commission (NPC) circulars.
    - 10 sections: Commitment to Privacy, Information We Collect, How We Collect Data, Purpose of Processing, Disclosure & Sharing, Data Storage & Security, Retention Period, Statutory Data Subject Rights, Cookies & Local Storage, and Contact Channels for the Data Protection Officer (DPO).
  - **Styling (`legal.css`)**:
    - Consistent with brand design tokens, featuring document switcher pill tabs (`[ Terms of Service ]` / `[ Privacy Policy ]`), sticky Table of Contents sidebar, styled callouts, responsive tables, and contact card.
  - **Site-wide Integration**:
    - Updated all placeholder `#` links and inline alerts in footers across `frontend/index.html`, `pages/auth/login.html`, `pages/properties/property-detail.html`, `pages/properties/Liora.html`, and `pages/properties/Airmen.html`.

---

### 8. Registration Legal Back Navigation & Form Draft Persistence
- **User Prompt:** *"when i click this and i click back on mouse or keyboard, there should be a go back to registration page when i click back"*
- **Problem Diagnosis:**
  - The registration checkbox links had `target="_blank"`, opening legal pages in a new browser tab with an empty history stack.
  - Consequently, hardware mouse back buttons (Button 4 / Back), keyboard shortcuts (`Alt + Left Arrow`, `Backspace`), and browser back buttons did not return to the registration form.
- **Resolution & Implementation:**
  1. **Same-Tab Navigation**: Removed `target="_blank"` on legal links in `frontend/pages/auth/register.html` and added `?from=register`.
  2. **Form Draft Preservation (`register.js`)**:
     - Added real-time draft caching in `sessionStorage` (`urbanscope_register_draft`).
     - Automatically saves `fullname`, `phone`, `email`, and `terms` checkbox state as the user types and whenever legal links are clicked.
     - Automatically restores all fields upon navigating back so user data is never lost.
     - Clears the draft upon successful account creation.
  3. **Contextual Back Button & Controller (`legal.js` & `legal.css`)**:
     - Added `frontend/pages/legal/legal.js` and styled `.legal-back-btn` inside the hero banner.
     - Dynamically titles the button **"Back to Registration"** when coming from `register.html`.
     - Supports keyboard back shortcuts (`Alt + Left Arrow` and `Backspace` outside form inputs).

### 9. Google Identity Services (OAuth 2.0) Authentication
- **User Prompt:** *"add google authentication"*
- **Rationale & Implementation:**
  - Replaced placeholder `alert()` handlers and the legacy `google_auth.php` redirect on `login.html` ("Continue with Google") and `register.html` ("Sign up with Google") with real Google Identity Services (OAuth 2.0) authentication.
  - **Backend Verification & Config (`backend/auth.py`, `backend/app.py`, `backend/models.py`):**
    - Added zero-dependency `.env` file support (`.env.example` template provided) for `GOOGLE_CLIENT_ID`, activated local git-ignored `.env`, and configured static Web Client ID fallback in `supabase.js` / `api.js` so Google Sign-In works across FastAPI (`:8000`), Live Server (`:5500`), and static deployments.
    - Added `GET /api/auth/google/config` and `POST /api/auth/google`, validating tokens against Google's `oauth2.googleapis.com/tokeninfo` and `www.googleapis.com/oauth2/v3/userinfo` endpoints with strict `GOOGLE_CLIENT_ID` audience verification and `email_verified` enforcement.
  - **Database & Cloud Sync (`backend/database.py`, `supabase.js`, `api.js`):**
    - Added non-destructive `google_id` column migration and partial unique index `idx_users_google_id` to SQLite `users`.
    - Automatically creates new client accounts or links `google_id` to existing accounts while preserving passwords, RBAC roles (`user`, `admin`, `superadmin`), and custom admin avatars, and syncs verified users to Supabase Cloud (`users` table).
  - **UI & Session Polish (`auth.js`, `auth.css`, `session.js`, `session.css`):**
    - Preloads Google OAuth config on page load so `requestAccessToken` runs synchronously on click without triggering browser popup blockers.
    - Displays clean inline status/setup banners instead of blocking `alert()` dialogs, and renders Google profile pictures inside `.profile-avatar` with fallback to user initials.

---

## 🛠️ Verification & Testing Matrix

| Component | Test Performed | Result |
| :--- | :--- | :--- |
| **HTTP Routing** | `curl -s -w "%{http_code}" http://127.0.0.1:8000/pages/legal/terms.html` | `200 OK` |
| **HTTP Routing** | `curl -s -w "%{http_code}" http://127.0.0.1:8000/pages/legal/privacy.html` | `200 OK` |
| **HTTP Routing** | `curl -s -w "%{http_code}" http://127.0.0.1:8000/pages/legal/legal.css` | `200 OK` |
| **HTTP Routing** | `curl -s -w "%{http_code}" http://127.0.0.1:8000/pages/legal/legal.js` | `200 OK` |
| **Link Integrity** | Verified no remaining dead `#` links in footers and forms | Verified |
| **Link Targets** | Verified no `target="_blank"` on registration legal links | Verified |
| **Draft Caching** | Verified `sessionStorage` key `urbanscope_register_draft` saving & restoring | Verified |
| **RBAC Security** | Server-side `rbac_admin_guard_middleware` active on `/pages/admin/*` and `/pages/superadmin/*` | Verified |
