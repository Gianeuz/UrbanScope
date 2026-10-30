# AGENTS.md

Guidance for AI coding agents (Antigravity, Claude Code, Codex, Cursor, Copilot, etc.)
working in this repository. Humans are welcome too — see [README.md](README.md) for the
product overview and [DATABASE.md](DATABASE.md) for the data layer.

---

## Project at a Glance

**UrbanScope** — a real estate website for **CD Miranda Realty** / agent **Miriam Lobren**
(Las Piñas & Cavite, Philippines). Public property catalog, client accounts and inquiries,
an admin dashboard, and the "Mira" chatbot.

| Layer | Tech |
| :--- | :--- |
| Frontend | Static **HTML + vanilla CSS + vanilla JS (ES6)** — no framework, no bundler, no npm |
| Backend | **Python 3 + FastAPI + Uvicorn** (`backend/`) |
| Database | **SQLite** file `backend/urbanscope.db` (auto-created and seeded) |
| Auth | PBKDF2 password hashes + **Google Identity Services (OAuth 2.0)** + **PyJWT** bearer tokens in `localStorage` |
| Fonts | Plus Jakarta Sans, Dancing Script (Google Fonts) |

---

## Setup & Run

```powershell
pip install -r backend/requirements.txt
python run.py            # serves site + API on http://127.0.0.1:8000
```

- Site: `http://127.0.0.1:8000/` · API docs: `http://127.0.0.1:8000/docs`
- `run.py` uses `uvicorn --reload`, so Python edits hot-reload.
- Env vars (or `.env` in root — see `.env.example`): `HOST`, `PORT`, `URBANSCOPE_SECRET_KEY`, `GOOGLE_CLIENT_ID`.
- Frontend also works from VS Code Live Server (`:5500/frontend/`); it calls the API at `http://127.0.0.1:8000/api`.
- **Reset data:** delete `backend/urbanscope.db` and restart (or run `python backend/seed_rbac.py`).

Demo logins:
- Superadmin: `urbanscope.cvsu@gmail.com` / `urbanscope2026`
- Admin: `admin.realestate@gmail.com` / `realestate2026`

There is **no test suite, linter, or build step**. Verify changes by running the server
and exercising the page / `/docs` endpoint you touched.

---

## Repository Map

```text
run.py                 Starts FastAPI + static site (uvicorn backend.app:app)
backend/               app.py (routes + static mounts + RBAC guard), database.py, models.py, auth.py, seed_rbac.py, migration_rbac.sql
frontend/              Everything the browser loads (served at /)
  index.html/.css/.js  Home page
  pages/properties/    property-detail (?id=N), Liora.html & Airmen.html showcases (properties.html catalog was removed)
  pages/inquiry/       Inquiry form (inquiry.html) & client history (history.html) (requires login: <html data-require-auth>)
  pages/auth/          Unified login (auto-routes by role) & register
  pages/legal/         Terms of Service (terms.html) & Privacy Policy (privacy.html)
  pages/admin/         Dashboard, propertylist.html, add-property, edit-property, clients, profile, legacy login redirect (users.html redirects)
  pages/superadmin/    Master overview, system diagnostics, user account modification & RBAC management
  shared/css/          common.css (design tokens, navbar, footer), session, splash, chatbot
  shared/js/           supabase.js (API gateway), session.js, splash.js, chatbot.js, api.js
  assets/images/       Photos, logos, icons
supabase/              Supabase CLI project: config.toml, migrations/ (timestamped .sql), seed.sql, scripts/ (one-off SQL Editor fixes) — see DATABASE.md §10
next-app/              Unfinished Next.js + Prisma rewrite — NOT wired up; ignore unless asked
```

Rule of thumb: **one folder per feature under `frontend/pages/`, and each page keeps its
`.html`, `.css`, and `.js` side by side.** Cross-page code goes in `frontend/shared/`.

URLs mirror the folders inside `frontend/` (e.g. `frontend/pages/auth/login.html` →
`/pages/auth/login.html`). `backend/app.py` mounts `frontend/{pages, shared, assets}` and
serves `frontend/index.*` + `favicon.ico`; a new folder directly under `frontend/` will 404
until you add it to that mount list. A new feature folder under `pages/` needs no backend change.
Old pre-reorganization URLs (`/properties/…`, `/inquiry/…`, `/auth/…`, `/admin/…`) 301-redirect
to `/pages/…`.

---

## Architecture Notes

### Frontend → backend

- Pages load **`shared/js/supabase.js`** — *not* `api.js`. Despite the name it has nothing
  to do with Supabase; it's a REST client for FastAPI that exposes globals:
  `apiGetProperties`, `apiGetPropertyById`, `apiAddProperty`, `apiUpdateProperty`,
  `apiDeleteProperty`, `apiSubmitInquiry`, `apiGetInquiries`, `apiSignUp`, `apiSignIn`,
  `apiGetGoogleConfig`, `apiSignInWithGoogle`, `apiSignOut`, `apiGetCurrentUser`,
  `isBackendConfigured` / `isSupabaseConfigured`.
- `shared/js/api.js` is a near-duplicate that no page currently loads. If you change one
  gateway, change both (or consolidate — ask first).
- API base URL: same origin when served on port `8000`, otherwise `http://127.0.0.1:8000/api`.
- Gateway functions return `null` on failure and pages fall back to static data — keep that contract.

### Script load order

`supabase.js` → `session.js` → page script. `session.js` depends on the gateway globals.

### Paths

Pages in `frontend/pages/<section>/` are two levels below the frontend root, so they use
`../../shared/…`, `../../assets/…`, `../../index.html`, and `../<other-section>/…` for sibling
sections. The JS helpers (`getBasePath()` in `session.js`, plus the path resolvers in
`chatbot.js` and `splash.js`) detect `/pages/` in the URL and return `../../` (else `./`).
Login `?redirect=` values are relative to the frontend root (e.g. `pages/inquiry/inquiry.html`).
Property `image_url` values are **root-relative** (`assets/images/…`); prefix with the base
path when rendering from a page.

### Backend & Authorization

- All routes live in `backend/app.py`. Raw SQL with `?` placeholders — **never** f-string user
  input into SQL. (The `UPDATE` builder interpolates column names only from Pydantic field names.)
- Always open connections via `get_db_connection()` — it registers the `NORMALIZE()` SQL function
  used for accent-insensitive search.
- Request/response shapes live in `backend/models.py` (Pydantic v2; use `model_dump`, not `dict`).
- Schema changes: follow the checklist in [DATABASE.md §5](DATABASE.md#5-migrations).
- **Server-Side RBAC Guard:** `backend/app.py` enforces `rbac_admin_guard_middleware` on all requests
  to `/admin`, `/pages/admin/*`, `/superadmin`, and `/pages/superadmin/*`. Unauthenticated users
  are redirected to `/pages/auth/login.html?redirect=...`.
- **API Protection:** Endpoints creating/modifying listings (`POST/PUT/DELETE /api/properties`),
  accessing client inquiries (`GET /api/inquiries`), and reading metrics (`GET /api/stats`) are
  protected by the `require_admin` dependency. Superadmin endpoints (`/api/superadmin/*`) are
  protected by `require_superadmin`.

---

## Conventions

- **No new dependencies or frameworks** (no React, Tailwind, jQuery, npm) unless the user asks.
- **CSS:** reuse tokens and components from `frontend/shared/css/common.css`; feature styles go in the
  feature's own `.css` file. Keep the existing premium look and responsive layouts.
- **JS:** vanilla ES6, IIFE or plain scripts, no modules/bundling. Escape user-provided text before
  inserting into HTML (see `esc()` in `session.js`).
- **HTML:** semantic elements, one `<h1>` per page, descriptive `<title>` and meta description,
  unique `id`s on interactive elements.
- **Python:** follow the existing style — module docstrings, section banner comments, type hints,
  close every connection you open.
- **Locale:** prices in Philippine Pesos (₱), phone numbers in PH format (`+63…` / `09…`),
  place names keep their diacritics (Las Piñas, Dasmariñas).
- Preserve existing comments and docstrings unrelated to your change.
- `README.md` is the **public** overview — keep it short (features, stack, setup, top-level structure) and never
  list admin/superadmin credentials there. Detailed internals belong in `AGENTS.md` / `DATABASE.md`; keep those in sync.
- **Always update documentation (.md) when chatting/completing tasks:** Every change, new route, UI adjustment,
  schema update, or architectural decision MUST immediately be recorded in `AGENTS.md`, `README.md`, and
  `DATABASE.md` as appropriate. Never finish a turn without ensuring markdown documentation reflects the current state.

---

## Known Issues & Notes (read before "fixing" things)

1. **Admin property pages connected to API:** `propertylist.html` and `add-property.html` load
   `supabase.js`, perform live REST calls, and keep `localStorage` caches (`properties`,
   `urbanScopeProperties`, `cached_live_properties`) synchronized for offline resilience.
2. **Server-side authorization active:** Administrative routes and endpoints are strictly guarded
   by `require_admin`, `require_superadmin`, and `rbac_admin_guard_middleware`.
3. **`/api/stats` count:** Returns 3 aggregate counts (`total_properties`, `total_inquiries`,
   `pending_inquiries`); the admin dashboard computes the other 2 cards dynamically from the inquiry list.
4. **`init_db()` runs twice on startup:** (module import + lifespan). Harmless because it's idempotent.
5. **CORS & JWT secrets:** CORS is `allow_origins=["*"]` with credentials, and there's a hard-coded fallback JWT secret — dev only.
6. **Unified Sign-In:** `/pages/admin/login.html` 302-redirects to `/pages/auth/login.html`, which handles
   role detection and redirects clients to home/redirect target, admins to `/pages/admin/dashboard.html`,
   and superadmins to `/pages/superadmin/dashboard.html`.
7. **Admin route aliases:** `/pages/admin/properties.html` and `manage-properties.html` permanently redirect
   to `/pages/admin/propertylist.html`. Full listing editing is handled by `edit-property.html`.
8. **User account management centralized in Superadmin:** The read-only `users.html` link was removed from the
   Admin sidebar navigation. Visiting `/pages/admin/users.html` automatically redirects admins to `dashboard.html`
   and superadmins to `/pages/superadmin/dashboard.html#users`. Superadmins can edit full names, emails, contact phones,
   roles (`user`, `admin`, `superadmin`), and reset passwords via `PUT /api/superadmin/users/{user_id}` and the
   modal in `/pages/superadmin/dashboard.html`. Root account `urbanscope.cvsu@gmail.com` cannot be demoted or renamed.
9. **Admin Topbar Notification Read State:** Clicking the notification bell or opening the dropdown marks notifications
   as viewed in `localStorage` (`admin_notifs_last_viewed` and `admin_notifs_read_ids`). When the unread count reaches `0`,
   the red badge is completely hidden (`display: none`), leaving a clean bell icon without any red dot until new inquiries arrive.
10. **Admin Table Action Buttons & Inquiry Details Modal:** The `Recent Inquiries` table on `/pages/admin/dashboard.html` styles `.action-view-btn`
    with matching brand design tokens (light green `#f0f7f2` background, deep forest `#1e5c33` text, border `#cbe0d1`,
    hover elevation, and an inline SVG eye icon). Clicking "View" pops out a dedicated UI modal (`#inquiryModal`) with
    client initials avatar, submission timestamp, status pill, email link, phone link, property title, tour schedule,
    client message card, "Reply via Email" mailto button, and clean close triggers (X button, Close button, backdrop click, Escape key),
    completely replacing blocking native `alert(...)` popups.
11. **Admin Profile Information & Picture Management (< 5MB limit):** On `/pages/admin/profile.html`, administrators can modify and save all personal and professional credentials: Full Name, Professional Title, Email Address, Contact Phone Number, PRC License Number, Brokerage / Company, Professional Bio & About, and Profile Picture.
    - **Persistence & API Endpoints**: Updates are persisted across both storage layers:
      - Local FastAPI SQLite backend: `PUT /api/admin/profile` and `PUT /api/auth/me` update the `users` table (`full_name`, `email`, `phone`, `license_number`, `title`, `brokerage`, `bio`, `avatar_url`).
      - Supabase Cloud: `apiUpdateAdminProfile` patches or auto-inserts the admin record in the remote `users` table.
      - Client Storage: Synchronizes `urbanscope_admin_profile`, `adminUser`, `urbanscope_user`, and `urbanscope_demo_user` in `localStorage`, guaranteeing instant persistence across page refreshes and offline sessions.
    - **Path Resolution**: `resolveAdminAvatar()` in `admin-shell.js` and `profile.js` normalizes root-relative paths (e.g. `'assets/images/agent.jpg'`) to `'../../assets/images/agent.jpg'`, preventing 404 broken image alt-text across admin pages on Vercel and local subpaths.
    - **Custom Photo State**: The "Reset Photo" button is hidden (`display: none`) when using the default agent photo and only appears when a custom photo (`data:image/...` or external URL) is present.
    - **Error Fallback**: Inline and scripted `onerror` handlers automatically recover to `../../assets/images/agent.jpg` if any network or missing asset error occurs.
12. **Consultation Intent Flow & Dual-Mode Inquiry System:**
    - On the homepage (`index.html`), clicking "Book a Free Consultation" (`.cta-consult-btn` / `#ctaConsultBtn`) or consultation triggers presents an interactive modal (`#consultationIntentModal`) asking the user for their consultation focus instead of immediately forcing an unwanted pre-selected property.
    - The modal offers two clear cards:
      1) *General Consultation / Question* (`pages/inquiry/inquiry.html?type=general`): For site viewing, loan pre-approval, and general real estate questions without selecting a specific property.
      2) *Inquire About a Specific Property* (`pages/inquiry/inquiry.html?type=property`): For inquiring on verified accredited listings.
    - On `frontend/pages/inquiry/inquiry.html`:
      - Features top segmented tabs (`[ General Consultation / Question ]` / `[ Specific Property Inquiry ]`) allowing clients to toggle anytime.
      - In General Consultation mode, the property summary card is replaced by a Consultation Topic selector and optional date/time schedule picker.
      - In Property Inquiry mode, properties are loaded dynamically via `apiGetProperties()` into `<select id="propertySelect">`, updating thumbnail, title, location, specs, and price in real-time.
      - Property detail and showcase pages (`property-detail.html`, `Liora.html`, `Airmen.html`) pass `?type=property&id=...` or `?title=...` to ensure property-specific inquiries pre-select the correct listing.
      - Topbar navigation: The legacy placeholder hamburger menu icon on `pages/inquiry/inquiry.html` was removed and replaced with a dedicated pill "Go Back" button (`.go-back-btn`), which triggers `history.back()` with a fallback to `../../index.html`.
      - Unified profile chip: The legacy two-line client badge and placeholder notification bell on `pages/inquiry/inquiry.html` was replaced with the exact unified profile chip (`.profile-chip` / `.profile-menu`) from the homepage, rendering the dark green circle avatar initials, user first name, chevron dropdown toggle, and dropdown menu (containing Home, Submit an Inquiry, and Sign Out).
      - Cancel button navigates cleanly back to `../../index.html`.
13. **Terms of Service & Privacy Policy Legal Pages:**
    - Dedicated legal hub created under `frontend/pages/legal/` (`terms.html`, `privacy.html`, `legal.css`, and `legal.js`).
    - **Terms of Service (`terms.html`)**: Tailored to Philippine real estate brokerage operations for Miriam Lobren / CD Miranda Realty under Republic Act No. 9646 (Real Estate Service Act - RESA), covering property listings accuracy, pricing disclaimers, free site tripping guidelines, account safety, reservation fees, financing disclosures, limitation of liability, and venue jurisdiction (Las Piñas City & Cavite courts).
    - **Privacy Policy (`privacy.html`)**: Fully compliant with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and National Privacy Commission (NPC) circulars, detailing collected data categories, lawful processing purposes, strict non-disclosure/no-sale policy, physical & electronic security safeguards, data retention schedules, statutory data subject rights (access, correction, erasure, objection, damages), local storage usage, and Data Protection Officer (DPO) contact channels.
    - Features a pill document switcher (`[ Terms of Service ]` / `[ Privacy Policy ]`) allowing seamless switching between both documents, sticky Table of Contents sidebar for rapid navigation, responsive reading typography, and integrated standard navbar & session profile chip.
    - All dead `#` links and inline `alert(...)` handlers across `index.html`, `pages/auth/login.html`, `pages/properties/property-detail.html`, `pages/properties/Liora.html`, and `pages/properties/Airmen.html` are linked directly to these new legal pages.
    - **Registration Back Navigation & Draft Persistence**: In `pages/auth/register.html`, legal links navigate in the same tab (`?from=register`) without `target="_blank"`, allowing the mouse back button (Button 4 / Back) and keyboard back shortcuts (`Alt + Left Arrow`, `Backspace` outside inputs) to return directly to the registration page. `terms.html` and `privacy.html` display a top `.legal-back-btn` dynamically titled **"Back to Registration"**. `register.js` caches typed inputs (`fullname`, `phone`, `email`, `terms`) into `sessionStorage` (`urbanscope_register_draft`) on typing and clicking legal links, automatically restoring every field upon return.
14. **Google Identity Services (OAuth 2.0) Authentication:**
    - Integrated on both `/pages/auth/login.html` (`#googleLoginBtn`, "Continue with Google") and `/pages/auth/register.html` (`#googleSignup`, "Sign up with Google") via `frontend/pages/auth/auth.js` (removing the broken legacy `google_auth.php` redirect and inline `alert()` placeholders).
    - **Configuration:** Reads `GOOGLE_CLIENT_ID` from environment variables or root `.env` (with fallback to `.env.example` in `backend/auth.py` and public Web Client ID fallback in `supabase.js` / `api.js` for Live Server & static Vercel hosting; template in `.env.example`) and exposes public status via `GET /api/auth/google/config`. On remote HTTPS domains (such as Vercel), `isLocalDevHost()` in `supabase.js` / `api.js` skips `http://127.0.0.1:8000` calls to prevent Mixed Content / Private Network Access blocks and popup-blocker delays. Because Google Cloud Console forbids raw loopback IPs (`127.0.0.1`) in **Authorized JavaScript origins**, `auth.js` automatically normalizes `http://127.0.0.1:<port>` to `http://localhost:<port>` — list `http://localhost`, `http://localhost:8000`, `http://localhost:5500`, and your production `https://<your-site>.vercel.app` domain under **Authorized JavaScript origins** (Web application Client ID).
    - **Server-Side Token Verification (`POST /api/auth/google`):** `backend/auth.py` (`verify_google_token`) validates Google OAuth2 access tokens and ID tokens against `oauth2.googleapis.com/tokeninfo` and `www.googleapis.com/oauth2/v3/userinfo`, enforcing strict `GOOGLE_CLIENT_ID` audience (`aud`/`azp`) matching and `email_verified == true`.
    - **Account Linking & Supabase Sync:** Automatically links `google_id` to existing email accounts (preserving passwords, roles, and custom admin avatars) or creates new `user` rows in SQLite (`users.google_id` with partial unique index `idx_users_google_id`), issues UrbanScope JWTs + HTTP-only `access_token` cookies, and syncs the verified record to Supabase Cloud (`REST_BASE/users`).
    - **Navbar Google Avatar Rendering (`session.js` & `session.css`):** Displays verified external Google profile photos (`referrerpolicy="no-referrer"`) inside `.profile-avatar` with automatic fallback to user initials.
15. **Client Inquiry History & Lifecycle Management:**
    - Dedicated client history hub created under `frontend/pages/inquiry/` (`history.html`, `history.css`, and `history.js`).
    - **Navigation Entry Points**:
      - Client profile dropdown menu in `frontend/shared/js/session.js` (`dropdownHtml` renders "Inquiry History" between "Submit an Inquiry" and "Sign Out").
      - Mobile drawer navigation for logged-in clients (`.mobile-drawer-user`).
      - Direct pill link in `inquiry.html` header alongside page title.
    - **Features**:
      - Real-time search query filter across property titles, message content, and contact phones.
      - Status filter segmented tabs: `All`, `Under Review`, `Scheduled`, `Contacted`, `Cancelled`.
      - Real-time KPI stat pills (Total Inquiries, Under Review, Scheduled, Cancelled).
      - **Modify Inquiry (`#modifyModal`)**: Allows clients to update their inquiry message, contact phone, or property/topic title, calling `PUT /api/inquiries/{id}`.
      - **Cancel Inquiry (`#cancelModal`)**: Allows clients to cancel active requests, setting status to `Cancelled` via `POST /api/inquiries/{id}/cancel` while keeping history record intact.
      - **Delete Inquiry (`#deleteModal`)**: Confirms permanent deletion via `DELETE /api/inquiries/{id}`.
    - **Backend Protection**:
      - Endpoints `GET /api/inquiries/my`, `PUT /api/inquiries/{id}`, `DELETE /api/inquiries/{id}`, and `POST /api/inquiries/{id}/cancel` enforce strict client email ownership validation (or administrative privileges), preventing unauthorized cross-user modifications.
16. **Admin & Superadmin Header Isolation (Session Chip Guard):**
    - `frontend/shared/js/session.js` (`renderNavProfile` and `initMobileNav`) enforces an explicit admin route guard (`path.includes('/pages/admin/') || path.includes('/pages/superadmin/')`) and narrows container selectors to `.navbar .nav-acts, .inquiry-topbar .nav-acts, .history-topbar .nav-acts, .nav-acts`. This prevents the client navigation menu (`#profileMenu`, "Home", "Submit an Inquiry", "Inquiry History") from injecting duplicate, unstyled chips into administrative headers.
    - Removed redundant `session.js` script tags from `pages/superadmin/dashboard.html` and `pages/admin/propertylist.html`, ensuring Superadmin (`#saProfileDropdownBtn`) and Admin profile dropdowns render cleanly and exclusively.
17. **Inquiry Submission Modal & Feedback System:**
    - Replaced blocking browser `alert(...)` popups on `frontend/pages/inquiry/inquiry.html` with a dedicated UI Success Modal (`#inquirySuccessModal`) and animated pulse checkmark badge.
    - Centered precisely across zoomed environments (`zoom: 1.25`) by avoiding `100vw/100vh` skew, utilizing `position: fixed; inset: 0; width: 100%; height: 100%; margin: auto;` and `z-index: 9999`.
    - Displays dynamic summary details: Subject/topic, schedule pill (if specified), client contact info (name, email, phone), and `Under Review` status pill.
    - Features action buttons: direct link to 'View in Inquiry History' (`pages/inquiry/history.html`), 'Submit Another' (resets form and closes modal), and 'Back to Home' (`../../index.html`).
    - Added loading state with a spinner (`.btn-spinner`) on the submit button while sending requests to prevent duplicate submissions.
    - Replaced submission failure alerts with a slide-up toast notification (`#toastNotice`).
18. **Idempotent Supabase Schema Migration (`20261028000000_initial_schema.sql`):**
    - Made initial Supabase migration fully idempotent using `CREATE TABLE IF NOT EXISTS` across all 12 tables, `DROP TRIGGER IF EXISTS ... ON ...; CREATE TRIGGER ...` for all 6 triggers, and `DROP POLICY IF EXISTS ... ON ...; CREATE POLICY ...` for all RLS policies.
    - Resolves `ERROR: relation "users" already exists (SQLSTATE 42P07)` in GitHub Actions / Supabase Preview checks during automated branch schema verification.
19. **Admin Profile Password Change & Interoperable Cryptography:**
    - On `/pages/admin/profile.html`, the "Change Password" form is fully wired to verify current credentials and persist new passwords across all architecture tiers:
      - **FastAPI Endpoints**: Implemented `PUT /api/admin/password` and `PUT /api/auth/password` taking `PasswordChangeRequest(current_password, new_password)`. Validates current password against SQLite `users.password_hash` using `verify_password()`, hashes the new password with PBKDF2-HMAC-SHA256 (100,000 iterations), and updates the database row.
      - **Browser WebCrypto PBKDF2 Engine (`supabase.js` & `api.js`)**: Implemented `verifyPBKDF2()` and `hashPBKDF2()` using native `crypto.subtle`, completely matching Python's PBKDF2-HMAC-SHA256 standard without external dependencies.
      - **Supabase Cloud Synchronization**: `apiUpdateAdminPassword` queries Supabase `users`, validates the current password against remote `password_hash` (or default seed fallbacks), generates a fresh PBKDF2 hash, and patches the remote record.
      - **Session & Sign-In Synchronization**: `apiSignIn` checks Supabase `password_hash` with `verifyPBKDF2` and honors updated session passwords (`urbanscope_admin_password_updated` and `adminPassword`), enabling seamless sign-in immediately after changing password.
      - **Dedicated Card Alert Box (`#passwordAlertBox`)**: Added dedicated in-card alert banner in `profile.html` and `showPasswordAlert()` in `profile.js` to provide immediate error/success feedback directly inside the Change Password card without scrolling away.
20. **Supabase migration 0002 (`20261030230000_admin_profile_fields_and_superadmin_role.sql`):**
    - Adds `users.title`, `users.brokerage`, `users.bio` and allows `'superadmin'` in `users_role_check`. Idempotent like 0001.
    - Until it is applied to the live project (`supabase db push` or the Supabase GitHub integration), `apiUpdateAdminProfile` intentionally does **not** send `title`/`brokerage`/`bio` to Supabase (PostgREST would reject unknown columns); those fields persist in SQLite + `localStorage` only.
    - Every migration must be committed to `main` — see DATABASE.md §10.1 team rule.
21. **Dynamic Homepage & Multi-Page Contact Sync with Admin Settings:**
    - Profile information saved on `/pages/admin/profile.html` (Full Name, Title, Email, Phone, License, Brokerage, Bio, Avatar) now automatically and dynamically propagates to the public homepage (`frontend/index.html`), Chatbot Mira (`frontend/shared/js/chatbot.js`), and footers across all site pages.
    - **Homepage Elements Updated (`frontend/index.js` & `index.html`)**:
      - Topbar Nav Brand: `#navAgentName` (clean name without `(Admin)` suffix), `#navAgentTitle` (uppercase role/title).
      - About Me Section: `#aboutAgentName`, `#aboutAgentBrokerage`, `#aboutAgentBioText` (dynamic bio statement), and `#aboutAgentPhoto` (dynamic avatar URL).
      - FAQs Section: `#faqAgentName`, `#faqAgentPhone` (dynamic site tripping contact number), and `#faqContactBtnText` ('Speak with {Name}').
      - CTA Banner: `#ctaAgentName` and `#ctaAgentBrokerage`.
      - Footer: `#footerAgentName`, `#footerAgentBio`, `#footerAgentPhone` (dynamic `tel:` link and formatted number), and `#footerAgentEmail` (dynamic `mailto:` link and address).
    - **Multi-Page Global Footer Sync (`frontend/shared/js/session.js`)**:
      - `syncGlobalFooterContact()` dynamically updates all `.footer-contact a[href^="tel:"]` and `.footer-contact a[href^="mailto:"]` across property details, showcases (`Liora.html`, `Airmen.html`), and legal pages (`terms.html`, `privacy.html`), ensuring contact numbers and emails always match admin settings.
    - **Chatbot Mira Live Agent Info (`frontend/shared/js/chatbot.js`)**:
      - `getLiveAgentInfo()` supplies live agent name, role, brokerage, phone, email, and service areas to Chatbot Mira when answering contact inquiries and agent bio questions.
    - **Public API & Zero-Latency Caching**:
      - Public endpoint `GET /api/agent/profile` in `backend/app.py` serves lead agent credentials without requiring authorization tokens.
      - `apiGetLeadAgentProfile()` in `supabase.js` and `api.js` queries `urbanscope_admin_profile` first for instant 0ms rendering, followed by background synchronization with FastAPI and Supabase Cloud.
      - Real-time multi-tab synchronization via `window.addEventListener('storage', ...)`, `window.addEventListener('focus', ...)`, and custom `urbanscope:profileUpdated` events updates open homepage and client tabs immediately when changes are saved in the admin profile settings.
      - **Target User Email Resolution (`backend/app.py` & Supabase Gateway)**: `PUT /api/admin/profile` resolves target account by `payload.email` first (updating `admin.realestate@gmail.com` / user 1 directly even if the authenticated session has a different user ID, e.g. superadmin or OAuth account, preventing `400 Email is already in use` conflicts). `apiUpdateAdminProfile` in `supabase.js` and `api.js` filters Supabase updates by `email=ilike.${targetEmail}` rather than local SQLite integer IDs (which differ from Supabase IDs), ensuring remote Cloud records stay in sync. Public broker profile `urbanscope_admin_profile` is preserved on logout so unauthenticated visitors continuously see current credentials.

22. **Lead Agent Email & Phone Change Synchronization Across All Architecture Tiers:**
    - Administrators can update their **Email Address** and **Contact Phone Number** on `/pages/admin/profile.html` and have them persist across both local SQLite (`backend/urbanscope.db`) and Supabase Cloud (`users` table), displaying immediately and permanently on the homepage footer (`#footerAgentPhone`, `#footerAgentEmail`), chatbot, and site footers even after logging out.
    - **Original Email Tracking & Account Resolution**:
      - `AdminProfileUpdate` in `backend/models.py` accepts `original_email: Optional[str] = None`.
      - On `/pages/admin/profile.html`, form submission captures `original_email` (the email address before the user edited the input) and sends it in `updatedData`.
      - In `backend/app.py` (`update_current_user_profile`), the backend uses `original_email` first to locate the user row being modified before checking new target email or session IDs, avoiding '0 rows found' and preventing false duplicate conflicts. When email is updated, it automatically adds the new email to `AUTHORIZED_ADMIN_EMAILS`.
    - **Cascading Supabase Cloud Sync (`supabase.js` & `api.js`)**:
      - `apiUpdateAdminProfile` attempts PATCH by `email=ilike.${originalEmail}` first, followed by `email=ilike.${targetEmail}`, and finally falls back to querying `role=eq.admin&order=id.desc&limit=1` and patching by `id=eq.${adminId}`, ensuring remote Cloud user record (e.g. user 15) is guaranteed to update.
      - `apiGetLeadAgentProfile()` queries Supabase Cloud by `cached.email` first or `role=eq.admin&order=id.desc&limit=1` (removing hardcoded `admin.realestate@gmail.com`), so updated email addresses load properly from Supabase on Vercel and remote deployments.
    - **RBAC Guard & Auth Redirection Flexibility**:
      - `require_admin` in `backend/auth.py` and `rbac_admin_guard_middleware` in `backend/app.py` authorize administrative requests if `role in AUTHORIZED_ADMIN_ROLES or email in AUTHORIZED_ADMIN_EMAILS`, preventing admins from getting locked out or redirected to `/index.html` after changing their email.
      - Login redirection (`login.js`, `login_user`, `google_authenticate`) checks `role === 'admin'` to route directly to `../admin/dashboard.html`.

---

## Safety Rules

- Do **not** commit `backend/urbanscope.db`, `.env`, or virtualenvs (already in `.gitignore`).
- Do **not** run `backend/supabase_schema.sql` against a real project without confirmation —
  it starts with `DROP TABLE … CASCADE`.
- Never edit a file in `supabase/migrations/` once it has been applied; add a new
  timestamped migration instead. Don't run `supabase db push` / `db reset --linked` without confirmation.
- Don't change seed credentials or the JWT secret handling without telling the user.
- Ask before deleting files, renaming `supabase.js`, or restructuring folders — many pages
  hard-code these paths.
