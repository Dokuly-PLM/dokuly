import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Card, Col, Row, Form, Button } from "react-bootstrap";
import moment from "moment";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import NumericFieldEditor from "../../dokuly_components/dokulyTable/components/numericFieldEditor";
import useCurrencyConversions from "../../common/hooks/useCurrencyConversions";
import useSuppliers from "../../common/hooks/useSuppliers";
import { getOrganizationCurrency } from "../../parts/functions/queries";
import { getLatestPrices, editPrice } from "./queries";
import AddPrice from "./addPrice";
import DeletePrice from "./deletePrice";
import BomCost from "../bom/bomCost/bomCost";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import BulkUploadPricesModal from "./bulkUploadPricesModal";

const PriceCard = ({ app, itemId, unit = "", setRefresh, refresh }) => {
  const [refreshPrices, setRefreshPrices] = useState(false);
  const [prices, setPrices] = useState([]);
  const [organizationCurrency, setOrganizationCurrency] = useState("");
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [showBomCost, setShowBomCost] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [currencyKeysOptions, setCurrencyKeysOptions] = useState([]);
  const [doneFormatting, setDoneFormatting] = useState(false);

  const textSize = "12px";

  const {
    currencyPairs,
    currencyKeys,
    conversionRate,
    updatedAt,
    fetchCurrencyConversions,
    loading: loadingCurrency,
    error: errorCurrency,
  } = useCurrencyConversions(organizationCurrency);

  const [suppliers, refreshSuppliers, loadingSuppliers, errorSuppliers] =
    useSuppliers();

  // Fetching organization currency
  useEffect(() => {
    getOrganizationCurrency()
      .then((res) => {
        if (res && res.data) {
          setOrganizationCurrency(res.data);
        } else {
          console.error("No currency data returned, defaulting to USD");
          setOrganizationCurrency("USD");
        }
      })
      .catch((err) => {
        console.error("Error fetching organization currency:", err);
        // Default to USD if API fails
        setOrganizationCurrency("USD");
      });
  }, []);

  // Fetching latest prices
  useEffect(() => {
    if (refreshPrices) {
      setRefreshPrices(false);
    }

    getLatestPrices(app, itemId).then((res) => {
      if (res.status === 200) {
        setPrices(res.data);
      }
    });
  }, [app, itemId, refresh, refreshPrices]);

  // Supplier options for dropdown
  useEffect(() => {
    // Filter out the "None" option (which has key: -1 or no id) and any invalid entries
    const formattedSupplierOptions = suppliers
      .filter((supplier) => {
        // Filter out the "None" placeholder option
        if (supplier.key === -1 || supplier.value === null || supplier.id === null || supplier.id === undefined) {
          return false;
        }
        // Only include suppliers with valid id and name
        return supplier.id && supplier.name;
      })
      .map((supplier) => ({
        label: supplier.name,
        value: supplier.id,
      }));
    
    setSupplierOptions(formattedSupplierOptions);
  }, [suppliers]);

  // Currency options for dropdown
  useEffect(() => {
    const formattedCurrencyKeysOptions = currencyKeys.map((currency) => ({
      label: currency,
      value: currency,
    }));
    setCurrencyKeysOptions(formattedCurrencyKeysOptions);
  }, [currencyKeys]);

  useEffect(() => {
    // Allow doneFormatting even if suppliers are empty (suppliers are optional)
    if (
      !doneFormatting &&
      !loadingCurrency &&
      !loadingSuppliers &&
      currencyKeysOptions.length > 0
    ) {
      setDoneFormatting(true);
    }
  }, [
    loadingCurrency,
    loadingSuppliers,
    currencyKeysOptions,
    doneFormatting,
  ]);

  // Show error messages if there are issues
  if (errorCurrency || errorSuppliers) {
    console.error("PriceCard errors:", { errorCurrency, errorSuppliers });
  }

  // If currency keys are empty but not loading, set a default
  useEffect(() => {
    if (!loadingCurrency && currencyKeysOptions.length === 0 && organizationCurrency) {
      console.warn("No currency keys available, using default USD");
      setCurrencyKeysOptions([{ label: "USD", value: "USD" }]);
    }
  }, [loadingCurrency, currencyKeysOptions.length, organizationCurrency]);

  // Allow rendering even if suppliers fail to load (they're optional)
  // If there's an error loading suppliers (403), don't wait for them
  if (
    loadingCurrency ||
    (loadingSuppliers && !errorSuppliers) || // Only wait if loading and no error
    currencyKeysOptions.length === 0 ||
    (!doneFormatting && !errorCurrency) // Only wait for formatting if no currency error
  ) {
    return loadingSpinner();
  }

  // Handler to edit or update a price
  const handleEditSave = async (id, payload) => {
    const data = { ...payload };
    if (payload?.supplier_id) {
      const selectedSupplier = suppliers.find(
        (s) => s.id === payload?.supplier_id
      );
      data.currency = selectedSupplier
        ? selectedSupplier.default_currency || payload.currency
        : data.currency;
    }

    editPrice(id, data).then((res) => {
      if (res.status === 200) {
        toast.success("Price info updated successfully!");
        setRefreshPrices(true);
      } else {
        toast.error("Error updating price info.");
      }
    });
  };

  const columns = [
    {
      key: "minimum_order_quantity",
      header: "Quantity",
      editable: true,
      formatter: (row) => (
        <NumericFieldEditor
          number={row.minimum_order_quantity}
          setNumber={(value) =>
            handleEditSave(row.id, { minimum_order_quantity: value })
          }
        />
      ),
      maxWidth: "100px",
    },
    {
      key: "price",
      header: "Unit price",
      editable: true,
      formatter: (row) => (
        <NumericFieldEditor
          number={row.price}
          setNumber={(value) => handleEditSave(row.id, { price: value })}
        />
      ),
      maxWidth: "100px",
    },
    {
      key: "supplier",
      header: "Supplier",
      editable: true,
      formatter: (row) => {
        const stateValue = {
          label: row?.supplier?.name,
          value: row?.supplier?.id,
        };
        return (
          <GenericDropdownSelector
            state={stateValue?.value || null}
            setState={(value) =>
              handleEditSave(row.id, { supplier_id: value ? value : null })
            }
            dropdownValues={supplierOptions.length > 0 ? supplierOptions : [
              { 
                label: errorSuppliers ? "Suppliers unavailable (permission required)" : "No suppliers available", 
                value: null,
                isDisabled: true
              }
            ]}
            placeholder="Select supplier"
            borderIfPlaceholder={true}
            borderColor="orange"
            textSize={textSize}
          />
        );
      },
    },
    {
      key: "currency",
      header: "Currency",
      editable: true,
      formatter: (row) => {
        const stateValue = {
          label: row?.currency,
          value: row?.currency,
        };
        return (
          <GenericDropdownSelector
            state={stateValue?.value || null}
            setState={(value) => handleEditSave(row.id, { currency: value })}
            dropdownValues={currencyKeysOptions}
            placeholder="Select currency"
            borderIfPlaceholder={true}
            textSize={textSize}
          />
        );
      },
    },
    {
      key: "delete",
      header: "",
      formatter: (row) => (
        <DeletePrice row={row} setRefresh={setRefreshPrices} />
      ),
      maxWidth: "25px",
    },
  ];

  return (
    <DokulyCard>
      <CardTitle titleText={`Price per ${unit}`} optionalHelpText={"The per-unit BOM cost by production quantity.Minimum order quantities are used in calculation."} />
      <Row className="mb-2">
        <Col>
          <AddPrice
            app={app}
            id={itemId}
            textSize={textSize}
            setRefresh={setRefreshPrices}
            numberOfPrices={prices.length}
          />
        </Col>
        <Col className="text-right">
          <button
            type="button"
            className="btn dokuly-bg-transparent ml-4 mb-2"
            data-toggle="tooltip"
            data-placement="top"
            title="Bulk Upload prices"
            onClick={() => setShowBulkUploadModal(true)}
            //disabled={} // TODO Implement logic for disabling the button
          >
            <div className="row align-items-center">
              <img
                className="icon-dark mr-2"
                src="/static/icons/circle-plus.svg"
                alt="Add Icon"
                style={{ width: "24px", height: "24px" }}
              />
              <span style={{ fontSize: "12px" }}>Bulk Upload prices</span>
            </div>
          </button>
        </Col>
      </Row>

      <BulkUploadPricesModal
        show={showBulkUploadModal}
        onHide={() => setShowBulkUploadModal(false)}
        supplierOptions={supplierOptions}
        currencyOptions={currencyKeysOptions}
        app={app}
        itemId={itemId}
        onRefresh={() => setRefreshPrices(true)}
        textSize={textSize}
      />

      {prices.length > 0 && (
        <>
          <Row>
            <Col>
              <DokulyTable
                data={prices}
                columns={columns}
                itemsPerPage={10}
                showCsvDownload={false}
                showSearch={false}
                textSize={textSize}
              />
            </Col>
          </Row>
          {(app === "assemblies" || app === "pcbas") && (
            <Row>
              <Col className="m-3">
                <p className="text-muted">
                  <small>
                    Prices added here will take precedence over the calculated
                    BOM cost in upstream cost calculation.
                  </small>
                </p>
              </Col>
            </Row>
          )}
        </>
      )}

      {prices.length > 0 && (app === "pcbas" || app === "assemblies") && (
        <Row className="mb-3">
          <Col className="ml-3">
            <Form.Check
              className="dokuly-checkbox"
              type="checkbox"
              label="Show BOM Cost"
              checked={showBomCost}
              onChange={() => setShowBomCost(!showBomCost)}
              style={{ fontSize: textSize }}
            />
          </Col>
        </Row>
      )}

      {(showBomCost ||
        (prices.length === 0 && (app === "pcbas" || app === "assemblies"))) && (
        <Row>
          <Col>
            <BomCost app={app} id={itemId} refresh={refresh} />
          </Col>
        </Row>
      )}
    </DokulyCard>
  );
};

export default PriceCard;
