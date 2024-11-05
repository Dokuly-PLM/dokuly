import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Card, Col, Row, Form } from "react-bootstrap";
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

const PriceCard = ({ app, itemId, unit = "", setRefresh, refresh }) => {
  const [refreshPrices, setRefreshPrices] = useState(false);
  const [prices, setPrices] = useState([]);
  const [organizationCurrency, setOrganizationCurrency] = useState("");
  const {
    currencyPairs,
    currencyKeys,
    conversionRate,
    fetchCurrencyConversions,
    loading: loadingCurrency,
    error: errorCurrency,
  } = useCurrencyConversions(organizationCurrency);
  const [currencyKeysOptions, setCurrencyKeysOptions] = useState([]);
  const [suppliers, refreshSuppliers, loadingSuppliers, errorSuppliers] =
    useSuppliers();
  const [supplierOptions, setSuppliers] = useState([]);
  const [showBomCost, setShowBomCost] = useState(false);
  const [updatingSupplierState, setUpdatingSupplierState] = useState(true);
  const [updatingCurrencyState, setUpdatingCurrencyState] = useState(true);
  const [doneFormatting, setDoneFormatting] = useState(false);

  const textSize = "12px";

  useEffect(() => {
    if (refreshPrices) {
      setRefreshPrices(false);
    }

    getOrganizationCurrency().then((res) => {
      setOrganizationCurrency(res.data);
    });
    getLatestPrices(app, itemId).then((res) => {
      if (res.status === 200) {
        setPrices(res.data);
      }
    });
  }, [app, itemId, refresh, refreshPrices]);

  const handleEditSave = async (id, payload) => {
    const data = { ...payload };
    if (payload?.supplier_id) {
      const selectedSupplier = suppliers.find(
        (s) => s.id === payload?.supplier_id
      );
      data.currency = selectedSupplier.default_currency || payload.currency;
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

  useEffect(() => {
    // Dropdown values for suppliers need to be adjusted to use the formattedName
    const formattedSupplierOptions = suppliers.map((supplier) => ({
      label: supplier.name,
      value: supplier.id,
    }));
    setSuppliers(formattedSupplierOptions);
    setUpdatingSupplierState(false);
  }, [suppliers]);

  useEffect(() => {
    const formattedCurrencyKeysOptions = currencyKeys.map((currency) => ({
      label: currency,
      value: currency,
    }));
    setCurrencyKeysOptions(formattedCurrencyKeysOptions);
    setUpdatingCurrencyState(false);
  }, [currencyKeys]);

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
            dropdownValues={supplierOptions}
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
      maxWidth: "25",
    },
  ];

  useEffect(() => {
    if (
      !doneFormatting &&
      !loadingCurrency &&
      !loadingSuppliers &&
      !updatingCurrencyState &&
      !updatingSupplierState
    ) {
      setDoneFormatting(true);
    }
  }, [
    loadingCurrency,
    loadingSuppliers,
    updatingCurrencyState,
    updatingSupplierState,
  ]);

  if (
    loadingSuppliers ||
    loadingCurrency ||
    updatingCurrencyState ||
    updatingSupplierState ||
    !doneFormatting
  ) {
    return loadingSpinner();
  }

  return (
    <DokulyCard>
      <CardTitle titleText={`Price per ${unit}`} />
      <Row>
        <Col className="">
          <AddPrice
            app={app}
            id={itemId}
            textSize={textSize}
            setRefresh={setRefreshPrices}
            numberOfPrices={prices.length}
          />
        </Col>
      </Row>

      {prices.length > 0 && (
        <Row>
          <Col>
            <DokulyTable
              data={prices}
              columns={columns}
              itemsPerPage={6}
              showCsvDownload={false}
              showSearch={false}
              textSize={textSize}
            />
            {(app === "assemblies" || app === "pcbas") && (
              <Row>
                <Col className="m-3">
                  <p className="text-muted">
                    <small>
                      Prices added here will take precedence over the calculated
                      bom cost, in upstream cost calculation.
                    </small>
                  </p>
                </Col>
              </Row>
            )}
          </Col>
        </Row>
      )}
      {prices.length > 0 && (app === "pcbas" || app === "assemblies") && (
        <Row className="mb-3">
          <Col className="ml-3">
            <Form.Check
              className="dokuly-checkbox"
              type="checkbox"
              label="Show BOM Cost"
              checked={showBomCost}
              onChange={(e) => setShowBomCost(!showBomCost)}
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
