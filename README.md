# UrbanScope — CD Miranda Realty

> **Better Homes, Brighter Futures**
> A responsive real estate website for property discovery, client inquiries, and admin management.

Built for **CD Miranda Realty** and agent **Miriam Lobren** (Las Piñas & Cavite, Philippines).

---

## ✨ Features

- **Property Showcase** — featured listings with category tabs, detail pages with photo galleries, specs, and maps.
- **Client Accounts** — registration with PH phone validation and password strength meter; unified sign-in that routes users by role.
- **Inquiries** — logged-in clients can send inquiries about a property directly to the agent.
- **Mira Chatbot** — on-site assistant for navigation, property search by location/budget/type, and financing guidance.
- **Admin Dashboard** — KPI cards, inquiry charts, property CRUD, client inquiry tracking, and user overview.
- **Superadmin Console** — role management (RBAC) and database health checks.
- **Responsive Design** — optimized for desktop, tablet, and mobile.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | HTML5, vanilla CSS3, vanilla JavaScript (ES6) |
| Backend | Python 3, FastAPI, Uvicorn |
| Database | SQLite (auto-created and seeded on first run) |
| Auth | PBKDF2 password hashing, JWT (PyJWT) |

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


**Environment variables (optional):**

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `HOST` | `127.0.0.1` | Server host |
| `PORT` | `8000` | Server port |
| `URBANSCOPE_SECRET_KEY` | dev fallback | JWT signing secret. **Set this in production.** |

To reset the data, delete `backend/urbanscope.db` and restart the server.

> [!NOTE]
> Seeded admin accounts are for local development only. Change them and set
> `URBANSCOPE_SECRET_KEY` before deploying publicly.

---

## 📂 Project Structure

```text
├── run.py              # Starts the server (site + API)
├── backend/            # FastAPI app, database, models, auth
├── frontend/
│   ├── index.html      # Home page
│   ├── pages/          # One folder per feature (auth, properties, inquiry, admin, superadmin)
│   ├── shared/         # Shared CSS & JS (navbar, session, chatbot, API client)
│   └── assets/images/  # Photos, logos, icons
└── DATABASE.md         # Database schema & seed data
```

---

## 📄 Credits

- **Realty:** CD Miranda Realty
- **Agent:** Miriam Lobren
- **Platform:** UrbanScope

&copy; 2026 UrbanScope. All rights reserved.