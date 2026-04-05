# Production

The production module manages assembly runs through production lots and serial numbers. It provides an overview of your production pipeline, tracks assembly progress, and integrates with inventory and purchasing.

---

## Key Capabilities

- **Production lots** — group items scheduled for assembly with quantity targets and progress tracking
- **Serial numbers** — assign unique serial numbers to individual produced units
- **BOM procurement view** — see stock levels and on-order quantities for all BOM components
- **PO integration** — view related purchase orders and their status per lot
- **Production activity log** — track assembly activity across your organization
- **Global search** — look up serial numbers or part numbers across all production data

---

## Production Dashboard

Navigate to **Production** in the sidebar to see the production overview:

- **Assembly graph** — number of units assembled over time (daily/monthly)
- **Production lots table** — all lots with their status and progress
- **Latest activity** — recent production events
- **Global search** — search by serial number or part number

---

## Production Lots

A lot represents a batch of items to be produced — a run of PCBAs, assemblies, or parts.

### Creating a Lot

1. Click **New production lot**
2. Use the search to find the item you will be assembling (part, PCBA, or assembly)
3. Set the target quantity and assign a project
4. Click **Submit**

### Lot Dashboard

Each lot has the following tabs:

- **Overview** — lot item, quantity, connected project, progress, and notes
- **BOM items** — (PCBAs and assemblies only) shows all BOM components with their total stock and on-order quantities, so you can see at a glance whether you have enough material
- **Procurement** — related purchase orders with their price and delivery status
- **Serial numbers** — create and manage individual produced units

---

## Serial Numbers

Serial numbers are created within a lot to track individual units through production.

Navigate to the **Serial numbers** tab on a lot to:

1. **Create new serial numbers** — generate one or more serial numbers for the lot
2. **Track status** — mark units as in-progress, completed, or failed
3. **Record test data** — attach measurements and test results to individual serial numbers

### Test Data

Each serial number can have associated test data:

- **Scalar measurements** — single numeric values with units
- **Vector measurements** — arrays of data points for waveform or multi-point tests

This lets you build a complete production record for each unit, useful for quality control and traceability.

---

## Inventory Integration

When production units are completed, update [inventory](inventory.md) to reflect the new stock. The BOM items tab on a lot helps you plan procurement by showing current stock levels alongside the quantities needed for the production run.
