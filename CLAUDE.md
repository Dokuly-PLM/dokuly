# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Dokuly

Dokuly is an open-source Product Lifecycle Management (PLM) system. It manages parts, PCBAs, assemblies, documents, projects, customers, purchasing, inventory, production, requirements, and ECOs (Engineering Change Orders).

## Architecture

**Full-stack Django + React application:**

- **Backend**: Django (Python) with Django REST Framework, served from `dokuly/` directory
- **Frontend**: React 18 SPA, source in `dokuly/frontend/src/`, built with Vite, output goes to `dokuly/frontend/static/frontend/`
- **Database**: PostgreSQL 15
- **Auth**: Knox token auth + expiring token auth; token stored in `localStorage` as `"token"`

**Django app structure** (each is a standalone Django app under `dokuly/`):
`parts`, `assemblies`, `pcbas`, `documents`, `projects`, `customers`, `purchasing`, `inventory`, `production`, `requirements`, `eco`, `traceability`, `profiles`, `organizations`, `tenants`, `timetracking`, `files`, `images`, `part_numbers`, `assembly_bom`

Each Django app typically has: `models.py`, `serializers.py`, `views.py`, `urls.py`, and sometimes split views (`viewFiles.py`, `viewsPrice.py`, etc.).

**Frontend structure** (`dokuly/frontend/src/components/`):
Mirrors backend domains — `parts/`, `assemblies/`, `pcbas/`, `documents/`, `projects/`, `purchasing/`, etc. plus `common/`, `layout/`, `dokuly_components/` (shared UI).

API calls use `axios` with the `tokenConfig()` helper from `common/queries.js` which attaches the Knox token from localStorage.

**Public REST API** (v1) lives under `dokuly/API/v1/` — separate URL files per domain, exposed at `/api/v1/...`. Swagger UI at `/swagger/`, ReDoc at `/redoc/`.

## Development Commands

### Frontend
```bash
# Run from repo root
npm run dev:build          # Watch mode build (development)
npm run dev:with-reload    # Watch + browser-sync auto-reload
npm run build              # Production build
npm run lint               # ESLint with auto-fix
npm run lint:check         # ESLint check only
npm run format             # Prettier format
```

### Backend (via Docker)

There is no local Python environment. All Django commands run inside the Docker container:

```bash
# Mac (always use -f docker-compose-dev-mac.yml)
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py makemigrations
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py migrate
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test parts
```

The web container working directory is `/dokuly_image`, so manage.py is at `/dokuly_image/dokuly/manage.py`.

### Docker (full stack)
```bash
npm run dev:docker           # Linux
npm run dev:docker:mac       # Mac (uses docker-compose-dev-mac.yml)
# Or directly:
docker compose -f docker-compose-dev-mac.yml up -d   # Mac
```

The Docker setup runs: PostgreSQL on default port, pgAdmin on :3030, Django on :8000, nginx on :80.

## Environment

- `DJANGO_LOCAL_SERVER=1` — enables debug mode, permissive CORS/CSRF, `ALLOWED_HOSTS = ["*"]`
- `DJANGO_TESTING_SERVER=1` — disables `debug_toolbar` (required for tests)
- `django_secret_key` — Django secret key (defaults to placeholder in local mode)
- Database config via `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD`

A `.env` file at repo root is loaded by docker-compose.

## Key Patterns

**Django views**: Function-based views using DRF decorators (`@api_view`, `@permission_classes`). Most views check `request.user.is_authenticated` and organization/project membership before returning data.

**Frontend queries**: Each feature folder has a `queries.js` (or similar) exporting async functions that call `axios.get/post/put` with `tokenConfig()`. Components call these in `useEffect` hooks.

**Multi-tenancy**: Users belong to `Organization` and `Profile` models. Data is scoped to organizations. `tenants` app handles domain-based tenant routing.

**Revision control**: Parts, PCBAs, assemblies, and documents all have `revision` and `release_state` fields. A new revision creates a new DB row; `part_number` stays the same across revisions.
