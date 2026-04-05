# Creating Your First Part

Parts are the lowest-level items in dokuly's product hierarchy. They represent individual components — resistors, connectors, enclosures, fasteners, or any discrete item that goes into a PCBA or assembly.

---

## Creating a Part

1. Navigate to **Parts** in the sidebar
2. Click **New part**
3. In the dialog, fill in:
    - **Part type** — select the type (determines the part number prefix, e.g. "EL" for electrical)
    - **Project** — assign the part to a project
    - **Display name** — a human-readable name (e.g. "10k Resistor 0402")
4. Click **Submit**

The part is created in **Draft** state with an automatically assigned part number.

!!! tip
    Parts, PCBAs, and assemblies share a single part number counter. This ensures every item in your system has a unique number.

---

## Part Dashboard

Navigate to the part by clicking its row in the table (or **Ctrl** + click to open in a new tab).

At the top of the dashboard you see the part number and display name. Click on this to copy it to your clipboard.

### Tabs

- **Overview** — MPN, manufacturer, tags, pricing data, file attachments, errata, revision notes, and alternate parts
- **Issues** — Create and manage issues on this part
- **Inventory** — View stock levels, add or remove stock from locations, see transaction history and forecast
- **Notes** — Inline markdown editor with support for multiple tabs
- **Reference Documents** — Link documents to the part for easy access
- **Specifications** — Define custom technical specifications (key-value pairs)
- **Revisions** — View all revisions of this part

---

## Part Numbering

Part numbers follow the format **`<PREFIX><NUMBER><REVISION>`**, for example **EL000001A**:

- **EL** — the part type prefix (configured in Admin > Parts)
- **000001** — the sequential number
- **A** — the revision letter

The prefix is determined by the part type you select when creating the part. Part types and their prefixes are managed in the [Administration dashboard](admin/settings.md).

---

## Adding Pricing and Supplier Data

On the **Overview** tab, you can add supplier pricing:

1. In the pricing section, add a supplier
2. Enter the supplier's MPN and pricing with quantity breaks
3. Set the currency

This pricing data is used for BOM cost rollups and [purchase order generation](purchasing.md).

---

## Specifications

The **Specifications** tab lets you define custom key-value pairs for technical data — voltage ratings, tolerances, dimensions, or any parameter relevant to the part. These are searchable and visible on the part dashboard.

---

## Revision Control

Parts use the standard dokuly revision workflow:

- **Draft** — the part can be freely edited
- **Review** — marked for quality assurance review
- **Released** — the part is locked; to make changes, create a new revision

Creating a new revision copies the part data to a new record with the next revision letter (A → B → C). The part number stays the same across all revisions.

---

## Next Steps

Once you have parts created, you can use them in a [PCBA's bill of materials](parts_to_pcbas.md).
