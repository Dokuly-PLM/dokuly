import React, { useState, useEffect } from "react";
import { Row, Col, Card } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import { fetchIntegrationSettings, updateIntegrationSettings, testDigikeyConnection, testOdooConnection } from "../functions/queries";
import { getSuppliers, updateSupplier } from "../../suppliers/functions/queries";
import { createSupplier } from "../../suppliers/functions/queries";
import { toast } from "react-toastify";
import DigikeySettings from "../adminComponents/integrations/digikeySettings";
import NexarSettings from "../adminComponents/integrations/nexarSettings";
import OdooSettings from "../adminComponents/integrations/odooSettings";

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
  const [hasDigikeyCredentials, setHasDigikeyCredentials] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // State for Nexar settings
  const [nexarClientId, setNexarClientId] = useState("");
  const [nexarClientSecret, setNexarClientSecret] = useState("");
  const [hasNexarCredentials, setHasNexarCredentials] = useState(false);
  
  // State for Odoo settings
  const [odooEnabled, setOdooEnabled] = useState(false);
  const [odooUrl, setOdooUrl] = useState("");
  const [odooDatabase, setOdooDatabase] = useState("");
  const [odooUsername, setOdooUsername] = useState("");
  const [odooApiKey, setOdooApiKey] = useState("");
  const [hasOdooCredentials, setHasOdooCredentials] = useState(false);
  const [odooAutoPush, setOdooAutoPush] = useState(false);
  const [odooDefaultProductCategoryId, setOdooDefaultProductCategoryId] = useState(null);
  const [odooDefaultUomId, setOdooDefaultUomId] = useState(null);
  const [odooDefaultProductType, setOdooDefaultProductType] = useState("product");
  const [testingOdooConnection, setTestingOdooConnection] = useState(false);
  
  // New Odoo configuration fields
  const [odooDefaultSaleOk, setOdooDefaultSaleOk] = useState(false);
  const [odooDefaultPurchaseOk, setOdooDefaultPurchaseOk] = useState(true);
  const [odooDefaultRentOk, setOdooDefaultRentOk] = useState(false);
  const [odooDefaultIsStorable, setOdooDefaultIsStorable] = useState(true);
  const [odooDefaultTracking, setOdooDefaultTracking] = useState("none");
  const [odooCategoryParts, setOdooCategoryParts] = useState("Purchased Goods");
  const [odooCategoryPcbas, setOdooCategoryPcbas] = useState("Purchased Goods");
  const [odooCategoryAssemblies, setOdooCategoryAssemblies] = useState("Manufactured");
  const [odooUpdateFieldsExisting, setOdooUpdateFieldsExisting] = useState(["name", "description", "image"]);
  
  // State for suppliers
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  
  // Nexar supplier mappings: { supplierId: nexarSellerId }
  const [nexarSupplierMappings, setNexarSupplierMappings] = useState({});

  const sections = [
    { id: "digikey", title: "DigiKey", icon: "search", disabled: false },
    { id: "nexar", title: "Nexar", icon: "search", disabled: false },
    { id: "odoo", title: "Odoo", icon: "cloud-upload", disabled: false },
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
          
          // Initialize nexarSupplierMappings from loaded suppliers
          const mappings = {};
          suppliersList.forEach(s => {
            if (s.nexar_seller_id) {
              mappings[s.id] = s.nexar_seller_id;
            }
          });
          setNexarSupplierMappings(mappings);
          
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
          // DigiKey settings
          setDigikeyClientId(res.data.digikey_client_id || "");
          setDigikeyClientSecret(res.data.digikey_client_secret || "");
          setDigikeyLocaleSite(res.data.digikey_locale_site || "US");
          setDigikeyLocaleCurrency(res.data.digikey_locale_currency || "USD");
          setDigikeyLocaleLanguage(res.data.digikey_locale_language || "en");
          setDigikeySupplierId(res.data.digikey_supplier_id || null);
          setHasDigikeyCredentials(res.data.has_digikey_credentials || false);
          
          // Nexar settings
          setNexarClientId(res.data.nexar_client_id || "");
          setNexarClientSecret(res.data.nexar_client_secret || "");
          setHasNexarCredentials(res.data.has_nexar_credentials || false);
          
          // Odoo settings
          setOdooEnabled(res.data.odoo_enabled || false);
          setOdooUrl(res.data.odoo_url || "");
          setOdooDatabase(res.data.odoo_database || "");
          setOdooUsername(res.data.odoo_username || "");
          setOdooApiKey(res.data.odoo_api_key || "");
          setHasOdooCredentials(res.data.has_odoo_credentials || false);
          setOdooAutoPush(res.data.odoo_auto_push_on_release || false);
          setOdooDefaultProductCategoryId(res.data.odoo_default_product_category_id || null);
          setOdooDefaultUomId(res.data.odoo_default_uom_id || null);
          setOdooDefaultProductType(res.data.odoo_default_product_type || "product");
          // New configuration fields
          setOdooDefaultSaleOk(res.data.odoo_default_sale_ok !== undefined ? res.data.odoo_default_sale_ok : false);
          setOdooDefaultPurchaseOk(res.data.odoo_default_purchase_ok !== undefined ? res.data.odoo_default_purchase_ok : true);
          setOdooDefaultRentOk(res.data.odoo_default_rent_ok !== undefined ? res.data.odoo_default_rent_ok : false);
          setOdooDefaultIsStorable(res.data.odoo_default_is_storable !== undefined ? res.data.odoo_default_is_storable : true);
          setOdooDefaultTracking(res.data.odoo_default_tracking || "none");
          setOdooCategoryParts(res.data.odoo_category_parts || "Purchased Goods");
          setOdooCategoryPcbas(res.data.odoo_category_pcbas || "Purchased Goods");
          setOdooCategoryAssemblies(res.data.odoo_category_assemblies || "Manufactured");
          setOdooUpdateFieldsExisting(res.data.odoo_update_fields_existing || ["name", "description", "image"]);
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
  
  const handleNexarSubmit = () => {
    const data = {
      nexar_client_id: nexarClientId,
      nexar_client_secret: nexarClientSecret,
    };

    // First save the API credentials
    updateIntegrationSettings(data)
      .then((res) => {
        if (res.status === 200) {
          // Then save supplier mappings
          const mappingPromises = Object.entries(nexarSupplierMappings).map(([supplierId, nexarSellerId]) => {
            return updateSupplier(supplierId, { nexar_seller_id: nexarSellerId });
          });

          return Promise.all(mappingPromises);
        } else {
          throw new Error("Failed to update Nexar settings");
        }
      })
      .then(() => {
        toast.success("Nexar settings and supplier mappings updated successfully");
        if (setRefresh) {
          setRefresh(true);
        }
        // Reload to get updated state
        loadSettings();
        loadSuppliers();
      })
      .catch((err) => {
        console.error("Error updating Nexar settings:", err);
        toast.error("Failed to update Nexar settings");
      });
  };

  const handleOdooSubmit = () => {
    const data = {
      odoo_enabled: odooEnabled,
      odoo_url: odooUrl,
      odoo_database: odooDatabase,
      odoo_username: odooUsername,
      odoo_api_key: odooApiKey,
      odoo_auto_push_on_release: odooAutoPush,
      odoo_default_product_category_id: odooDefaultProductCategoryId,
      odoo_default_uom_id: odooDefaultUomId,
      odoo_default_product_type: odooDefaultProductType,
      // New configuration fields
      odoo_default_sale_ok: odooDefaultSaleOk,
      odoo_default_purchase_ok: odooDefaultPurchaseOk,
      odoo_default_rent_ok: odooDefaultRentOk,
      odoo_default_is_storable: odooDefaultIsStorable,
      odoo_default_tracking: odooDefaultTracking,
      odoo_category_parts: odooCategoryParts,
      odoo_category_pcbas: odooCategoryPcbas,
      odoo_category_assemblies: odooCategoryAssemblies,
      odoo_update_fields_existing: odooUpdateFieldsExisting,
    };

    updateIntegrationSettings(data)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Odoo settings updated successfully");
          if (setRefresh) {
            setRefresh(true);
          }
          loadSettings();
        }
      })
      .catch((err) => {
        console.error("Error updating Odoo settings:", err);
        toast.error("Failed to update Odoo settings");
      });
  };

  const handleTestOdooConnection = () => {
    if (!odooUrl || !odooUrl.trim()) {
      toast.error("Please enter Odoo URL before testing");
      return;
    }
    
    if (!odooDatabase || !odooDatabase.trim()) {
      toast.error("Please enter Database Name before testing");
      return;
    }
    
    if (!odooUsername || !odooUsername.trim()) {
      toast.error("Please enter Username before testing");
      return;
    }
    
    if (!odooApiKey || !odooApiKey.trim()) {
      toast.error("Please enter API Key before testing");
      return;
    }

    setTestingOdooConnection(true);
    
    // First save the credentials temporarily for testing
    const testData = {
      odoo_enabled: odooEnabled,
      odoo_url: odooUrl.trim(),
      odoo_database: odooDatabase.trim(),
      odoo_username: odooUsername.trim(),
      odoo_api_key: odooApiKey.trim(),
    };

    updateIntegrationSettings(testData)
      .then(() => {
        // Now test the connection
        return testOdooConnection();
      })
      .then((res) => {
        if (res.status === 200 && res.data.success) {
          toast.success(`Connection successful! Connected to Odoo ${res.data.version?.server_version || ''}`);
        } else {
          toast.error(res.data.message || "Connection failed");
        }
      })
      .catch((err) => {
        console.error("Connection test error:", err);
        const errorMsg = err.response?.data?.message || err.response?.data?.error || "Connection test failed";
        toast.error(errorMsg);
      })
      .finally(() => {
        setTestingOdooConnection(false);
      });
  };

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
      <DigikeySettings
        loading={loading}
        digikeyClientId={digikeyClientId}
        setDigikeyClientId={setDigikeyClientId}
        digikeyClientSecret={digikeyClientSecret}
        setDigikeyClientSecret={setDigikeyClientSecret}
        hasDigikeyCredentials={hasDigikeyCredentials}
        digikeyLocaleSite={digikeyLocaleSite}
        setDigikeyLocaleSite={setDigikeyLocaleSite}
        digikeyLocaleCurrency={digikeyLocaleCurrency}
        setDigikeyLocaleCurrency={setDigikeyLocaleCurrency}
        digikeyLocaleLanguage={digikeyLocaleLanguage}
        setDigikeyLocaleLanguage={setDigikeyLocaleLanguage}
        digikeySupplierId={digikeySupplierId}
        setDigikeySupplierId={setDigikeySupplierId}
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        loadingSuppliers={loadingSuppliers}
        creatingSupplier={creatingSupplier}
        handleCreateDigikeySupplier={handleCreateDigikeySupplier}
        handleTestConnection={handleTestConnection}
        testingConnection={testingConnection}
        handleSubmit={handleSubmit}
      />
    );
  };

  const renderNexar = () => {
    return (
      <NexarSettings
        loading={loading}
        nexarClientId={nexarClientId}
        setNexarClientId={setNexarClientId}
        nexarClientSecret={nexarClientSecret}
        setNexarClientSecret={setNexarClientSecret}
        hasNexarCredentials={hasNexarCredentials}
        handleNexarSubmit={handleNexarSubmit}
        suppliers={suppliers}
        supplierOptions={supplierOptions}
        loadingSuppliers={loadingSuppliers}
        nexarSupplierMappings={nexarSupplierMappings}
        setNexarSupplierMappings={setNexarSupplierMappings}
      />
    );
  };

  const renderOdoo = () => {
    return (
      <OdooSettings
        loading={loading}
        odooEnabled={odooEnabled}
        setOdooEnabled={setOdooEnabled}
        odooUrl={odooUrl}
        setOdooUrl={setOdooUrl}
        odooDatabase={odooDatabase}
        setOdooDatabase={setOdooDatabase}
        odooUsername={odooUsername}
        setOdooUsername={setOdooUsername}
        odooApiKey={odooApiKey}
        setOdooApiKey={setOdooApiKey}
        hasOdooCredentials={hasOdooCredentials}
        odooAutoPush={odooAutoPush}
        setOdooAutoPush={setOdooAutoPush}
        odooDefaultProductCategoryId={odooDefaultProductCategoryId}
        setOdooDefaultProductCategoryId={setOdooDefaultProductCategoryId}
        odooDefaultUomId={odooDefaultUomId}
        setOdooDefaultUomId={setOdooDefaultUomId}
        odooDefaultProductType={odooDefaultProductType}
        setOdooDefaultProductType={setOdooDefaultProductType}
        odooDefaultSaleOk={odooDefaultSaleOk}
        setOdooDefaultSaleOk={setOdooDefaultSaleOk}
        odooDefaultPurchaseOk={odooDefaultPurchaseOk}
        setOdooDefaultPurchaseOk={setOdooDefaultPurchaseOk}
        odooDefaultRentOk={odooDefaultRentOk}
        setOdooDefaultRentOk={setOdooDefaultRentOk}
        odooDefaultIsStorable={odooDefaultIsStorable}
        setOdooDefaultIsStorable={setOdooDefaultIsStorable}
        odooDefaultTracking={odooDefaultTracking}
        setOdooDefaultTracking={setOdooDefaultTracking}
        odooCategoryParts={odooCategoryParts}
        setOdooCategoryParts={setOdooCategoryParts}
        odooCategoryPcbas={odooCategoryPcbas}
        setOdooCategoryPcbas={setOdooCategoryPcbas}
        odooCategoryAssemblies={odooCategoryAssemblies}
        setOdooCategoryAssemblies={setOdooCategoryAssemblies}
        odooUpdateFieldsExisting={odooUpdateFieldsExisting}
        setOdooUpdateFieldsExisting={setOdooUpdateFieldsExisting}
        handleTestConnection={handleTestOdooConnection}
        testingConnection={testingOdooConnection}
        handleSubmit={handleOdooSubmit}
      />
    );
  };



  const renderSectionContent = () => {
    switch (activeSection) {
      case "digikey":
        return renderDigikey();
      case "nexar":
        return renderNexar();
      case "odoo":
        return renderOdoo();
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

