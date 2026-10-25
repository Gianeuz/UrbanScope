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
| Auth | PBKDF2 password hashes + **PyJWT** bearer tokens in `localStorage` |
| Fonts | Plus Jakarta Sans, Dancing Script (Google Fonts) |

---

## Setup & Run

```powershell
pip install -r backend/requirements.txt
python run.py            # serves site + API on http://127.0.0.1:8000
```

- Site: `http://127.0.0.1:8000/` · API docs: `http://127.0.0.1:8000/docs`
- `run.py` uses `uvicorn --reload`, so Python edits hot-reload.
- Env vars: `HOST`, `PORT`, `URBANSCOPE_SECRET_KEY`.
- Frontend also works from VS Code Live Server (`:5500/frontend/`); it calls the API at `http://127.0.0.1:8000/api`.
- **Reset data:** delete `backend/urbanscope.db` and restart (or run `python backend/seed_rbac.py`).

Demo logins:
- Superadmin: `urbanscope.cvsu@gmail.com` / `urbanscope2026`
- Admin: `admin.realestate@gmail.com` / `realestate2026`
- Client: `client@example.com` / `client123`

There is **no test suite, linter, or build step**. Verify changes by running the server
and exercising the page / `/docs` endpoint you touched.

---

## Repository Map

```text
run.py                 Starts FastAPI + static site (uvicorn backend.app:app)
backend/               app.py (routes + static mounts + RBAC guard), database.py, models.py, auth.py, seed_rbac.py, migration_rbac.sql
frontend/              Everything the browser loads (served at /)
  index.html/.css/.js  Home page
  pages/properties/    Catalog, property-detail (?id=N), Liora.html & Airmen.html showcases
  pages/inquiry/       Inquiry form (requires login: <html data-require-auth>)
  pages/auth/          Unified login (auto-routes by role) & register
  pages/admin/         Dashboard, propertylist.html, add-property, edit-property, clients, users, profile, legacy login redirect
  pages/superadmin/    Master overview, system diagnostics & RBAC user role management
  shared/css/          common.css (design tokens, navbar, footer), session, splash, chatbot
  shared/js/           supabase.js (API gateway), session.js, splash.js, chatbot.js, api.js
  assets/images/       Photos, logos, icons
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
  `apiSignOut`, `apiGetCurrentUser`, `isBackendConfigured` / `isSupabaseConfigured`.
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
- Keep `README.md` (structure, endpoints, pages) and `DATABASE.md` in sync with your changes.

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

---

## Safety Rules

- Do **not** commit `backend/urbanscope.db`, `.env`, or virtualenvs (already in `.gitignore`).
- Do **not** run `backend/supabase_schema.sql` against a real project without confirmation —
  it starts with `DROP TABLE … CASCADE`.
- Don't change seed credentials or the JWT secret handling without telling the user.
- Ask before deleting files, renaming `supabase.js`, or restructuring folders — many pages
  hard-code these paths.
