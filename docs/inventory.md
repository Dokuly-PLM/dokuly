# Inventory

The inventory module tracks stock levels for parts, PCBAs, and assemblies across configurable storage locations. Every stock change is recorded as a transaction, giving you a complete history and accurate current totals.

---

## Key Capabilities

- **Transaction-based tracking** — every add or remove is logged with timestamp and user
- **Multiple locations** — define storage locations organized by type, room, and grid position
- **Current stock** — computed from the sum of all transactions for each item
- **Per-item inventory tab** — view stock, take or remove items, and see transaction history directly on any part, PCBA, or assembly
- **Customer ownership** — optionally assign stock to a customer for consignment or customer-owned inventory
- **Production lot linking** — inventory transactions can reference a production lot

---

## Locations

Locations represent physical storage positions — shelves, bins, rooms, or warehouses. Each location has:

- **Name** and **room** — human-readable identifiers
- **Location type** — a configurable category (e.g., Shelf, Bin, Warehouse)
- **Grid position** — optional row and column for matrix-style storage (e.g., rack A, shelf 3)
- **Location number** — a manual identifier for your labeling system

### Setting Up Locations

Locations and location types are configured in the [Administration dashboard](admin/settings.md) under the **Locations** tab:

1. **Create a location type** — click **Add type**, enter a name (e.g., "Shelf", "Cold storage"), and submit
2. **Create locations** — click **Add location**, select a type, and fill in the name, room, and optional grid position

!!! tip
    Location types with rows and columns are useful for matrix storage systems like component reels in labeled racks.

---

## Managing Stock

Stock is managed from the **Inventory** tab on any part, PCBA, or assembly.

### Adding Stock

1. Navigate to the item's **Inventory** tab
2. Click **Add stock** (or the equivalent action)
3. Select the target location
4. Enter the quantity
5. Submit

### Removing Stock

Follow the same process but enter a negative quantity or use the **Remove stock** action. The transaction is logged with the user and timestamp.

### Viewing Current Stock

The Inventory tab shows:

- **Current total stock** across all locations
- **Stock per location** — breakdown by storage location
- **Transaction history** — chronological log of all adds and removes

---

## Forecasting

Inventory data integrates with the purchasing and production modules. When viewing a production lot's **BOM items** tab, you can see:

- Current stock for each BOM component
- On-order quantities from open purchase orders
- Shortfall quantities that need to be procured

This helps you make informed purchasing decisions before starting a production run.
