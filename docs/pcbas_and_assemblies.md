# PCBAs and Assemblies

This page covers BOM management details for PCBAs and assemblies, and explains the item hierarchy in dokuly.

---

## Item Hierarchy

Dokuly organizes product data in three levels, defined by what each item's BOM can contain:

1. **Assemblies** — top level. BOM can contain parts, PCBAs, and other assemblies.
2. **PCBAs** — mid level. BOM can contain parts and other PCBAs.
3. **Parts** — lowest level. Standalone components with no BOM.

This hierarchy lets you model complex products: an assembly contains PCBAs and mechanical parts, each PCBA contains electronic components, and so on.

---

## Creating an Assembly

1. Navigate to **Assemblies** in the sidebar
2. Click **New assembly**
3. Fill in the project, display name, and other details
4. Click **Submit**

The assembly dashboard is similar to PCBAs and parts — Overview, BOM, Issues, Inventory, Notes, Reference Documents, and Revisions.

---

## BOM Management

Both PCBAs and assemblies use the same BOM interface. See [From Parts to PCBAs](parts_to_pcbas.md) for the full guide on adding items, inline editing, CSV import/export, and clearing.

The key difference is what each type can contain:

| Parent | Can contain |
|--------|-------------|
| Assembly | Parts, PCBAs, Assemblies |
| PCBA | Parts, PCBAs |

---

## BOM Pricing

BOM pricing rolls up from the component level:

- Each part's price comes from its [supplier pricing data](purchasing.md)
- A PCBA's price is the sum of its BOM item prices
- An assembly's price is the sum of its BOM item prices (which may include PCBA prices that themselves roll up from parts)

You can also set a manual price on any PCBA or assembly to override the BOM-based calculation.

---

## Purchase Orders from BOM

Generate a purchase order directly from any PCBA or assembly BOM:

1. Open the **Bill of Materials** tab
2. Click **Create PO from BOM**
3. For each BOM item, select a supplier (or let dokuly pick the cheapest)
4. Choose to include or exclude individual items
5. Click **Create PO**

Only items with pricing data are included. See [Purchasing](purchasing.md) for full details.

---

## Revision Control

PCBAs and assemblies follow the same revision workflow as parts:

- **Draft** — freely editable
- **Review** — submitted for quality assurance
- **Released** — locked; create a new revision to make changes

Each new revision gets the next letter (A, B, C...) while keeping the same part number.
