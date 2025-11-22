import React, { useState, useEffect } from "react";
import { Row, Col, Card, Form, Button } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import SubmitButton from "../../dokuly_components/submitButton";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import { fetchIntegrationSettings, updateIntegrationSettings, testDigikeyConnection } from "../functions/queries";
import { getSuppliers } from "../../suppliers/functions/queries";
import { createSupplier } from "../../suppliers/functions/queries";
import { toast } from "react-toastify";

const AdminIntegrations = ({ setRefresh }) => {
  const [activeSection, setActiveSection] = useState("digikey");
  const [loading, setLoading] = useState(true);

  // State for DigiKey settings
  const [digikeyClientId, setDigikeyClientId] = useState("");
  const [digikeyClientSecret, setDigikeyClientSecret] = useState("");
  const [digikeyLocaleSite, setDigikeyLocaleSite] = useState("US");
  const [digikeyLocaleCurrency, setDigikeyLocaleCurrency] = useState("USD");
  const [digikeyLocaleLanguage, setDigikeyLocaleLanguage] = useState("en");
  const [digikeySupplierId, setDigikeySupplierId] = useState(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // State for suppliers
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const sections = [
    { id: "digikey", title: "DigiKey", icon: "search", disabled: false },
    { id: "nexar", title: "Nexar", icon: "search", disabled: true },
  ];

  // Load settings and suppliers on component mount
  useEffect(() => {
    loadSettings();
    loadSuppliers();
  }, []);
  
  // Load suppliers and suggest DigiKey supplier
  const loadSuppliers = () => {
    setLoadingSuppliers(true);
    getSuppliers()
      .then((res) => {
        if (res.status === 200 && res.data) {
          const suppliersList = res.data.filter(s => s.id !== -1 && s.id !== null);
          setSuppliers(suppliersList);
          
          const options = suppliersList.map(s => ({
            label: s.name,
            value: s.id,
          }));
          setSupplierOptions(options);
          
          // Suggest DigiKey supplier if exists (case-insensitive)
          const digikeySupplier = suppliersList.find(s => 
            s.name && s.name.toLowerCase() === "digikey"
          );
          if (digikeySupplier && !digikeySupplierId) {
            setDigikeySupplierId(digikeySupplier.id);
          }
        }
        setLoadingSuppliers(false);
      })
      .catch((err) => {
        console.error("Error loading suppliers:", err);
        setLoadingSuppliers(false);
      });
  };
  
  // Create DigiKey supplier
  const handleCreateDigikeySupplier = () => {
    setCreatingSupplier(true);
    const supplierData = {
      name: "DigiKey",
      website: "https://www.digikey.com",
      is_active: true,
      default_currency: digikeyLocaleCurrency || "USD",
      notes: "Created from DigiKey integration settings",
    };
    
    createSupplier(supplierData)
      .then((res) => {
        if (res.status === 201) {
          toast.success("DigiKey supplier created successfully");
          // Reload suppliers and select the new one
          getSuppliers()
            .then((supplierRes) => {
              if (supplierRes.status === 200 && supplierRes.data) {
                const suppliersList = supplierRes.data.filter(s => s.id !== -1 && s.id !== null);
                setSuppliers(suppliersList);
                
                const options = suppliersList.map(s => ({
                  label: s.name,
                  value: s.id,
                }));
                setSupplierOptions(options);
                
                // Find and select the newly created DigiKey supplier
                const newSupplier = suppliersList.find(s => 
                  s.name && s.name.toLowerCase() === "digikey"
                );
                if (newSupplier) {
                  setDigikeySupplierId(newSupplier.id);
                }
              }
            });
        } else {
          toast.error("Failed to create DigiKey supplier");
        }
      })
      .catch((err) => {
        console.error("Error creating supplier:", err);
        toast.error("Failed to create DigiKey supplier");
      })
      .finally(() => {
        setCreatingSupplier(false);
      });
  };

  const loadSettings = () => {
    setLoading(true);
    fetchIntegrationSettings()
      .then((res) => {
        if (res.status === 200 && res.data) {
          setDigikeyClientId(res.data.digikey_client_id || "");
          setDigikeyClientSecret(res.data.digikey_client_secret || "");
          setDigikeyLocaleSite(res.data.digikey_locale_site || "US");
          setDigikeyLocaleCurrency(res.data.digikey_locale_currency || "USD");
          setDigikeyLocaleLanguage(res.data.digikey_locale_language || "en");
          setDigikeySupplierId(res.data.digikey_supplier_id || null);
          setHasCredentials(res.data.has_digikey_credentials || false);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading integration settings:", err);
        toast.error("Failed to load integration settings");
        setLoading(false);
      });
  };

  const handleSubmit = () => {
    const data = {
      digikey_client_id: digikeyClientId,
      digikey_client_secret: digikeyClientSecret,
      digikey_locale_site: digikeyLocaleSite,
      digikey_locale_currency: digikeyLocaleCurrency,
      digikey_locale_language: digikeyLocaleLanguage,
      digikey_supplier_id: digikeySupplierId,
    };

    updateIntegrationSettings(data)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Integration settings updated successfully");
          if (setRefresh) {
            setRefresh(true);
          }
          // Reload to get updated state
          loadSettings();
        }
      })
      .catch((err) => {
        console.error("Error updating integration settings:", err);
        toast.error("Failed to update integration settings");
      });
  };

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

  const handleTestConnection = () => {
    if (!digikeyClientId || !digikeyClientId.trim()) {
      toast.error("Please enter Client ID before testing");
      return;
    }
    
    if (!digikeyClientSecret || !digikeyClientSecret.trim()) {
      toast.error("Please enter Client Secret before testing");
      return;
    }

    setTestingConnection(true);
    
    // First save the credentials temporarily for testing
    const testData = {
      digikey_client_id: digikeyClientId.trim(),
      digikey_client_secret: digikeyClientSecret.trim(),
    };

    updateIntegrationSettings(testData)
      .then((saveRes) => {
        if (saveRes.status === 200) {
          // Wait a moment for the save to complete, then test the connection
          return new Promise((resolve) => setTimeout(resolve, 500))
            .then(() => testDigikeyConnection("resistor"));
        } else {
          throw new Error("Failed to save credentials");
        }
      })
      .then((res) => {
        if (res.status === 200 && res.data) {
          if (res.data.success) {
            toast.success(res.data.message || "Connection test successful!");
          } else {
            // Show detailed error message
            const errorMsg = res.data.message || "Connection test failed";
            toast.error(errorMsg, { autoClose: 10000 }); // Show for 10 seconds
            console.error("DigiKey connection test failed:", res.data);
          }
        }
      })
      .catch((err) => {
        console.error("Error testing connection:", err);
        let errorMsg = "Failed to test connection. ";
        if (err.response && err.response.data && err.response.data.message) {
          errorMsg += err.response.data.message;
        } else if (err.message) {
          errorMsg += err.message;
        } else {
          errorMsg += "Please check your credentials and ensure you've subscribed to Product Information API v4 in the DigiKey Developer Portal.";
        }
        toast.error(errorMsg, { autoClose: 10000 });
      })
      .finally(() => {
        setTestingConnection(false);
      });
  };

  const renderDigikey = () => {
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
                    placeholder={hasCredentials ? "••••••••" : "Enter DigiKey Client Secret"}
                  />
                  {hasCredentials && !digikeyClientSecret && (
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

  const renderNexar = () => {
    return (
      <DokulyCard title="Nexar Integration Configuration">
        <div className="p-3">
          <h5>Coming Soon</h5>
          <p className="text-muted">
            Nexar integration configuration will be available here.
            Currently, Nexar credentials are configured via environment variables.
          </p>
        </div>
      </DokulyCard>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "digikey":
        return renderDigikey();
      case "nexar":
        return renderNexar();
      default:
        return renderDigikey();
    }
  };

  return (
    <div className="container-fluid mt-4">
      <Row>
        <Col md={3}>
          <DokulyCard>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Integrations</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`list-group-item list-group-item-action ${
                      activeSection === section.id ? "dokuly-bg-primary text-white" : ""
                    } ${section.disabled ? "disabled" : ""}`}
                    onClick={() => !section.disabled && setActiveSection(section.id)}
                    disabled={section.disabled}
                    style={{
                      cursor: section.disabled ? "not-allowed" : "pointer",
                      opacity: section.disabled ? 0.6 : 1
                    }}
                  >
                    <img
                      src={`../../static/icons/${section.icon}.svg`}
                      alt={section.title}
                      width="20"
                      height="20"
                      className="me-2"
                      style={{ 
                        marginRight: "8px",
                        filter: activeSection === section.id ? "brightness(0) invert(1)" : "none"
                      }}
                    />
                    {section.title}
                    {section.disabled && (
                      <span className="badge bg-warning text-dark ms-2">Coming Soon</span>
                    )}
                  </button>
                ))}
              </div>
            </Card.Body>
          </DokulyCard>

          <DokulyCard>
            <Card.Body>
              <h6>About Integrations</h6>
              <p className="text-muted small">
                Configure external API integrations to enable part search functionality.
                Each integration requires API credentials and can be configured with
                field mappings to automatically populate part data.
              </p>
            </Card.Body>
          </DokulyCard>
        </Col>

        <Col md={9}>
          {renderSectionContent()}
        </Col>
      </Row>
    </div>
  );
};

export default AdminIntegrations;

