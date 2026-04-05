# From Parts to PCBAs

PCBAs (Printed Circuit Board Assemblies) are connected to parts through their bill of materials. A PCBA's BOM lists every component that goes onto the board, with quantities and reference designators. PCBAs can also be used as components in other PCBAs or in assemblies.

!!! tip
    Parts, PCBAs, and assemblies share a single part number counter, so every item in your system has a unique number.

---

## Creating a PCBA

1. Navigate to **PCBA** in the sidebar
2. Click **New PCBA**
3. Fill in the project, display name, and any other details
4. Click **Submit**

The new PCBA is created in Draft state. Navigate to it by clicking its row in the table.

---

## PCBA Dashboard

The PCBA dashboard is similar to the part dashboard. You can edit metadata, update pricing, upload files, and write notes. The same tabs are available — Overview, Issues, Inventory, Notes, Reference Documents, and Revisions — plus the **Bill of Materials** tab.

---

## Managing the Bill of Materials

Open the **Bill of Materials** tab to manage the list of parts that make up your PCBA.

### Adding Items to the BOM

1. Click **Add item**
2. In the new row, click the part number cell to open the inline part search
3. Type a part name or number and click **Search**
4. Select the part from the results — it is added to the BOM

### Editing BOM Rows

BOM rows support inline editing. Click on any editable cell to modify it:

- **Quantity** — how many of this part are used
- **Ref.Des** — reference designator(s) for the component placement
- **DNM** — mark as Do-Not-Mount if the part is not placed in this configuration

Press **Tab** or **Enter** to save your change.

!!! tip
    Navigate to a BOM item quickly by **Ctrl** + clicking on the table row, or clicking the arrow icon.

### Importing a BOM from CSV

If you have an existing BOM in CSV format:

1. Click **Import BOM**
2. Upload your CSV file
3. Map the CSV columns to dokuly fields (MPN, designator, quantity, DNM)
4. Review the processed data
5. Click **Submit** to sync and upload

### Exporting the BOM

Use the **CSV** table exporter in the bottom-left corner of the BOM table to export the current BOM.

### Clearing the BOM

To start over, click **Clear BOM** to remove all rows. This cannot be undone.

---

## BOM Pricing

The BOM's total cost is calculated from the pricing data of its component parts. To get accurate cost estimates:

1. Ensure your parts have [supplier pricing](purchasing.md) set up
2. The PCBA Overview tab shows the total BOM cost
3. A manual price can also be set if the BOM pricing doesn't apply

---

## Generating a Purchase Order from BOM

You can create a purchase order directly from a PCBA's BOM. See [Purchasing](purchasing.md) for details on how this works.

---

## Next Steps

Learn more about [BOM management for PCBAs and Assemblies](pcbas_and_assemblies.md).
