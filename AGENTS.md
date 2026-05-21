# Local100 — AGENTS.md

Restaurant point-of-sale system (gestión de pedidos, mesas, cocina, finanzas).  
Backend: Django 4.2 + DRF. Frontend: React 19 (CRA) + React Router 7.  
Domain language is **Spanish** throughout models, API paths, and UI.

---

## Quick start

```bash
# Full stack via Docker
docker compose up

# Backend only (local)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data            # required: creates initial products + configs
python manage.py runserver

# Frontend only (local)
cd frontend
npm install
npm start                             # dev server on :3000
npm test                              # CRA test runner (interactive watch)
npm run build                         # production build → build/
```

---

## Architecture

### Backend (`backend/`)

| Path | Purpose |
|------|---------|
| `localback/` | Django project config (settings, root URLs, WSGI) |
| `productos/` | Productos CRUD + Configuracion key/value store |
| `pedidos/` | Pedidos (orders), Facturas (invoices), CierreDia (daily close), MovimientoCaja (cash) |
| `filters/` | Shared `FiltersMixin` for custom queryset filtering |
| `manage.py` | Django entrypoint |
| `entrypoint.sh` | Runs `migrate` → `collectstatic` → `seed_data` in Docker |

### API — two versioned namespaces

**`/api/v1/`** — productos + configuraciones  
**`/api/v2/`** — everything else (pedidos, facturas, cierre_dia, movimiento_caja)

Full endpoint list:

- `GET/POST /api/v1/productos/` — Product CRUD
- `GET/POST /api/v1/configuraciones/` — Config key/value CRUD
- `GET/POST /api/v2/pedido/` — Order CRUD (flat)
- `GET/POST /api/v2/pedido_detail/` — Orders with nested line items + auto-invoice
- `GET/POST/PATCH /api/v2/producto_pedido/` — Line items (PATCH to mark `listo_cocina`)
- `GET/POST /api/v2/factura/` — Invoices
- `GET/POST /api/v2/cierre_dia/` — Daily close (create auto-calculates turno, totals)
- `GET/POST /api/v2/movimiento_caja/` — Cash movements (gasto/retiro)

### Frontend (`frontend/src/`)

| Path | Purpose |
|------|---------|
| `api/ListaProductos.js` | All axios calls, uses `REACT_APP_API_URL` |
| `pages/Mesas.jsx` | Table management (main screen) |
| `pages/Cocina.jsx` | Kitchen display |
| `pages/Finanzas.jsx` | Finance / day close |
| `pages/Catalogo.jsx` | Product catalog CRUD |
| `components/ThemeProvider.jsx` | Custom theming (not a UI library) |

---

## Key conventions & gotchas

### Models / Business logic
- **Orders auto-create invoices** on creation (`PedidoDetailSerializer.create`).
- **CierreDia** supports multiple shifts per day (`(fecha, turno)` unique together). Turno is auto-incremented on create.
- **ProductoPedido.listo_cocina** preserves its state across order updates (update doesn't reset it).
- **Product image** stored as base64 text in `imagen` field.
- **DB dual mode**: if `DATABASE_URL` env var is set → PostgreSQL via `dj-database-url`; otherwise falls back to SQLite at `backend/db.sqlite3`.

### Backend
- **Django settings** use `python-decouple` for `SECRET_KEY` (must be in `.env` or environment). The `.env` at repo root has a dev key.
- **DEBUG** is controlled by env var: `os.environ.get("DEBUG", "False") == "True"`.
- **Custom filter system**, NOT `django-filter` (despite it being in requirements). Uses `PedidoFilter` + `FiltersMixin` in `backend/filters/mixins.py`.
- Seed data command: `python manage.py seed_data` — populates initial products (sopas, antojitos, bebidas) and configs. Required for dev.
- `autopep8` is installed for formatting but no config file found — default rules apply.
- Tests exist as stubs (`backend/pedidos/tests.py`, `backend/productos/tests.py`).

### Frontend
- **CRA-based** (react-scripts 5). ESLint extends `react-app` + `react-app/jest`.
- **React 19** + **React Router 7** (NavLink, useLocation, etc.).
- `REACT_APP_API_URL` env var must be set for API calls. Defaults to `http://127.0.0.1:8000` if unset. In Docker build, `ARG REACT_APP_API_URL` is injected at build time.
- **Testing library**: `@testing-library/react` + `@testing-library/jest-dom`. Run with `npm test` (CRA watch mode).
- App.test.js has a single stub test — will fail because the hardcoded `/learn react/i` text doesn't exist.

### Deployment
- **Render.com**: backend via Gunicorn (`localback.wsgi:application`), frontend via Nginx multi-stage build.
- Production frontend is served through Nginx (`frontend/nginx.conf`) with SPA fallback (`try_files $uri /index.html`).
- `entrypoint.sh` runs `migrate`, `collectstatic`, `seed_data` on every container start.

### Environment
- Root `.env` shared by Docker Compose services.
- Docker auto-detection: `IN_DOCKER = os.path.exists('/.dockerenv')` in settings.
- `CORS_ALLOW_ALL_ORIGINS = True` (wide open).
- `ALLOWED_HOSTS` defaults to `.onrender.com,localhost,127.0.0.1`.

---

## Commands cheat sheet

```bash
# Backend
python manage.py migrate              # apply migrations
python manage.py makemigrations        # create migrations
python manage.py seed_data             # seed initial data (products + configs)
python manage.py createsuperuser       # admin access at /admin/
python manage.py test                  # run Django tests
python manage.py runserver             # dev server on :8000
gunicorn localback.wsgi:application    # production server

# Frontend
npm start                              # dev server on :3000
npm test                               # interactive test runner
npm run build                          # production build → build/

# Docker
docker compose up                      # full stack
docker compose up -d                   # detached
docker compose exec backend python manage.py <command>
```

---

## What NOT to do

- Don't confuse `cosas.json` (seed/test data dump) with a config file.
- Don't edit `backend/staticfiles/` — it's the `collectstatic` output.
- Don't hardcode `SECRET_KEY` in settings — it comes from env via `decouple.config`.
- Don't delete `REACT_APP_API_URL` from Docker build args — frontend won't connect to backend.
