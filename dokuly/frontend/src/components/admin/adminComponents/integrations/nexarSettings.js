import React, { useState, useEffect } from "react";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import SubmitButton from "../../../dokuly_components/submitButton";
import GenericDropdownSelector from "../../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import { getNexarSellers } from "../../../suppliers/functions/queries";

const NexarSettings = ({
  loading,
  nexarClientId,
  setNexarClientId,
  nexarClientSecret,
  setNexarClientSecret,
  hasNexarCredentials,
  handleNexarSubmit,
  suppliers,
  supplierOptions,
  loadingSuppliers,
  nexarSupplierMappings,
  setNexarSupplierMappings,
}) => {
  const [nexarSellers, setNexarSellers] = useState([]);
  const [loadingNexarSellers, setLoadingNexarSellers] = useState(false);
  const [nexarSellersError, setNexarSellersError] = useState(null);

  // Load Nexar sellers when credentials are available
  useEffect(() => {
    if (hasNexarCredentials) {
      loadNexarSellers();
    }
  }, [hasNexarCredentials]);

  const loadNexarSellers = () => {
    setLoadingNexarSellers(true);
    setNexarSellersError(null);
    
    getNexarSellers()
      .then((res) => {
        if (res.status === 200 && res.data) {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setNexarSellers(res.data);
          } else {
            console.warn("Nexar sellers response is empty:", res.data);
            setNexarSellersError("No Nexar sellers returned from API. The API credentials may be incorrect or the API may be temporarily unavailable.");
            setNexarSellers([]);
          }
        } else {
          console.error("Unexpected response from Nexar sellers API:", res);
          setNexarSellersError("Unexpected response from Nexar API. Please check the browser console for details.");
          setNexarSellers([]);
        }
      })
      .catch((err) => {
        console.error("Error loading Nexar sellers:", err);
        if (err.response) {
          console.error("Error response:", err.response.data);
          setNexarSellersError(`API Error: ${err.response.data?.error || err.response.statusText || 'Unknown error'}`);
        } else if (err.request) {
          setNexarSellersError("No response from server. Please check your network connection.");
        } else {
          setNexarSellersError("Failed to load Nexar sellers. Please ensure your API credentials are configured correctly.");
        }
        setNexarSellers([]);
      })
      .finally(() => {
        setLoadingNexarSellers(false);
      });
  };

  const handleSupplierMapping = (supplierId, nexarSellerId) => {
    setNexarSupplierMappings((prev) => ({
      ...prev,
      [supplierId]: nexarSellerId,
    }));
  };

  const getMappedCount = () => {
    return Object.values(nexarSupplierMappings).filter(v => v !== null).length;
  };

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

            {/* Supplier Mapping Section */}
            {hasNexarCredentials && (
              <div className="mt-4">
                <h6>Supplier Mapping</h6>
                <p className="text-muted small">
                  Map your Dokuly suppliers to Nexar distributors for automatic price import.
                  When you create a part from Nexar data, prices will be automatically created for mapped suppliers.
                  {getMappedCount() > 0 && (
                    <span className="text-success d-block mt-1">
                      <strong>{getMappedCount()}</strong> supplier{getMappedCount() !== 1 ? 's' : ''} mapped
                    </span>
                  )}
                </p>

                {loadingNexarSellers ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="sr-only">Loading Nexar sellers...</span>
                    </div>
                    <p className="text-muted small mt-2">Loading available distributors from Nexar...</p>
                  </div>
                ) : nexarSellersError ? (
                  <div className="alert alert-warning">
                    <small>{nexarSellersError}</small>
                    <button 
                      className="btn btn-sm btn-link" 
                      onClick={loadNexarSellers}
                    >
                      Retry
                    </button>
                  </div>
                ) : nexarSellers.length > 0 ? (
                  <div className="mt-3">
                    {loadingSuppliers ? (
                      <div className="text-center py-2">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="sr-only">Loading suppliers...</span>
                        </div>
                      </div>
                    ) : suppliers.length === 0 ? (
                      <div className="alert alert-info">
                        <small>No suppliers found. Create suppliers first to enable mapping.</small>
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <table className="table table-sm table-bordered">
                          <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ width: "40%" }}>Dokuly Supplier</th>
                              <th style={{ width: "60%" }}>Nexar Distributor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suppliers.map((supplier) => (
                              <tr key={supplier.id}>
                                <td>
                                  <strong>{supplier.name}</strong>
                                </td>
                                <td>
                                  <GenericDropdownSelector
                                    state={nexarSupplierMappings[supplier.id] || null}
                                    setState={(value) => handleSupplierMapping(supplier.id, value)}
                                    dropdownValues={[
                                      { label: "No mapping", value: null },
                                      ...nexarSellers.map((seller) => ({
                                        label: seller.name,
                                        value: parseInt(seller.id),
                                      })),
                                    ]}
                                    placeholder="Select Nexar distributor"
                                    borderIfPlaceholder={false}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <small>No Nexar sellers available. Please check your API credentials.</small>
                  </div>
                )}
              </div>
            )}

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
                      <tr>
                        <td><strong>Pricing & Availability</strong></td>
                        <td className="text-muted">
                          Price tiers and stock levels from mapped distributors are automatically imported
                        </td>
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
