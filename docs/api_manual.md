# REST API

Dokuly includes a REST API for integrating with external systems, scripts, and automation workflows. The API provides read and write access to parts, assemblies, PCBAs, documents, and other resources.

---

## Key Capabilities

- **Project-scoped access** — each API key is granted access to specific projects
- **Expiry dates** — API keys can be set to expire after a defined period
- **Multiple keys** — create separate keys for different integrations or users
- **Swagger and ReDoc** — interactive API documentation is built in

---

## API Documentation

Dokuly serves interactive API documentation at two endpoints:

- **Swagger UI** — available at `/swagger/` on your dokuly instance
- **ReDoc** — available at `/redoc/` on your dokuly instance

These are auto-generated from the API endpoint definitions and show all available endpoints, request/response formats, and parameters.

---

## Authentication

The API uses token-based authentication. Include your API key in the `Authorization` header of every request:

```
Authorization: Api-Key <your-api-key>
```

### Creating an API Key

API keys are created in the [Administration dashboard](admin/api.md):

1. Navigate to **Admin** and open the **API keys** tab
2. Click **Generate new API Key**
3. Set an expiry date
4. Select which projects the key should have access to
5. Click **Submit**
6. Copy the generated key — it is only shown once

!!! tip
    Create separate API keys for each integration. This makes it easy to revoke access for a single system without affecting others.

---

## API Endpoints

The API is versioned and served under `/api/v1/`. Common endpoint patterns:

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Parts | `/api/v1/parts/` | GET, POST |
| Part detail | `/api/v1/parts/<id>/` | GET, PUT |
| Assemblies | `/api/v1/assemblies/` | GET, POST |
| PCBAs | `/api/v1/pcbas/` | GET, POST |
| Documents | `/api/v1/documents/` | GET, POST |
| Projects | `/api/v1/projects/` | GET |

Refer to the Swagger or ReDoc documentation on your instance for the complete list of endpoints and their parameters.

---

## Example: List Parts

```bash
curl -H "Authorization: Api-Key YOUR_KEY" \
     https://your-dokuly-instance/api/v1/parts/
```

Response:

```json
[
  {
    "id": 1,
    "part_number": "EL000001A",
    "display_name": "10k Resistor 0402",
    "release_state": "Released",
    "revision": "A",
    ...
  }
]
```

---

## Access Control

API keys inherit the same project-based access control as user accounts. A request to an endpoint for an item in a project the key does not have access to will return `403 Forbidden`.

---

## Rate Limits

The self-hosted version of dokuly does not impose rate limits by default. If you are running behind a reverse proxy, you can configure rate limiting at the nginx level.
