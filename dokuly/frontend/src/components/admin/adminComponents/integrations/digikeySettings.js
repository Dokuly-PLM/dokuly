import React from "react";
import { Button } from "react-bootstrap";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import SubmitButton from "../../../dokuly_components/submitButton";
import GenericDropdownSelector from "../../../dokuly_components/dokulyTable/components/genericDropdownSelector";

const DigikeySettings = ({
  loading,
  digikeyClientId,
  setDigikeyClientId,
  digikeyClientSecret,
  setDigikeyClientSecret,
  hasDigikeyCredentials,
  digikeyLocaleSite,
  setDigikeyLocaleSite,
  digikeyLocaleCurrency,
  setDigikeyLocaleCurrency,
  digikeyLocaleLanguage,
  setDigikeyLocaleLanguage,
  digikeySupplierId,
  setDigikeySupplierId,
  suppliers,
  supplierOptions,
  loadingSuppliers,
  creatingSupplier,
  handleCreateDigikeySupplier,
  handleTestConnection,
  testingConnection,
  handleSubmit,
}) => {
  // Automatic field mappings - read-only display
  const automaticMappings = [
    { digikey: "DigiKey Part Number", description: "The DigiKey part number is stored for reference and future lookups" },
    { digikey: "Manufacturer Part Number", description: "Automatically populated in the MPN (Manufacturer Part Number) field" },
    { digikey: "Manufacturer", description: "Automatically populated in the Manufacturer field" },
    { digikey: "Product Description", description: "Automatically populated in the Display Name field" },
    { digikey: "Datasheet URL", description: "Automatically populated in the Datasheet field" },
    { digikey: "Primary Photo", description: "Automatically populated in the Image URL field" },
    { digikey: "All Specifications", description: "All product specifications (voltage, current, temperature range, etc.) are stored and can be viewed in the part details" },
    { digikey: "RoHS Status", description: "RoHS compliance status is included in the specifications" },
    { digikey: "Category", description: "Product category information is stored for reference" },
  ];

  return (
    <DokulyCard title="DigiKey Integration Configuration">
      <div className="p-3">
        <h5>API Credentials</h5>
        <p className="text-muted">
          Configure your DigiKey API credentials to enable part search functionality.
          Get your credentials from the DigiKey Developer Portal.
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
                  value={digikeyClientId}
                  onChange={(e) => setDigikeyClientId(e.target.value)}
                  placeholder="Enter DigiKey Client ID"
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label>Client Secret</label>
                <input
                  type="password"
                  className="form-control"
                  value={digikeyClientSecret}
                  onChange={(e) => setDigikeyClientSecret(e.target.value)}
                  placeholder={hasDigikeyCredentials ? "••••••••" : "Enter DigiKey Client Secret"}
                />
                {hasDigikeyCredentials && !digikeyClientSecret && (
                  <small className="text-muted">
                    Leave blank to keep existing secret
                  </small>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h6>Locale Settings</h6>
              <p className="text-muted small">
                Configure the locale settings for DigiKey API queries. These affect pricing, currency, and language of results.
              </p>
              
              <div className="row mt-3">
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Site</label>
                    <select
                      className="form-control"
                      value={digikeyLocaleSite}
                      onChange={(e) => setDigikeyLocaleSite(e.target.value)}
                    >
                      <option value="US">US</option>
                      <option value="CA">CA</option>
                      <option value="UK">UK</option>
                      <option value="DE">DE</option>
                      <option value="AT">AT</option>
                      <option value="BE">BE</option>
                      <option value="DK">DK</option>
                      <option value="FI">FI</option>
                      <option value="FR">FR</option>
                      <option value="GR">GR</option>
                      <option value="IE">IE</option>
                      <option value="IT">IT</option>
                      <option value="LU">LU</option>
                      <option value="NL">NL</option>
                      <option value="NO">NO</option>
                      <option value="PT">PT</option>
                      <option value="ES">ES</option>
                      <option value="SE">SE</option>
                      <option value="CH">CH</option>
                      <option value="IL">IL</option>
                      <option value="PL">PL</option>
                      <option value="SK">SK</option>
                      <option value="SI">SI</option>
                      <option value="LV">LV</option>
                      <option value="LT">LT</option>
                      <option value="EE">EE</option>
                      <option value="CZ">CZ</option>
                      <option value="HU">HU</option>
                      <option value="BG">BG</option>
                      <option value="MY">MY</option>
                      <option value="ZA">ZA</option>
                      <option value="RO">RO</option>
                      <option value="TH">TH</option>
                      <option value="PH">PH</option>
                      <option value="JP">JP</option>
                      <option value="CN">CN</option>
                      <option value="TW">TW</option>
                      <option value="KR">KR</option>
                      <option value="AU">AU</option>
                      <option value="IN">IN</option>
                      <option value="SG">SG</option>
                      <option value="HK">HK</option>
                      <option value="MX">MX</option>
                    </select>
                    <small className="text-muted">DigiKey website locale</small>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      className="form-control"
                      value={digikeyLocaleCurrency}
                      onChange={(e) => setDigikeyLocaleCurrency(e.target.value)}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="JPY">JPY</option>
                      <option value="CNY">CNY</option>
                      <option value="AUD">AUD</option>
                      <option value="NZD">NZD</option>
                      <option value="INR">INR</option>
                      <option value="DKK">DKK</option>
                      <option value="NOK">NOK</option>
                      <option value="SEK">SEK</option>
                      <option value="ILS">ILS</option>
                      <option value="PLN">PLN</option>
                      <option value="CHF">CHF</option>
                      <option value="CZK">CZK</option>
                      <option value="HUF">HUF</option>
                      <option value="RON">RON</option>
                      <option value="ZAR">ZAR</option>
                      <option value="MYR">MYR</option>
                      <option value="THB">THB</option>
                      <option value="PHP">PHP</option>
                      <option value="SGD">SGD</option>
                      <option value="HKD">HKD</option>
                      <option value="KRW">KRW</option>
                      <option value="TWD">TWD</option>
                    </select>
                    <small className="text-muted">Currency for pricing</small>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      className="form-control"
                      value={digikeyLocaleLanguage}
                      onChange={(e) => setDigikeyLocaleLanguage(e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="de">German</option>
                      <option value="fr">French</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zhs">Simplified Chinese</option>
                      <option value="zht">Traditional Chinese</option>
                      <option value="it">Italian</option>
                      <option value="es">Spanish</option>
                      <option value="nl">Dutch</option>
                      <option value="sv">Swedish</option>
                      <option value="pl">Polish</option>
                      <option value="fi">Finnish</option>
                      <option value="da">Danish</option>
                      <option value="no">Norwegian</option>
                    </select>
                    <small className="text-muted">Language for descriptions</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h6>Supplier Selection</h6>
              <p className="text-muted small">
                Select which supplier to use when creating prices from DigiKey parts.
                If no DigiKey supplier exists, you can create one.
              </p>
              
              <div className="mt-3">
                {loadingSuppliers ? (
                  <div className="text-muted">Loading suppliers...</div>
                ) : (
                  <>
                    <GenericDropdownSelector
                      state={digikeySupplierId}
                      setState={(value) => setDigikeySupplierId(value)}
                      dropdownValues={supplierOptions}
                      placeholder="Select supplier for DigiKey prices"
                      borderIfPlaceholder={true}
                      borderColor="orange"
                    />
                    
                    {!suppliers.find(s => s.name && s.name.toLowerCase() === "digikey") && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          onClick={handleCreateDigikeySupplier}
                          disabled={creatingSupplier}
                          style={{
                            borderColor: "#165216ff",
                            color: "#165216ff",
                            backgroundColor: "transparent",
                          }}
                          className="btn"
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = "#165216ff";
                              e.currentTarget.style.color = "white";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "#165216ff";
                            }
                          }}
                        >
                          {creatingSupplier ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" />
                              Creating...
                            </>
                          ) : (
                            "Create DigiKey Supplier"
                          )}
                        </Button>
                        <small className="text-muted d-block mt-1">
                          No DigiKey supplier found. Click to create one automatically.
                        </small>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h6>Automatic Field Mappings</h6>
              <p className="text-muted small">
                The following fields are automatically mapped when importing parts from DigiKey. 
                These mappings are fixed and cannot be modified.
              </p>
              
              <div className="mt-3">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "30%" }}>DigiKey Field</th>
                        <th style={{ width: "70%" }}>What Happens in Dokuly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {automaticMappings.map((mapping, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{mapping.digikey}</strong>
                          </td>
                          <td className="text-muted">{mapping.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-center">
                <Button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={loading || testingConnection || !digikeyClientId || !digikeyClientSecret}
                  style={{
                    borderColor: "#165216ff",
                    color: "#165216ff",
                    backgroundColor: "transparent",
                    marginRight: "12px",
                  }}
                  className="btn"
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#165216ff";
                      e.currentTarget.style.color = "white";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#165216ff";
                    }
                  }}
                >
                  {testingConnection ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                <SubmitButton 
                  onClick={handleSubmit}
                  disabled={loading}
                  disabledTooltip="Loading..."
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

export default DigikeySettings;
