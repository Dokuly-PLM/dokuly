# Purchasing

The purchasing module manages suppliers, pricing, and purchase orders. It connects directly to your BOMs so you can generate purchase orders with accurate quantities and pricing.

---

## Key Capabilities

- **Supplier management** — maintain a list of vendors with contact and delivery information
- **Part pricing** — add multiple suppliers per part with price breaks and currency support
- **Purchase order generation** — create POs manually or generate them directly from a BOM
- **Automatic vendor selection** — when generating a PO from a BOM, dokuly selects the cheapest supplier at each quantity
- **Order tracking** — track PO status from Draft through to delivery with estimated and actual delivery dates
- **PO items** — each line item links to a part, PCBA, or assembly with quantity, unit price, and received status
- **Production lot integration** — link POs to production lots for procurement visibility

---

## Suppliers

Navigate to **Suppliers** in the sidebar to manage your vendor list. Each supplier record stores:

- Company name and contact details
- Delivery terms and lead times
- Notes

To add a supplier, click **New supplier** and fill in the details.

### Adding Suppliers to Parts

Each part can have multiple suppliers, each with their own pricing. Navigate to a part's **Overview** tab to add supplier pricing:

1. In the pricing section, click **Add supplier**
2. Search for and select a supplier
3. Enter the MPN (manufacturer part number) for this supplier
4. Add price breaks (quantity thresholds and unit prices)
5. Set the currency

This pricing data feeds directly into BOM cost calculations and PO generation.

---

## Purchase Orders

Navigate to **Procurement** in the sidebar to view and manage purchase orders.

### Creating a PO Manually

1. Click **New PO**
2. Select a supplier
3. Add line items — search for parts, PCBAs, or assemblies
4. Set quantities, delivery address, and payment terms
5. Submit

### Generating a PO from a BOM

This is the faster approach when ordering parts for a PCBA or assembly:

1. Navigate to the PCBA or assembly's **BOM** tab
2. Click **Create PO from BOM**
3. A form shows all BOM items with their available suppliers and pricing
4. For each item, select the preferred supplier (or let dokuly pick the cheapest)
5. Choose to include or exclude individual items
6. Click **Create PO**

!!! tip
    Only BOM items with pricing data can be included in the generated PO. Make sure your parts have supplier pricing set up before generating.

### PO Status Tracking

Each purchase order has a status lifecycle:

- **Draft** — Being prepared, not yet sent to supplier
- **Sent** — Order placed with supplier
- **Confirmed** — Supplier has acknowledged the order
- **Delivered** — Items received (partial or full)
- **Completed** — All items received and PO closed

Track estimated and actual delivery dates, shipping costs, freight carrier, and tracking numbers directly on the PO.

### Receiving Items

On the PO detail page, mark individual line items as received and record the quantity received. This updates the PO completion status.

---

## Files and Notes

Attach files to a purchase order (e.g., supplier confirmations, invoices) and add notes for internal tracking.
