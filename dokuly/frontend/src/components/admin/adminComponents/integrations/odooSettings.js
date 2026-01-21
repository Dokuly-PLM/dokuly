import React from "react";
import { Button, Form } from "react-bootstrap";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import SubmitButton from "../../../dokuly_components/submitButton";

const OdooSettings = ({
  loading,
  odooEnabled,
  setOdooEnabled,
  odooUrl,
  setOdooUrl,
  odooDatabase,
  setOdooDatabase,
  odooUsername,
  setOdooUsername,
  odooApiKey,
  setOdooApiKey,
  hasOdooCredentials,
  odooAutoPush,
  setOdooAutoPush,
  odooDefaultProductCategoryId,
  setOdooDefaultProductCategoryId,
  odooDefaultUomId,
  setOdooDefaultUomId,
  odooDefaultProductType,
  setOdooDefaultProductType,
  odooDefaultSaleOk,
  setOdooDefaultSaleOk,
  odooDefaultPurchaseOk,
  setOdooDefaultPurchaseOk,
  odooDefaultRentOk,
  setOdooDefaultRentOk,
  odooDefaultIsStorable,
  setOdooDefaultIsStorable,
  odooDefaultTracking,
  setOdooDefaultTracking,
  odooCategoryParts,
  setOdooCategoryParts,
  odooCategoryPcbas,
  setOdooCategoryPcbas,
  odooCategoryAssemblies,
  setOdooCategoryAssemblies,
  odooUpdateFieldsExisting,
  setOdooUpdateFieldsExisting,
  handleTestConnection,
  testingConnection,
  handleSubmit,
}) => {
  // Automatic field mappings - read-only display
  const automaticMappings = [
    { dokuly: "Full Part Number", description: "Used as Odoo Internal Reference (default_code) for matching and updates" },
    { dokuly: "Display Name", description: "Automatically populated in the Product Name field" },
    { dokuly: "Description", description: "Automatically populated in the Product Description field" },
    { dokuly: "Unit (e.g., pcs, kg, m)", description: "Automatically mapped to the corresponding Odoo Unit of Measure" },
    { dokuly: "Thumbnail Image", description: "Automatically uploaded as the product image in Odoo" },
    { dokuly: "Release State", description: "Only released items can be pushed to Odoo (manual or automatic)" },
  ];

  return (
    <DokulyCard title="Odoo Integration Configuration">
      <div className="p-3">
        <h5>Integration Status</h5>
        <p className="text-muted">
          Enable integration with Odoo v19 to automatically sync products when parts, PCBAs, and assemblies are released.
        </p>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3">
              <Form.Check
                type="switch"
                id="odoo-enabled-switch"
                label="Enable Odoo Integration"
                checked={odooEnabled}
                onChange={(e) => setOdooEnabled(e.target.checked)}
              />
              <small className="text-muted">
                When enabled, products can be pushed to Odoo manually or automatically on release
              </small>
            </div>

            <hr className="my-4" />

            <h5>API Credentials</h5>
            <p className="text-muted">
              Configure your Odoo instance connection details. You'll need an API key from your Odoo settings.
            </p>
            
            <div className="alert alert-info">
              <strong>How to get your Odoo API Key:</strong>
              <ol className="mb-0 mt-2" style={{ fontSize: '0.9em' }}>
                <li>Log into your Odoo instance</li>
                <li>Go to <strong>Settings → Users & Companies → Users</strong></li>
                <li>Select your user account</li>
                <li>Go to the <strong>Account Security</strong> tab</li>
                <li>Click <strong>New API Key</strong> and copy the generated key</li>
              </ol>
            </div>
            
            <div className="mt-4">
              <div className="form-group">
                <label>Odoo URL *</label>
                <input
                  type="text"
                  className="form-control"
                  value={odooUrl}
                  onChange={(e) => setOdooUrl(e.target.value)}
                  placeholder="https://mycompany.odoo.com"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  The full URL of your Odoo instance
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Database Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={odooDatabase}
                  onChange={(e) => setOdooDatabase(e.target.value)}
                  placeholder="my_database"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  The name of your Odoo database
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  className="form-control"
                  value={odooUsername}
                  onChange={(e) => setOdooUsername(e.target.value)}
                  placeholder="admin or your.email@company.com"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  Your Odoo username (usually your email or 'admin')
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>API Key *</label>
                <input
                  type="password"
                  className="form-control"
                  value={odooApiKey}
                  onChange={(e) => setOdooApiKey(e.target.value)}
                  placeholder={hasOdooCredentials ? "••••••••" : "Enter Odoo API Key"}
                  disabled={!odooEnabled}
                />
                {hasOdooCredentials && !odooApiKey && (
                  <small className="text-muted">
                    Leave blank to keep existing API key
                  </small>
                )}
              </div>
            </div>

            <hr className="my-4" />

            <h5>Synchronization Settings</h5>
            <p className="text-muted">
              Configure when and how products are pushed to Odoo.
            </p>
            
            <div className="mt-3">
              <Form.Check
                type="switch"
                id="odoo-auto-push-switch"
                label="Automatically push to Odoo on release"
                checked={odooAutoPush}
                onChange={(e) => setOdooAutoPush(e.target.checked)}
                disabled={!odooEnabled}
              />
              <small className="text-muted d-block mt-1">
                When enabled, parts, PCBAs, and assemblies will automatically be pushed to Odoo when released.
                You can also manually push items using the "Push to Odoo" button on each item's page.
              </small>
            </div>

            <hr className="my-4" />

            <h5>Product Defaults</h5>
            <p className="text-muted">
              Set default values for products created in Odoo.
            </p>
            
            <div className="mt-3">
              <div className="form-group">
                <label>Default Product Type</label>
                <select
                  className="form-control"
                  value={odooDefaultProductType}
                  onChange={(e) => setOdooDefaultProductType(e.target.value)}
                  disabled={!odooEnabled}
                >
                  <option value="consu">Goods</option>
                  <option value="service">Service</option>
                  <option value="combo">Combo</option>
                </select>
                <small className="text-muted">
                  Default product type for all items pushed to Odoo
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Default Product Category ID (Optional)</label>
                <input
                  type="number"
                  className="form-control"
                  value={odooDefaultProductCategoryId || ''}
                  onChange={(e) => setOdooDefaultProductCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter Odoo category ID"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  Odoo internal ID for the default product category
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Default Unit of Measure ID (Optional - Fallback Only)</label>
                <input
                  type="number"
                  className="form-control"
                  value={odooDefaultUomId || ''}
                  onChange={(e) => setOdooDefaultUomId(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter Odoo UoM ID"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  Odoo internal ID for the fallback unit of measure. 
                  <strong> Note:</strong> The system will automatically use the unit from each part/PCBA/assembly (e.g., pcs, kg, m).
                  This default is only used if an item has no unit specified.
                </small>
              </div>
            </div>

            <hr className="my-4" />

            <h5>Product Field Defaults</h5>
            <p className="text-muted">
              Configure default field values for new products created in Odoo.
            </p>
            
            <div className="mt-3">
              <div className="form-group">
                <Form.Check
                  type="switch"
                  id="odoo-default-sale-ok"
                  label="Can be Sold (Default)"
                  checked={odooDefaultSaleOk}
                  onChange={(e) => setOdooDefaultSaleOk(e.target.checked)}
                  disabled={!odooEnabled}
                />
                <small className="text-muted d-block mt-1">
                  Default "Can be Sold" setting for new products
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <Form.Check
                  type="switch"
                  id="odoo-default-purchase-ok"
                  label="Can be Purchased (Default)"
                  checked={odooDefaultPurchaseOk}
                  onChange={(e) => setOdooDefaultPurchaseOk(e.target.checked)}
                  disabled={!odooEnabled}
                />
                <small className="text-muted d-block mt-1">
                  Default "Can be Purchased" setting for new products
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <Form.Check
                  type="switch"
                  id="odoo-default-rent-ok"
                  label="Can be Rented (Default)"
                  checked={odooDefaultRentOk}
                  onChange={(e) => setOdooDefaultRentOk(e.target.checked)}
                  disabled={!odooEnabled}
                />
                <small className="text-muted d-block mt-1">
                  Default "Can be Rented" setting for new products
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <Form.Check
                  type="switch"
                  id="odoo-default-is-storable"
                  label="Track Inventory (Default)"
                  checked={odooDefaultIsStorable}
                  onChange={(e) => setOdooDefaultIsStorable(e.target.checked)}
                  disabled={!odooEnabled}
                />
                <small className="text-muted d-block mt-1">
                  Default "Track Inventory" setting for new products
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Inventory Tracking Method (Default)</label>
                <select
                  className="form-control"
                  value={odooDefaultTracking}
                  onChange={(e) => setOdooDefaultTracking(e.target.value)}
                  disabled={!odooEnabled}
                >
                  <option value="none">By Quantity</option>
                  <option value="lot">By Lots</option>
                  <option value="serial">By Serial Numbers</option>
                </select>
                <small className="text-muted">
                  Default inventory tracking method for new products
                </small>
              </div>
            </div>

            <hr className="my-4" />

            <h5>Category Mappings</h5>
            <p className="text-muted">
              Configure product category names for different item types.
            </p>
            
            <div className="mt-3">
              <div className="form-group">
                <label>Category for Parts</label>
                <input
                  type="text"
                  className="form-control"
                  value={odooCategoryParts}
                  onChange={(e) => setOdooCategoryParts(e.target.value)}
                  placeholder="Purchased Goods"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  Product category name for Parts (e.g., "Purchased Goods")
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Category for PCBAs</label>
                <input
                  type="text"
                  className="form-control"
                  value={odooCategoryPcbas}
                  onChange={(e) => setOdooCategoryPcbas(e.target.value)}
                  placeholder="Purchased Goods"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  Product category name for PCBAs (e.g., "Purchased Goods")
                </small>
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Category for Assemblies</label>
                <input
                  type="text"
                  className="form-control"
                  value={odooCategoryAssemblies}
                  onChange={(e) => setOdooCategoryAssemblies(e.target.value)}
                  placeholder="Manufactured"
                  disabled={!odooEnabled}
                />
                <small className="text-muted">
                  Product category name for Assemblies (e.g., "Manufactured")
                </small>
              </div>
            </div>

            <hr className="my-4" />

            <h5>Update Settings for Existing Products</h5>
            <p className="text-muted">
              Select which fields to update when a product already exists in Odoo.
              Other fields will remain unchanged to preserve existing Odoo configuration.
            </p>
            
            <div className="mt-3">
              <div className="form-group">
                <Form.Check
                  type="checkbox"
                  id="update-field-name"
                  label="Update Name"
                  checked={odooUpdateFieldsExisting.includes('name')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setOdooUpdateFieldsExisting([...odooUpdateFieldsExisting, 'name']);
                    } else {
                      setOdooUpdateFieldsExisting(odooUpdateFieldsExisting.filter(f => f !== 'name'));
                    }
                  }}
                  disabled={!odooEnabled}
                />
                <Form.Check
                  type="checkbox"
                  id="update-field-description"
                  label="Update Description"
                  checked={odooUpdateFieldsExisting.includes('description')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setOdooUpdateFieldsExisting([...odooUpdateFieldsExisting, 'description']);
                    } else {
                      setOdooUpdateFieldsExisting(odooUpdateFieldsExisting.filter(f => f !== 'description'));
                    }
                  }}
                  disabled={!odooEnabled}
                />
                <Form.Check
                  type="checkbox"
                  id="update-field-image"
                  label="Update Image"
                  checked={odooUpdateFieldsExisting.includes('image')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setOdooUpdateFieldsExisting([...odooUpdateFieldsExisting, 'image']);
                    } else {
                      setOdooUpdateFieldsExisting(odooUpdateFieldsExisting.filter(f => f !== 'image'));
                    }
                  }}
                  disabled={!odooEnabled}
                />
                <small className="text-muted d-block mt-2">
                  When a product already exists in Odoo, only the selected fields will be updated.
                  All other fields (category, type, sale/purchase flags, tracking, etc.) will remain unchanged.
                </small>
              </div>
            </div>

            <hr className="my-4" />

            <h5>Automatic Field Mappings</h5>
            <p className="text-muted">
              The following fields are automatically mapped when pushing items to Odoo.
              These mappings are fixed and cannot be modified.
            </p>
            
            <div className="mt-3">
              <div className="table-responsive">
                <table className="table table-sm table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "30%" }}>Dokuly Field</th>
                      <th style={{ width: "70%" }}>What Happens in Odoo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {automaticMappings.map((mapping, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{mapping.dokuly}</strong>
                        </td>
                        <td className="text-muted">{mapping.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="alert alert-info mt-3">
              <strong>Assembly BOMs:</strong> When pushing assemblies with BOMs, multi-level BOMs are automatically flattened.
              Sub-assemblies are expanded to show only parts and PCBAs. PCBA BOMs are not expanded.
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success"
                  onClick={handleTestConnection}
                  disabled={loading || testingConnection || !odooEnabled || !odooUrl || !odooDatabase || !odooUsername || !odooApiKey}
                >
                  {testingConnection ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </button>
                <SubmitButton 
                  onClick={handleSubmit}
                  disabled={loading}
                  disabledTooltip="Loading..."
                  className="btn-sm"
                >
                  Save Settings
                </SubmitButton>
              </div>
            </div>
          </>
        )}
      </div>
    </DokulyCard>
  );
};

export default OdooSettings;
