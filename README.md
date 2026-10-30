# UrbanScope — Miriam Lobren Real Estate Agent

> **Better Homes, Brighter Futures**
> A responsive real estate website for property discovery, client inquiries, and admin management.

Built for **Miriam Lobren Real Estate Agent** (Las Piñas & Cavite, Philippines).

---

## ✨ Features

- **Property Showcase** — featured listings with category tabs, detail pages with photo galleries, specs, and maps.
- **Client Accounts & Google Sign-In** — registration with PH phone validation and password strength meter, plus one-click **Google Authentication** (OAuth 2.0 via Google Identity Services); unified sign-in that routes users by role.
- **Consultations & Inquiries** — interactive consultation intent flow allowing clients to book general consultations (free site tripping, loan pre-approval, property advice) or inquire about specific accredited listings.
- **Mira Chatbot** — on-site assistant for navigation, property search by location/budget/type, and financing guidance.
- **Admin Dashboard** — KPI cards, inquiry charts, property CRUD, client inquiry tracking, and user overview.
- **Superadmin Console** — role management (RBAC) and database health checks.
- **Legal & Privacy Hub** — comprehensive Terms of Service (aligned with RESA RA 9646) and Privacy Policy (compliant with Philippine Data Privacy Act RA 10173).
- **Responsive Design** — optimized for desktop, tablet, and mobile.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | HTML5, vanilla CSS3, vanilla JavaScript (ES6) |
| Backend | Python 3, FastAPI, Uvicorn |
| Database | SQLite (auto-created and seeded on first run) |
| Auth | PBKDF2 password hashing, Google Identity Services (OAuth 2.0), JWT (PyJWT) |

---

## 🚀 Getting Started

**Requirements:** Python 3.9+

```bash
pip install -r backend/requirements.txt
python3 run.py
```

| Page | URL |
| :--- | :--- |
| Website | http://127.0.0.1:8000/ |
| Sign-In | http://127.0.0.1:8000/pages/auth/login.html |
| API Docs | http://127.0.0.1:8000/docs |


**Environment variables (optional — or configure in `.env`, see `.env.example`):**

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `HOST` | `127.0.0.1` | Server host |
| `PORT` | `8000` | Server port |
| `URBANSCOPE_SECRET_KEY` | dev fallback | JWT signing secret. **Set this in production.** |
| `GOOGLE_CLIENT_ID` | *(empty)* | Google OAuth 2.0 Web Client ID (`*.apps.googleusercontent.com`) for Google Sign-In |

To reset the data, delete `backend/urbanscope.db` and restart the server.

> [!NOTE]
> Seeded admin accounts are for local development only. Change them and set
> `URBANSCOPE_SECRET_KEY` before deploying publicly.

---

## 📖 User & Administrator Manual

### 1. Client / Homebuyer Guide
- **Browsing Properties:** Visit the home page to view showcased listings, filter by property type (Houses, Townhouses, Lots, Commercial), or use search keywords. Click any property card to view high-resolution photos, pricing, lot/floor area, amenities, and location details.
- **Client Registration & Login:** Click **Sign In** in the top navigation bar. New users can create an account with a name, email, Philippine mobile number (`+63` / `09...`), and password. The system automatically signs you in and secures your session. Form input drafts are preserved in real-time when reviewing Terms of Service and Privacy Policy documents.
- **Consultations & Dual-Mode Inquiries:** On the homepage, clicking **Book a Free Consultation** opens an interactive intent modal allowing clients to choose between *General Consultation / Question* (free site viewing, loan pre-approval, general advice) or *Inquire About a Specific Property* with dynamic listing selection, photo previews, and automated pricing details.
- **Inquiry History & Management:** Access **Inquiry History** via the client profile menu or topbar to track submitted requests, filter by status (*Under Review*, *Scheduled*, *Contacted*, *Cancelled*), modify inquiry messages or contact phones, cancel active requests, or permanently delete records.
- **Legal Compliance:** Review comprehensive, RESA-compliant Terms of Service and NPC-compliant Privacy Policy pages, fully integrated with seamless back navigation.
- **Mira AI Assistant:** Use the floating chatbot bubble in the bottom-right corner for 24/7 assistance: search listings by budget, explore Cavite and Las Piñas locations, or ask about Pag-IBIG and bank financing requirements.

### 2. Administrator Guide (Miriam Lobren & Team)
- **Unified Sign-In:** Log in via `/pages/auth/login.html`. Authorized administrative accounts are automatically routed to the Admin Dashboard.
- **Dashboard Overview & Inquiry Modal:** Monitor business health with key metrics: Total Properties, Total Inquiries, Pending Follow-ups, and recent activity streams. Click **View** on any inquiry to open an interactive modal with full message details, tour schedule, and direct email reply options.
- **Managing Properties (CRUD):**
  - **View Listings:** Access `propertylist.html` to browse active catalog listings with status indicators.
  - **Add Property:** Click **Add New Property** (`add-property.html`) to input property name, category, price (₱), location, bedrooms, bathrooms, dimensions, amenities, and upload images.
  - **Edit Property:** Select **Edit** on any listing card (`edit-property.html`) to update pricing, specifications, or replace photos.
  - **Delete Property:** Remove unlisted or sold properties with immediate database and cache synchronization.
- **Client Inquiries & CRM:** Review client inquiries under `clients.html`, inspect contact information, track message details, and update inquiry follow-up statuses (e.g., *Pending*, *Contacted*, *Scheduled*, *Closed*).
- **Profile Picture Upload & Settings:** Visit `profile.html` to update contact details, change passwords, and upload custom profile photos (< 5MB limit) with automatic canvas optimization, live topbar avatar synchronization, and one-click photo reset. User account directory and role management are reserved for the Superadmin.

### 3. Superadministrator Guide
- **Master Overview:** Access `/pages/superadmin/dashboard.html` for elevated system diagnostics and security governance.
- **RBAC Role & Account Management:** Full user account modification (edit full name, email, contact phone, account role `user`/`admin`/`superadmin`, and password resets) with protected root superadmin credentials.
- **System Health:** Run diagnostics on the SQLite database, triggers, and monitor API connectivity.

---

## 📂 Project Structure

```text
├── run.py              # Starts the server (site + API)
├── backend/            # FastAPI app, database, models, auth
├── frontend/
│   ├── index.html      # Home page
│   ├── pages/          # One folder per feature (auth, properties, inquiry, legal, admin, superadmin)
│   ├── shared/         # Shared CSS & JS (navbar, session, chatbot, API client)
│   └── assets/images/  # Photos, logos, icons
├── DATABASE.md         # Database schema & seed data
├── CHANGELOG.md        # Session changelog & feature log
└── AGENTS.md           # Developer & agent guidelines
```

---

## 📄 Credits

- **Agent:** Miriam Lobren (Real Estate Agent)
- **Platform:** UrbanScope

&copy; 2026 UrbanScope. All rights reserved.