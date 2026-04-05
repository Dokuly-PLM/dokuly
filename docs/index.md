# Dokuly PLM System

Dokuly is an open-source Product Lifecycle Management system built for engineering and operations teams that move fast. It gives you structured control over parts, documents, assemblies, purchasing, inventory, production, and more — without the complexity and cost of legacy PLM tools.

**[Get started](quickstart.md)** | **[View on GitHub](https://github.com/Dokuly-PLM/dokuly)**

---

## Core Features

### Product Data Management

Manage your entire product structure with built-in revision control and release management.

- **[Parts](first_part.md)** — Create and track parts with part numbers, manufacturers, MPN, specifications, and file attachments
- **[PCBAs](parts_to_pcbas.md)** — Printed circuit board assemblies with BOM management and designator tracking
- **[Assemblies](pcbas_and_assemblies.md)** — Top-level assemblies containing parts, PCBAs, and sub-assemblies
- **BOM management** — Import/export CSV, pricing rollup, and PO generation directly from BOMs
- **Revision control** — Every change creates a new revision. Released items are immutable
- **Alternate parts** — Link interchangeable parts for procurement flexibility

### [Documents](documents.md)

Create and manage engineering documents with automatic numbering, custom prefixes, and a built-in viewer. Documents support revision control, automatic PDF front page generation, and inline editing with OnlyOffice.

### [Purchasing](purchasing.md)

Track suppliers and pricing, generate purchase orders from BOMs, and manage the full procurement lifecycle from draft to delivery.

### [Inventory](inventory.md)

Manage stock across configurable locations. Track transactions, view current quantities, and forecast needs based on upcoming production.

### [Production](production_control.md)

Plan and track production lots with serial number management, BOM procurement status, and assembly progress tracking.

### [Requirements](requirements.md)

Define and trace requirements in a structured, model-based environment. Support for hierarchical, derived, and superseding relationships with built-in verification tracking.

### [Engineering Change Orders](eco.md)

Formalize engineering changes with ECOs that link affected parts, assemblies, documents, and related issues under a single reviewable record.

### [Projects](projects_and_customers.md)

Organize work by project with access control, time tracking, task management, and Gantt charts. Connect parts, documents, and other items to projects for scoped visibility.

### [API](api_manual.md)

Integrate with external systems using the REST API. Project-scoped API keys with configurable expiry dates. Swagger and ReDoc documentation included.

---

## Integrations

- **DigiKey API** — Search and import parts directly from DigiKey's catalog ([Setup guide](admin/digikey_setup.md))
- **Nexar API** — Search and import parts from the Nexar component database
- **OnlyOffice** — Edit Word, Excel, and PowerPoint documents directly in dokuly

---

## Self-hosting

Dokuly runs as a Docker stack with PostgreSQL, Django, and nginx. Set up takes minutes.

**[Quickstart guide](quickstart.md)**

---

## Contribution

Dokuly was originally developed as an internal tool by [Erik Buer](https://www.linkedin.com/in/erik-buer/) and [Erik Hole](https://www.linkedin.com/in/erik-hole-b7b40196/) and has since been released as an open-source project. Contributions, bug reports, and feature requests are welcome on [GitHub](https://github.com/Dokuly-PLM/dokuly).
