# AGENTS.md

Guidance for AI coding agents (Antigravity, Claude Code, Codex, Cursor, Copilot, etc.)
working in this repository. Humans are welcome too — see [README.md](README.md) for the
product overview and [DATABASE.md](DATABASE.md) for the data layer.

---

## Project at a Glance

**UrbanScope** — a real estate website for **CD Miranda Realty** / agent **Mariam Lobren**
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
- Frontend also works from VS Code Live Server (`:5500`); it calls the API at `http://127.0.0.1:8000/api`.
- **Reset data:** delete `backend/urbanscope.db` and restart.

Demo logins: admin `admin@cdmiranda.com` / `admin123` · client `client@example.com` / `client123`.

There is **no test suite, linter, or build step**. Verify changes by running the server
and exercising the page / `/docs` endpoint you touched.

---

## Repository Map

```text
index.html / index.css / index.js   Home page (served at /)
properties/   Catalog, property-detail (?id=N), Liora.html & Airmen.html showcases
inquiry/      Inquiry form (requires login: <html data-require-auth>)
auth/         Client login & register
admin/        Admin login, dashboard, properties table, add-property form
shared/css/   common.css (design tokens, navbar, footer), session, splash, chatbot
shared/js/    supabase.js (API gateway), session.js, splash.js, chatbot.js, api.js
backend/      app.py (routes + static mounts), database.py, models.py, auth.py
assets/images Photos, logos, icons
```

Static folders are mounted by name in `backend/app.py`
(`properties, inquiry, auth, admin, shared, assets`). **A new top-level folder will 404
until you add it to that list.** Root files other than `index.*` and `favicon.ico` are not served.

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

Pages in subfolders use `../` relative paths. `session.js#getBasePath()` hard-codes the
subfolder names — update it if you add a new section folder. Property `image_url` values are
**root-relative** (`assets/images/…`); prefix with the base path when rendering from a subfolder.

### Backend

- All routes live in `backend/app.py`. Raw SQL with `?` placeholders — **never** f-string user
  input into SQL. (The `UPDATE` builder interpolates column names only from Pydantic field names.)
- Always open connections via `get_db_connection()` — it registers the `NORMALIZE()` SQL function
  used for accent-insensitive search.
- Request/response shapes live in `backend/models.py` (Pydantic v2; use `model_dump`, not `dict`).
- Schema changes: follow the checklist in [DATABASE.md §5](DATABASE.md#5-migrations).

---

## Conventions

- **No new dependencies or frameworks** (no React, Tailwind, jQuery, npm) unless the user asks.
- **CSS:** reuse tokens and components from `shared/css/common.css`; feature styles go in the
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

## Known Issues (read before "fixing" things)

These are real gaps in the codebase. Don't silently work around them; mention them or fix them
deliberately if they're in scope.

1. **Admin property pages are disconnected from the API.** `admin/properties.js` reads
   `localStorage["properties"]`; `admin/add-property.js` writes `localStorage["urbanScopeProperties"]`
   (different key, different field names like `propertyName`/`lotArea`). Neither loads `supabase.js`.
2. **No server-side authorization.** Property create/update/delete and `GET /api/inquiries` accept
   unauthenticated requests. The admin gate is client-side only.
3. **`/api/stats`** returns 3 counts; the dashboard shows 5 KPI cards.
4. **`init_db()` runs twice** on startup (module import + lifespan). Harmless because it's idempotent.
5. **README drift:** says 5 seed properties (there are 6) and omits `admin/add-property.*`.
6. CORS is `allow_origins=["*"]` with credentials, and there's a hard-coded fallback JWT secret — dev only.

---

## Safety Rules

- Do **not** commit `backend/urbanscope.db`, `.env`, or virtualenvs (already in `.gitignore`).
- Do **not** run `backend/supabase_schema.sql` against a real project without confirmation —
  it starts with `DROP TABLE … CASCADE`.
- Don't change seed credentials or the JWT secret handling without telling the user.
- Ask before deleting files, renaming `supabase.js`, or restructuring folders — many pages
  hard-code these paths.
