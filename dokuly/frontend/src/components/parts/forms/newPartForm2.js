import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Col, Row } from "react-bootstrap";
import { getActiveProjectByCustomer, fetchProjects } from "../../projects/functions/queries";
import { get_active_customers } from "../../customers/funcitons/queries";
import { fetchOrg } from "../../admin/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import { usePartTypes } from "../partTypes/usePartTypes";
import DokulyModal from "../../dokuly_components/dokulyModal";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";
import { newPart, searchPartsByMpn, searchNexarParts, checkNexarConfig, createPricesFromNexar, searchDigikeyParts, getDigikeyProductDetails, checkDigikeyConfig } from "../functions/queries";
import { addNewPrice } from "../../common/priceCard/queries";
import { fetchIntegrationSettings } from "../../admin/functions/queries";
import PartPeek from "../../common/partPeek";

/**
 * # Button with form to create a new part.
 */
const PartNewForm = (props) => {
  // Form Fields
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [partType, setPartType] = useState(null);
  const [unit, setUnit] = useState("pcs");
  const [git_link, setGitLink] = useState("");
  const [price, setPrice] = useState(0.0);
  const [mpn, setMpn] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [datasheet, setDatasheet] = useState("");
  const [image_url, setImageUrl] = useState("");
  const [is_internal, setIsInternal] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const [active_customers, setActiveCustomers] = useState(null);
  const [selected_customer_id, setSelectedCustomerId] = useState(-1);

  const [projects, setProjects] = useState(null);
  const [selected_project_id, setSelectedProjectId] = useState(-1);


  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchResultSelected, setIsSearchResultSelected] = useState(false);

  const [price_history, setPriceHistory] = useState(null);
  const [part_information, setPartInformation] = useState(null);
  const [stock, setStock] = useState(null);
  const [urls, setUrls] = useState(null);

  const [externalPartNumber, setExternalPartNumber] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [organization, setOrganization] = useState(null);

  const [mpnConflicts, setMpnConflicts] = useState([]);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [nexarResults, setNexarResults] = useState([]);
  const [isSearchingNexar, setIsSearchingNexar] = useState(false);
  const [showNexarResults, setShowNexarResults] = useState(false);
  const [isNexarConfigured, setIsNexarConfigured] = useState(false);
  const [digikeyResults, setDigikeyResults] = useState([]);
  const [isSearchingDigikey, setIsSearchingDigikey] = useState(false);
  const [showDigikeyResults, setShowDigikeyResults] = useState(false);
  const [isDigikeyConfigured, setIsDigikeyConfigured] = useState(false);
  const [selectedDigikeyProduct, setSelectedDigikeyProduct] = useState(null);
  const [digikeyProductDetails, setDigikeyProductDetails] = useState(null);
  const [isLoadingDigikeyDetails, setIsLoadingDigikeyDetails] = useState(false);

  const partTypes = usePartTypes();

  useEffect(() => {
    // Fetch organization settings
    fetchOrg().then((res) => {
      if (res.status === 200) {
        setOrganization(res.data);
      }
    });

    // Check if Nexar is configured
    checkNexarConfig().then((res) => {
      if (res.status === 200 && res.data) {
        setIsNexarConfigured(res.data.configured || false);
      }
    }).catch((err) => {
      console.error("Error checking Nexar config:", err);
      setIsNexarConfigured(false);
    });

    // Check if DigiKey is configured
    checkDigikeyConfig().then((res) => {
      if (res.status === 200 && res.data) {
        setIsDigikeyConfigured(res.data.configured || false);
      }
    }).catch((err) => {
      console.error("Error checking DigiKey config:", err);
      setIsDigikeyConfigured(false);
    });
  }, []);

  const enter_part_information = (suggestion) => {
    if (suggestion == null) {
      return;
    }

    const information = parse_cv_data(suggestion);
    setIsSearchResultSelected(true);
    setMpn(information.mpn);
    setDisplayName(information.display_name);
    setDescription(information.description);
    setPrice(information.price);
    if (
      information.currency === null ||
      information.currency === undefined ||
      information.currency === ""
    ) {
      if (
        information.part_information.currency_price !== null &&
        information.part_information.currency_price !== undefined &&
        information.part_information.currency_price !== null &&
        information.part_information.currency_price !== ""
      ) {
        setCurrency(information.part_information.currency_price);
      }
    } else {
      setCurrency("USD");
    }
    setManufacturer(information.manufacturer);
    setDatasheet(information.datasheet_link);
    setImageUrl(information.image_link);
    setPriceHistory(information?.price_history);
    setPartInformation(information?.part_information);
    setStock(information?.stock);
    setUrls(information?.urls);
  };

  useEffect(() => {
    // Always load all active projects
    fetchProjects().then((res) => {
      if (res?.status === 200) {
        setProjects(res.data);
      }
    });
  }, [organization]);

  const [isCtrlDown, setIsCtrlDown] = useState(false);

  useEffect(() => {
    const keydownHandler = (event) => {
      if (event.key === "Control" || event.key === "Meta") {
        setIsCtrlDown(true);
      }
    };

    const keyupHandler = (event) => {
      if (event.key === "Control") {
        setIsCtrlDown(false);
      }
    };

    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);

    return () => {
      window.removeEventListener("keydown", keydownHandler);
      window.removeEventListener("keyup", keyupHandler);
    };
  }, [isCtrlDown]);

  const launchForm = () => {
    setShowModal(true);
    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
  };

  const handleMpnBlur = async () => {
    if (!mpn || mpn.trim() === "") {
      setMpnConflicts([]);
      return;
    }

    try {
      // Search for local conflicts
      const response = await searchPartsByMpn(mpn.trim());
      if (response.status === 200 && response.data) {
        setMpnConflicts(response.data);
      }

      // Also search Nexar in background to cache results
      if (isNexarConfigured) {
        searchNexarParts(mpn.trim(), 10)
          .then((nexarResponse) => {
            if (nexarResponse.status === 200 && nexarResponse.data) {
              // Results are now cached, don't show them yet
              setNexarResults(nexarResponse.data.results || []);
            }
          })
          .catch((error) => {
            console.error("Error pre-caching Nexar results:", error);
          });
      }

      // Also search DigiKey in background to cache results (only if configured)
      if (isDigikeyConfigured) {
        // Use a small delay to avoid overwhelming the API if user is typing quickly
        setTimeout(() => {
          searchDigikeyParts(mpn.trim(), 10)
            .then((digikeyResponse) => {
              if (digikeyResponse.status === 200 && digikeyResponse.data) {
                // Results are now cached, don't show them yet
                setDigikeyResults(digikeyResponse.data.results || []);
              }
            })
            .catch((error) => {
              // Silently fail for background pre-caching - don't show errors to user
              console.debug("Error pre-caching DigiKey results (non-critical):", error);
            });
        }, 300); // Small delay to debounce
      }
    } catch (error) {
      console.error("Error searching for MPN conflicts:", error);
      setMpnConflicts([]);
    }
  };

  const handleNexarSearch = async () => {
    if (!mpn || mpn.trim() === "") {
      toast.info("Please enter an MPN to search");
      return;
    }

    // If we already have results from blur, show them immediately
    if (nexarResults.length > 0) {
      setShowNexarResults(true);
      return;
    }

    setIsSearchingNexar(true);
    setShowNexarResults(false);
    
    try {
      const response = await searchNexarParts(mpn.trim(), 10);
      if (response.status === 200 && response.data) {
        setNexarResults(response.data.results || []);
        setShowNexarResults(true);
        if (response.data.results && response.data.results.length === 0) {
          toast.info("No results found in Nexar");
        }
      }
    } catch (error) {
      console.error("Error searching Nexar:", error);
      toast.error("Failed to search Nexar. Please try again.");
      setNexarResults([]);
    } finally {
      setIsSearchingNexar(false);
    }
  };

  const applyNexarResult = (result) => {
    
    // Auto-populate form with Nexar data
    if (result.mpn) setMpn(result.mpn);
    if (result.manufacturer) setManufacturer(result.manufacturer);
    if (result.description) setDisplayName(result.description); 
    if (result.datasheet) setDatasheet(result.datasheet);
    if (result.image_url) setImageUrl(result.image_url);
    if (result.display_name) {}
    
    // Store Nexar part ID and seller data for future reference
    if (result.nexar_part_id) {
      // We'll send this when creating the part, including sellers for price creation
      const newPartInfo = {
        ...part_information,
        source: "nexar",
        nexar_part_id: result.nexar_part_id,
        category: result.category,
        manufacturer_id: result.manufacturer_id,
        specifications: result.technical_specs || [],
        sellers: result.sellers || [], // Store seller offers for price creation
      };
      setPartInformation(newPartInfo);
    }
    
    setShowNexarResults(false);
    toast.success("Part information imported from Nexar");
  };

  const handleDigikeySearch = async () => {
    if (!mpn || mpn.trim() === "") {
      toast.info("Please enter an MPN to search");
      return;
    }

    // If we already have results, show them immediately
    if (digikeyResults.length > 0) {
      setShowDigikeyResults(true);
      return;
    }

    setIsSearchingDigikey(true);
    setShowDigikeyResults(false);
    
    try {
      const response = await searchDigikeyParts(mpn.trim(), 10);
      if (response.status === 200 && response.data) {
        setDigikeyResults(response.data.results || []);
        setShowDigikeyResults(true);
        if (response.data.results && response.data.results.length === 0) {
          toast.info("No results found in DigiKey");
        }
      }
    } catch (error) {
      console.error("Error searching DigiKey:", error);
      toast.error("Failed to search DigiKey. Please try again.");
      setDigikeyResults([]);
    } finally {
      setIsSearchingDigikey(false);
    }
  };

  const handleDigikeyProductSelect = async (product) => {
    
    // Check if we have the required part number - try multiple possible field names
    const partNumber = product.digikey_part_number || 
                       product.DigiKeyPartNumber || 
                       product.digikeyPartNumber ||
                       product.product_id ||
                       product.id;
    
    if (!partNumber) {
      console.error("Product missing digikey_part_number. Available fields:", Object.keys(product));
      toast.error("Product details unavailable: missing part number. Check console for details.");
      return;
    }
    
    setSelectedDigikeyProduct(product);
    setIsLoadingDigikeyDetails(true);
    
    try {
      const response = await getDigikeyProductDetails(partNumber);
      if (response.status === 200 && response.data && response.data.result) {
        setDigikeyProductDetails(response.data.result);
      } else {
        const errorMsg = response.data?.error || "Failed to load product details";
        toast.error(errorMsg);
        console.error("Failed to load product details:", response.data);
      }
    } catch (error) {
      console.error("Error loading DigiKey product details:", error);
      const errorMsg = error.response?.data?.error || error.message || "Failed to load product details";
      toast.error(errorMsg);
    } finally {
      setIsLoadingDigikeyDetails(false);
    }
  };

  const applyDigikeyResult = (productDetails) => {
    const detailsToUse = productDetails || digikeyProductDetails;
    
    if (!detailsToUse) {
      toast.error("No product details available");
      return;
    }

    // Auto-populate form with DigiKey data - set MPN exactly as provided
    if (detailsToUse.manufacturer_part_number) {
      setMpn(detailsToUse.manufacturer_part_number);
    }
    if (detailsToUse.manufacturer) {
      setManufacturer(detailsToUse.manufacturer);
    }
    
    // Handle product_description which might be a string or object
    let descriptionText = '';
    if (detailsToUse.product_description) {
      if (typeof detailsToUse.product_description === 'string') {
        descriptionText = detailsToUse.product_description;
      } else if (typeof detailsToUse.product_description === 'object') {
        descriptionText = detailsToUse.product_description.DetailedDescription || 
                         detailsToUse.product_description.ProductDescription || 
                         '';
      }
    }
    if (descriptionText) setDisplayName(descriptionText);
    
    if (detailsToUse.datasheet_url) setDatasheet(detailsToUse.datasheet_url);
    if (detailsToUse.primary_photo) setImageUrl(detailsToUse.primary_photo);
    
    // Parse compliance statuses
    // RoHS: "ROHS3 Compliant" -> true, "ROHS Compliant" -> true, etc.
    const isRoHS = detailsToUse.rohs_status && 
                   (detailsToUse.rohs_status.toLowerCase().includes('compliant') || 
                    detailsToUse.rohs_status.toLowerCase().includes('yes'));
    
    // REACH: "REACH Unaffected" -> true, "REACH Compliant" -> true, etc.
    const isReach = detailsToUse.reach_status && 
                    (detailsToUse.reach_status.toLowerCase().includes('unaffected') || 
                     detailsToUse.reach_status.toLowerCase().includes('compliant') ||
                     detailsToUse.reach_status.toLowerCase().includes('yes'));
    
    // Store DigiKey part information with specifications
    // Flatten specifications into part_information so they display correctly in the specs table
    // Note: production_status, is_rohs_compliant, is_reach_compliant, and export_control_classification_number
    // are stored in separate model fields, NOT in part_information
    const partInfo = {
      ...part_information,
      source: "digikey",
      digikey_part_number: detailsToUse.digikey_part_number || '',
      digikey_product_id: detailsToUse.digikey_part_number || '',
      // Flatten specifications into the main object for display
      ...(detailsToUse.specifications || {}),
      // Store pricing info temporarily for price creation (not displayed in specs)
      unit_price: detailsToUse.unit_price || null, // Store for backward compatibility
      pricing_tiers: detailsToUse.pricing_tiers || [], // Store pricing tiers for priceCard
      currency: detailsToUse.currency || 'USD', // Store for price creation
      // Store compliance and status fields temporarily in part_information for submission
      // These will be extracted in onSubmit and stored in separate model fields
      production_status: detailsToUse.production_status || '',
      estimated_factory_lead_days: detailsToUse.estimated_factory_lead_days || null,
      is_rohs_compliant: isRoHS,
      is_reach_compliant: isReach,
      export_control_classification_number: detailsToUse.export_control_classification_number || '',
    };
    
    setPartInformation(partInfo);
    
    setShowDigikeyResults(false);
    setSelectedDigikeyProduct(null);
    setDigikeyProductDetails(null);
    toast.success("Part information imported from DigiKey");
  };

  const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span style={{ backgroundColor: "#ffeb3b", fontWeight: "bold" }}>
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  function onSubmit() {
    const data = {
      display_name: display_name,
      description: description,
      project: parseInt(selected_project_id),
      internal: is_internal,
      part_type: partType?.id,
      unit: unit,
      git_link: git_link,
      mpn: mpn,
      manufacturer: manufacturer,
      datasheet: datasheet,
      image_url: image_url,
      currency: currency,
      // Clean part_information - remove fields that are stored in separate model fields or only used temporarily
      part_information: (() => {
        if (!part_information) return null;
        const {
          production_status: _production_status,
          is_rohs_compliant: _is_rohs_compliant,
          is_reach_compliant: _is_reach_compliant,
          export_control_classification_number: _export_control_classification_number,
          estimated_factory_lead_days: _estimated_factory_lead_days,
          currency: _currency, // Only used temporarily for price creation, not stored in part_information
          ...cleaned
        } = part_information;
        return cleaned;
      })(),
      urls: urls,
      external_part_number: externalPartNumber,
      source: part_information?.source || "manual",
      // Pass compliance and status fields directly (stored in separate model fields)
      production_status: part_information?.production_status || null,
      is_rohs_compliant: part_information?.is_rohs_compliant || false,
      is_reach_compliant: part_information?.is_reach_compliant || false,
      export_control_classification_number: part_information?.export_control_classification_number || null,
      estimated_factory_lead_days: part_information?.estimated_factory_lead_days || null,
    };

    newPart(data).then((res) => {
      if (res.status === 201) {
        // If part was created from DigiKey and has pricing info, create price entries
        if (part_information?.source === "digikey") {
          const pricingTiers = part_information?.pricing_tiers || [];
          const currency = part_information?.currency || "USD";
          
          // Get DigiKey supplier ID from integration settings
          fetchIntegrationSettings()
            .then((settingsRes) => {
              const digikeySupplierId = settingsRes.data?.digikey_supplier_id || null;
              
              if (!digikeySupplierId) {
                console.warn("DigiKey supplier not configured in integration settings. Prices will be created without supplier.");
              }
              
              if (pricingTiers.length > 0) {
                // Deduplicate pricing tiers based on minimum_order_quantity
                // Keep the tier with the lowest price for each unique quantity
                const uniqueTiersMap = new Map();
                
                pricingTiers.forEach((tier) => {
                  const qty = tier.minimum_order_quantity || 1;
                  const existing = uniqueTiersMap.get(qty);
                  
                  if (!existing) {
                    // No existing tier for this quantity, add it
                    uniqueTiersMap.set(qty, tier);
                  } else {
                    // If we have a duplicate quantity, keep the one with the lower price
                    if (tier.price < existing.price) {
                      uniqueTiersMap.set(qty, tier);
                    }
                  }
                });
                
                const uniqueTiers = Array.from(uniqueTiersMap.values());
                
                if (uniqueTiers.length < pricingTiers.length) {
                  console.log(`Removed ${pricingTiers.length - uniqueTiers.length} duplicate price tiers with same quantity`);
                }
                
                // Create a price entry for each unique pricing tier
                const pricePromises = uniqueTiers.map((tier) => 
                  addNewPrice(
                    "parts",
                    res.data.id,
                    tier.price,
                    tier.minimum_order_quantity,
                    currency,
                    digikeySupplierId // Use DigiKey supplier from integration settings
                  )
                );
                
                Promise.all(pricePromises)
                  .then((priceResults) => {
                  })
                  .catch((err) => {
                    console.error("Error creating DigiKey prices:", err);
                    // Don't show error to user as part was created successfully
                  });
              } else if (part_information?.unit_price) {
                // Fallback to single price if no tiers available
                addNewPrice(
                  "parts",
                  res.data.id,
                  part_information.unit_price,
                  1, // minimum_order_quantity
                  currency,
                  digikeySupplierId // Use DigiKey supplier from integration settings
                ).then((priceRes) => {
                  if (priceRes.status === 201) {
                    console.log("DigiKey price created successfully");
                  }
                }).catch((err) => {
                  console.error("Error creating DigiKey price:", err);
                });
              }
            })
            .catch((err) => {
              console.error("Error fetching integration settings, creating prices without supplier:", err);
              // Fallback: create prices without supplier if settings fetch fails
              if (pricingTiers.length > 0) {
                // Deduplicate pricing tiers based on minimum_order_quantity
                const uniqueTiersMap = new Map();
                
                pricingTiers.forEach((tier) => {
                  const qty = tier.minimum_order_quantity || 1;
                  const existing = uniqueTiersMap.get(qty);
                  
                  if (!existing || tier.price < existing.price) {
                    uniqueTiersMap.set(qty, tier);
                  }
                });
                
                const uniqueTiers = Array.from(uniqueTiersMap.values());
                
                const pricePromises = uniqueTiers.map((tier) => 
                  addNewPrice(
                    "parts",
                    res.data.id,
                    tier.price,
                    tier.minimum_order_quantity,
                    currency,
                    null
                  )
                );
                Promise.all(pricePromises).catch((err) => console.error("Error creating prices:", err));
              } else if (part_information?.unit_price) {
                addNewPrice(
                  "parts",
                  res.data.id,
                  part_information.unit_price,
                  1,
                  currency,
                  null
                ).catch((err) => console.error("Error creating price:", err));
              }
            });
        }
        
        
        if (part_information?.source === "nexar" && part_information?.sellers) {
          const sellersData = part_information.sellers;
          
          if (sellersData.length > 0) {
            
            createPricesFromNexar(res.data.id, sellersData)
              .then((priceRes) => {
                if (priceRes.status === 200 && priceRes.data) {
                  const { created, skipped, errors, details } = priceRes.data;
                  
                  if (created > 0) {
                    toast.success(`Created ${created} price(s) from Nexar sellers`);
                  }
                  
                  if (errors && errors.length > 0) {
                    console.error("Errors creating some Nexar prices:", errors);
                  }
                }
              })
              .catch((err) => {
                console.error("Error creating Nexar prices:", err);
                // Don't show error to user as part was created successfully
              });
          }
        }
        
        resetFields();
        props.setRefresh(true);
        const hasPricing = (part_information?.source === "digikey" && 
                           (part_information?.pricing_tiers?.length > 0 || part_information?.unit_price)) ||
                           (part_information?.source === "nexar" && part_information?.sellers?.length > 0);
        toast.success(`Part created${hasPricing ? ` with pricing data` : ""}`);
        if (props?.addSuggestedPartToBom) {
          props?.addSuggestedPartToBom(
            res.data,
            props?.row,
            props?.selectedRefdes,
            props?.dnm
          );
        }
      }
    });
    setShowModal(false);
  }

  function resetFields() {
    setDisplayName("");
    setDescription("");
    setPartType("");
    setUnit("pcs");
    setGitLink("");
    setMpn("");
    setManufacturer("");
    setDatasheet("");
    setImageUrl("");
    setIsInternal(false);
    setIsSearchResultSelected(false);
    setMpnConflicts([]);
    setNexarResults([]);
    setShowNexarResults(false);
    setDigikeyResults([]);
    setShowDigikeyResults(false);
    setSelectedDigikeyProduct(null);
    setDigikeyProductDetails(null);
    props?.setRefresh(true);
  }

  const internalOptions = (
    <div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-control"
          type="text"
          name="description"
          onChange={(e) => {
            if (e.target.value.length > 500) {
              toast("Max length 500");
              return;
            }
            setDescription(e.target.value);
          }}
          value={description || ""}
        />
      </div>

      <ExternalPartNumberFormGroup
        externalPartNumber={externalPartNumber}
        setExternalPartNumber={setExternalPartNumber}
      />

      <div className="form-group">
        <label htmlFor="project">Project *</label>
        <select
          className="form-control"
          name="project"
          type="number"
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">Choose project</option>
          {projects == null || projects === undefined
            ? ""
            : projects
                .sort((a, b) => (a.project_number > b.project_number ? 1 : -1))
                .map((project) => {
                  return (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  );
                })}
        </select>
      </div>

      {partType?.name === "Software" ? (
        <div className="form-group">
          <label>Git link</label>
          <input
            className="form-control"
            type="text"
            name="git_link"
            onChange={(e) => {
              setGitLink(e.target.value);
            }}
            value={git_link}
          />
        </div>
      ) : (
        ""
      )}
    </div>
  );

  const externalOptions = (
    <div>
      <div style={{ position: "relative" }}>
        <div className="form-group mb-2">
          <label>Manufacturer Part Number</label>
          <Row>
            <Col>
              <div className={(isNexarConfigured || isDigikeyConfigured) ? "input-group" : ""}>
                <input
                  className="form-control"
                  type="text"
                  name="mpn"
                  onChange={(e) => {
                    setMpn(e.target.value);
                  }}
                  onBlur={handleMpnBlur}
                  value={mpn || ""}
                />
                {isNexarConfigured && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleNexarSearch}
                    disabled={isSearchingNexar || !mpn}
                    title="Search Nexar"
                    style={{ borderLeft: "none" }}
                  >
                    {isSearchingNexar ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <img
                        className="icon-dark"
                        src="../../static/icons/search.svg"
                        alt="Search Nexar"
                        style={{ width: "16px", height: "16px" }}
                      />
                    )}
                  </button>
                )}
                {isDigikeyConfigured && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleDigikeySearch}
                    disabled={isSearchingDigikey || !mpn}
                    title="Search DigiKey"
                    style={{ borderLeft: "none" }}
                  >
                    {isSearchingDigikey ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <img
                        className="icon-dark"
                        src="../../static/icons/search.svg"
                        alt="Search DigiKey"
                        style={{ width: "16px", height: "16px" }}
                      />
                    )}
                  </button>
                )}
              </div>
            </Col>
          </Row>
        </div>

        {mpnConflicts.length > 0 && (
          <div className="alert alert-warning" style={{ fontSize: "14px", padding: "10px", marginTop: "10px" }}>
            <div style={{ marginBottom: "8px", fontWeight: "600" }}>
              Existing parts with similar MPN:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {mpnConflicts.map((part, index) => (
                <div
                  key={part.id}
                  style={{ position: "relative" }}
                  onMouseEnter={() => setHoveredPart(part)}
                  onMouseLeave={() => setHoveredPart(null)}
                >
                  <span
                    style={{
                      cursor: "pointer",
                      padding: "2px 4px",
                      borderRadius: "3px",
                      backgroundColor: "#fff3cd",
                      border: "1px solid #ffc107",
                    }}
                  >
                    {highlightMatch(part.mpn, mpn)}
                  </span>
                  {hoveredPart?.id === part.id && (
                    <PartPeek item={part} type="part" position="bottom" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showNexarResults && nexarResults.length > 0 && (
          <div className="alert alert-info" style={{ fontSize: "14px", padding: "10px", marginTop: "10px" }}>
            <div style={{ marginBottom: "8px", fontWeight: "600" }}>
              Nexar Results ({nexarResults.length}):
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {nexarResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px",
                    marginBottom: "6px",
                    backgroundColor: "white",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => applyNexarResult(result)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
                    {result.image_url && (
                      <img
                        src={result.image_url}
                        alt="Part"
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "contain",
                          border: "1px solid #ddd",
                          borderRadius: "3px",
                          padding: "2px",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", fontSize: "13px", color: "#0056b3" }}>
                        {result.mpn}
                      </div>
                      {result.display_name && result.display_name !== result.mpn && (
                        <div style={{ fontSize: "12px", color: "#333", marginTop: "2px" }}>
                          {result.display_name}
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                        {result.manufacturer}
                        {result.category && ` • ${result.category}`}
                      </div>
                      {result.description && (
                        <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>
                          {result.description.length > 100
                            ? `${result.description.substring(0, 100)}...`
                            : result.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "11px" }}>
                        {result.total_avail > 0 && (
                          <span style={{ color: "#28a745" }}>
                            Available: {result.total_avail.toLocaleString()}
                          </span>
                        )}
                        {result.min_operating_temp && result.max_operating_temp && (
                          <span style={{ color: "#666" }}>
                            Temp: {result.min_operating_temp} to {result.max_operating_temp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#666" }}>
              Click a result to auto-populate form fields
            </div>
          </div>
        )}

        {showDigikeyResults && digikeyResults.length > 0 && (
          <div className="alert alert-info" style={{ fontSize: "14px", padding: "10px", marginTop: "10px" }}>
            <div style={{ marginBottom: "8px", fontWeight: "600" }}>
              DigiKey Results ({digikeyResults.length}):
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {digikeyResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px",
                    marginBottom: "6px",
                    backgroundColor: selectedDigikeyProduct?.digikey_part_number === result.digikey_part_number ? "#e7f3ff" : "white",
                    border: selectedDigikeyProduct?.digikey_part_number === result.digikey_part_number ? "2px solid #0056b3" : "1px solid #dee2e6",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDigikeyProductSelect(result)}
                  onMouseEnter={(e) => {
                    if (selectedDigikeyProduct?.digikey_part_number !== result.digikey_part_number) {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDigikeyProduct?.digikey_part_number !== result.digikey_part_number) {
                      e.currentTarget.style.backgroundColor = "white";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
                    {result.primary_photo && (
                      <img
                        src={result.primary_photo}
                        alt="Part"
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "contain",
                          border: "1px solid #ddd",
                          borderRadius: "3px",
                          padding: "2px",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", fontSize: "13px", color: "#0056b3" }}>
                        {result.manufacturer_part_number || result.digikey_part_number || "Part Number N/A"}
                      </div>
                      {result.digikey_part_number && result.digikey_part_number !== result.manufacturer_part_number && (
                        <div style={{ fontSize: "11px", color: "#666", marginTop: "1px" }}>
                          DigiKey: {result.digikey_part_number}
                        </div>
                      )}
                      {result.product_description && (
                        <div style={{ fontSize: "12px", color: "#333", marginTop: "2px" }}>
                          {typeof result.product_description === 'string' 
                            ? (result.product_description.length > 100
                                ? `${result.product_description.substring(0, 100)}...`
                                : result.product_description)
                            : (result.product_description.DetailedDescription || result.product_description.ProductDescription || JSON.stringify(result.product_description))
                          }
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                        {result.manufacturer}
                        {result.rohs_status && ` • ${result.rohs_status}`}
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "11px" }}>
                        {result.quantity_available > 0 && (
                          <span style={{ color: "#28a745" }}>
                            Available: {result.quantity_available.toLocaleString()}
                          </span>
                        )}
                        {result.unit_price && (
                          <span style={{ color: "#666" }}>
                            Price: {result.currency} {result.unit_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "8px", fontSize: "11px", color: "#666" }}>
              Click a result to load detailed information
            </div>
          </div>
        )}

        {selectedDigikeyProduct && digikeyProductDetails && (
          <div className="alert alert-success" style={{ fontSize: "14px", padding: "10px", marginTop: "10px" }}>
            <div style={{ marginBottom: "8px", fontWeight: "600" }}>
              Product Details - {digikeyProductDetails.manufacturer_part_number}
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>Description:</strong> {digikeyProductDetails.product_description || digikeyProductDetails.detailed_description}
              </div>
              {digikeyProductDetails.specifications && Object.keys(digikeyProductDetails.specifications).length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <strong>Specifications:</strong>
                  <div style={{ marginTop: "4px", fontSize: "12px" }}>
                    {Object.entries(digikeyProductDetails.specifications).slice(0, 10).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: "2px" }}>
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                    {Object.keys(digikeyProductDetails.specifications).length > 10 && (
                      <div style={{ color: "#666", fontStyle: "italic" }}>
                        ... and {Object.keys(digikeyProductDetails.specifications).length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button
                type="button"
                className="btn btn-sm dokuly-bg-primary text-white mt-2"
                onClick={() => applyDigikeyResult(digikeyProductDetails)}
              >
                Apply to Form
              </button>
            </div>
          </div>
        )}

        {selectedDigikeyProduct && isLoadingDigikeyDetails && (
          <div className="alert alert-info" style={{ fontSize: "14px", padding: "10px", marginTop: "10px" }}>
            <div className="text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="sr-only">Loading product details...</span>
              </div>
              <span style={{ marginLeft: "8px" }}>Loading product details...</span>
            </div>
          </div>
        )}
      </div>

      {!showSuggestions ? (
        <div className="form-group">
          <label>Manufacturer</label>
          <input
            className="form-control"
            type="text"
            name="manufacturer"
            onChange={(e) => {
              setManufacturer(e.target.value);
            }}
            value={manufacturer || ""}
          />
        </div>
      ) : (
        <div style={{ height: "3rem", minHeight: "3rem", maxHeight: "5rem" }} />
      )}
      <div className="form-group">
        <label>Datasheet link</label>
        <input
          className="form-control"
          type="text"
          name="datasheet"
          onChange={(e) => {
            setDatasheet(e.target.value);
          }}
          value={datasheet || ""}
          title="A URL to a web-hosted datasheet."
        />
      </div>

      <ExternalPartNumberFormGroup
        externalPartNumber={externalPartNumber}
        setExternalPartNumber={setExternalPartNumber}
      />
    </div>
  );

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={(e) => {
          // Prevent "mystery opens" caused by keyboard-triggered clicks (detail === 0)
          // which can happen when switching tabs and focus is on this button.
          if (e?.detail === 0) return;
          launchForm();
        }}
        onKeyDown={(e) => {
          // Keep keyboard accessibility while avoiding keyboard "click" events.
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            launchForm();
          }
        }}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">
            {props?.title ? props?.title : "New part"}
          </span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Create new part"
      >
        <div className="form-group">
          <label>Display name *</label>
          <input
            className="form-control"
            type="text"
            name="display_name"
            onChange={(e) => {
              setDisplayName(e.target.value);
            }}
            value={display_name || ""}
          />
        </div>

        <div className="form-group">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isInternalCheckbox"
              checked={is_internal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isInternalCheckbox">
              Internal part
            </label>
            <small className="form-text text-muted">
              Check this box if the part comes from your own organization. Leave
              it unchecked if the part is bought from external suppliers.
            </small>
          </div>
        </div>

        {is_internal === ""
          ? ""
          : is_internal === true
          ? internalOptions
          : externalOptions}
        <div className="form-group">
          <label>Part type *</label>
          {partTypes.length === 0 || partTypes === undefined ? (
            <div style={{ border: "1px solid red", padding: "10px" }}>
              <p>No part types exist. Create a new part type.</p>
              <Button
                href="#/adminPage/parts"
                className="btn dokuly-bg-primary"
                style={{ color: "white" }}
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Create new part type
              </Button>
            </div>
          ) : (
            <select
              className="form-control"
              name="part_type"
              value={partType ? partType?.name : ""}
              onChange={(e) => {
                const selectedPartType = partTypes.find(
                  (pt) => pt.name === e.target.value
                );
                setPartType(selectedPartType || null);
                setUnit(selectedPartType?.default_unit || "pcs");
              }}
            >
              <option value="">Select part type</option>
              {partTypes
                .filter((pt) => pt.applies_to === "Part")
                .map((pt) => (
                  <option key={pt.name} value={pt.name}>
                    {pt.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label>Part unit</label>
          <input
            className="form-control"
            type="text"
            name="unit"
            onChange={(e) => {
              if (e.target.value.length > 20) {
                toast.info("Max length 20");
              } else {
                setUnit(e.target.value);
              }
            }}
            value={unit || ""}
          />
        </div>
        <div className="form-group">
          <SubmitButton
            type="submit"
            disabled={
              partType === null ||
              partType === undefined ||
              display_name === "" ||
              (is_internal === true && selected_project_id === -1)
            }
            onClick={() => {
              onSubmit();
            }}
            disabledTooltip={
              "Mandatory fields must be entered. Mandatory fields are marked with *"
            }
          >
            Submit
          </SubmitButton>
        </div>
      </DokulyModal>
    </div>
  );
};

export default PartNewForm;
