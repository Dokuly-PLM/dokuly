# API Keys

API keys let external systems and scripts authenticate with dokuly's [REST API](../api_manual.md). Keys are managed from the **API keys** tab in the Administration dashboard.

---

## Creating an API Key

1. Navigate to **Admin** in the sidebar
2. Open the **API keys** tab
3. Click **Generate new API Key**
4. Set an **expiry date** for the key
5. In the project table, check **Allow access** for each project the key should be able to reach
6. Click **Submit**

The generated API key is shown once — copy it immediately. If lost, you will need to generate a new key.

---

## Managing Keys

The API keys table shows all active keys with their:

- Creation date
- Expiry date
- Project access scope

To revoke a key, delete it from the table. The key becomes invalid immediately.

---

## Project Access

Each API key has independent project access settings. An API call using a key will only return data from projects the key has been granted access to. Requests for data in other projects return `403 Forbidden`.

This allows you to create narrowly scoped keys — for example, one key for a production automation script that only needs access to a single project.

---

## Using API Keys

See the [REST API overview](../api_manual.md) for authentication details, endpoint documentation, and usage examples.
