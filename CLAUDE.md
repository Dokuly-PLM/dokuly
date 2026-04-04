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

There is no local Python environment. All Django commands run inside the Docker container. **Assume the Docker stack is already running** (see “Docker (full stack)” below). If `exec` fails because the `web` service is not up, **do not** switch to `docker compose run` workarounds—tell the developer to start the stack, then retry.

```bash
# Mac (always use -f docker-compose-dev-mac.yml)
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py makemigrations
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py migrate
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test
docker compose -f docker-compose-dev-mac.yml exec web python /dokuly_image/dokuly/manage.py test parts
```

**Django migrations**: Do not create or edit files under `*/migrations/` by hand. After model changes, always run `makemigrations` then `migrate` via Django in Docker (commands in the block above).

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

## Access Control & Security (mandatory for all views)

Every Django view that returns or mutates data **must** enforce access control. Follow this checklist when writing or reviewing views:

1. **Authentication**: Use `@permission_classes([IsAuthenticated])` (DRF) on every view that serves user data. The only exception is endpoints explicitly designed for unauthenticated access (e.g. OODS callbacks, token-protected download endpoints) — these must use signed token verification instead.

2. **Project-scoped access**: After fetching the object(s), call `check_project_access(queryset, request.user)` from `projects.views`. This verifies the user is a member of the object's project (or the object has no project). Return `403 Forbidden` if the check fails.
   ```python
   from projects.views import check_project_access

   file_qs = File.objects.filter(id=file_id)
   if not check_project_access(file_qs, user):
       return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)
   ```

3. **Token-protected unauthenticated endpoints**: When a service (OnlyOffice, 3D viewer, etc.) needs to download a file without a user session, use `TimestampSigner` to generate a short-lived signed token. The token must only be issued from an authenticated, project-access-verified endpoint (i.e. steps 1 and 2 above must pass before generating the token). The download endpoint uses `@permission_classes([AllowAny])` but **must** verify the signed token before serving any data. See `files/onlyoffice_views.py` for the pattern.

4. **Release state**: Before allowing mutations on revisioned objects (Part, Assembly, Pcba, Document), check `release_state != "Released"`. Released items are immutable.

5. **Admin checks**: Use `check_permissions_admin(user)` from `profiles.views` for admin-only operations.

Do **not** skip or weaken these checks, even for "internal" or "utility" endpoints. Every endpoint is reachable by any authenticated user unless guarded.

**Model fields**: When adding new fields to Django models, always include a `help_text` description on the field itself (e.g. `models.CharField(max_length=100, help_text="Short explanation of the field's purpose")`). This makes the schema self-documenting and surfaces in admin, DRF browsable API, and generated docs.

Dokuly components shall be used when available. They are found in `dokuly/frontend/src/components/dokuly_components` and there are also common components and functions found in `dokuly/frontend/src/components/common` that should be used for most reusable code.

## Design Language ("Clinical Architect")

See `design.md` for the full specification. Key rules for writing frontend code:

**Font**: Inter (loaded via Google Fonts). Tabular numerals enabled globally. Do not use other fonts.

**Colors**: Primary `#165216`, page background `#FAFAFA`, card/header/sidebar backgrounds `#FFFFFF`, borders `#E5E5E5`. Use existing `.dokuly-bg-*` and `.dokuly-*` CSS classes for semantic colors.

**Cards**: `border-radius: 4px`, `1px solid #E5E5E5` border, no box-shadow. Default via `card rounded m-3 p-3`.

**Tables**: Uppercase small gray headers (`0.75rem`), tight row padding (`0.5rem 0.75rem`), subtle hover (`#F9FAFB`). Styled via CSS overrides on `.table` — no inline style needed.

**Tabs**: 2px bottom-border active indicator in primary green. Use `DokulyTabs` component with `<span>` titles (not `<h6>`).

**Section labels**: Use `CardTitle` component or `.dokuly-section-label` class (small, uppercase, gray, semibold).

**Buttons**: `font-weight: 600`. No scale-up on hover (opacity shift instead). Subtle `scale(0.98)` on click.

**Sidebar**: Collapses to 56px icon-only below 1610px, expands to 200px on hover. No scale transforms on nav items.

**Dividers**: Use `.dokuly-divider` for hairline separators between content sections. 
