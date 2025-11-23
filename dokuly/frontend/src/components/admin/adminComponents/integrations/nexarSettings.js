import React from "react";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import SubmitButton from "../../../dokuly_components/submitButton";

const NexarSettings = ({
  loading,
  nexarClientId,
  setNexarClientId,
  nexarClientSecret,
  setNexarClientSecret,
  hasNexarCredentials,
  handleNexarSubmit,
}) => {
  return (
    <DokulyCard title="Nexar Integration Configuration">
      <div className="p-3">
        <h5>API Credentials</h5>
        <p className="text-muted">
          Configure your Nexar API credentials to enable part search functionality.
          Get your credentials from the Nexar Developer Portal.
        </p>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div className="form-group">
                <label>Client ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={nexarClientId}
                  onChange={(e) => setNexarClientId(e.target.value)}
                  placeholder="Enter Nexar Client ID"
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Client Secret</label>
                <input
                  type="password"
                  className="form-control"
                  value={nexarClientSecret}
                  onChange={(e) => setNexarClientSecret(e.target.value)}
                  placeholder={hasNexarCredentials ? "••••••••" : "Enter Nexar Client Secret"}
                />
                {hasNexarCredentials && !nexarClientSecret && (
                  <small className="text-muted">
                    Leave blank to keep existing secret
                  </small>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h6>Supplier Mapping (Coming Soon)</h6>
              <p className="text-muted small">
                Nexar aggregates pricing from multiple distributors (DigiKey, Mouser, Arrow, etc.).
                A future update will allow you to map Nexar's supplier names to your Dokuly suppliers
                for automatic price import.
              </p>
            </div>

            <div className="mt-4">
              <h6>Automatic Field Mappings</h6>
              <p className="text-muted small">
                The following fields are automatically mapped when importing parts from Nexar. 
                These mappings are fixed and cannot be modified.
              </p>
              
              <div className="mt-3">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "30%" }}>Nexar Field</th>
                        <th style={{ width: "70%" }}>What Happens in Dokuly</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Manufacturer Part Number</strong></td>
                        <td className="text-muted">Automatically populated in the MPN (Manufacturer Part Number) field</td>
                      </tr>
                      <tr>
                        <td><strong>Manufacturer</strong></td>
                        <td className="text-muted">Automatically populated in the Manufacturer field</td>
                      </tr>
                      <tr>
                        <td><strong>Product Description</strong></td>
                        <td className="text-muted">Automatically populated in the Display Name field</td>
                      </tr>
                      <tr>
                        <td><strong>Datasheet URL</strong></td>
                        <td className="text-muted">Automatically populated in the Datasheet field</td>
                      </tr>
                      <tr>
                        <td><strong>Product Image</strong></td>
                        <td className="text-muted">Automatically populated in the Image URL field</td>
                      </tr>
                      <tr>
                        <td><strong>Technical Specifications</strong></td>
                        <td className="text-muted">All product specifications (voltage, current, temperature range, etc.) are stored and can be viewed in the part details</td>
                      </tr>
                      <tr>
                        <td><strong>Category</strong></td>
                        <td className="text-muted">Product category information is stored for reference</td>
                      </tr>
                      <tr>
                        <td><strong>Operating Temperature</strong></td>
                        <td className="text-muted">Min/Max operating temperature is extracted and displayed separately</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <SubmitButton 
                onClick={handleNexarSubmit}
                disabled={loading}
                disabledTooltip="Loading..."
              >
                Save Nexar Settings
              </SubmitButton>
            </div>
          </>
        )}
      </div>
    </DokulyCard>
  );
};

export default NexarSettings;
