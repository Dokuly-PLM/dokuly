import React, { useState } from "react";
import { toast } from "react-toastify";
import DokulyModal from "../../dokuly_components/dokulyModal";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import CancelButton from "../../dokuly_components/cancelButton";
import SubmitButton from "../../dokuly_components/submitButton";
import { addNewPrice } from "./queries";

const BulkUploadPricesModal = ({
  show,
  onHide,
  supplierOptions,
  currencyOptions,
  app,
  itemId,
  onRefresh,
  textSize = "16px",
}) => {
  const [clipboardData, setClipboardData] = useState("");
  const [bulkUploadSupplier, setBulkUploadSupplier] = useState(null);
  const [bulkUploadCurrency, setBulkUploadCurrency] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [tableColumns] = useState([
    { key: "minimum_order_quantity", header: "Quantity", type: "numeric" },
    { key: "price", header: "Unit Price", type: "numeric" },
  ]);

  const parseClipboardData = () => {
    try {
      if (!bulkUploadSupplier) {
        throw new Error("Please select a supplier before uploading.");
      }

      if (!bulkUploadCurrency) {
        throw new Error("Please select a currency before uploading.");
      }

      // Split clipboard data into lines and filter out empty lines
      const lines = clipboardData
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

      // Find the index where actual data starts
      let dataStartIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^\d/.test(lines[i])) {
          dataStartIndex = i;
          break;
        }
      }

      const parsed = [];
      // Each dataset entry is spread across two lines:
      // 1. Quantity line (e.g., "400")
      // 2. Price line (e.g., "kr 20,13403   kr 8 053,61")
      for (let i = dataStartIndex; i < lines.length; i += 2) {
        const quantityLine = lines[i];
        const priceLine = lines[i + 1];

        if (!quantityLine || !priceLine) break;

        // Process and parse quantity
        const quantityStr = quantityLine.replace(/\s+/g, "");
        const quantity = parseInt(quantityStr, 10);

        // Example priceLine: "kr 20,13403    kr 8 053,61"
        // Split by "kr" to separate unit price and extended price
        const parts = priceLine
          .split("kr")
          .map((p) => p.trim())
          .filter((p) => p !== "");
        if (parts.length < 1) continue;

        // The first part is the unit price
        const rawUnitPrice = parts[0]
          .replace(/\./g, "")
          .replace(",", ".")
          .replace(/\s+/g, "");
        const unitPrice = parseFloat(rawUnitPrice);

        if (isNaN(quantity) || isNaN(unitPrice)) continue;

        parsed.push({
          minimum_order_quantity: quantity,
          price: unitPrice,
          supplier_id: bulkUploadSupplier,
          currency: bulkUploadCurrency, // Use the selected currency
        });
      }

      if (!parsed.length) {
        throw new Error("No valid data found or format is incorrect.");
      }

      setParsedData(parsed);
      toast.success("Data parsed successfully! Preview below.");
    } catch (error) {
      toast.error(error.message || "Error parsing data.");
    }
  };

  const uploadParsedData = async () => {
    try {
      for (const row of parsedData) {
        const res = await addNewPrice(
          app,
          itemId,
          row.price,
          row.minimum_order_quantity,
          row.currency,
          row.supplier_id
        );
        if (res.status === 201) {
          toast.success("Price info added successfully!");
          onRefresh();
        } else {
          toast.error("Error adding price info.");
        }
      }
      onHide();
      setClipboardData("");
      setBulkUploadSupplier(null);
      setBulkUploadCurrency(null);
      setParsedData([]);
    } catch (error) {
      toast.error(error.message || "Error uploading data.");
    }
  };

  return (
    <DokulyModal
      show={show}
      onHide={onHide}
      title="Bulk Upload Prices"
      size="lg"
    >
      <div>
        <div className="d-flex flex-wrap mb-3">
          <div style={{ marginRight: "20px" }}>
            <GenericDropdownSelector
              state={bulkUploadSupplier}
              setState={setBulkUploadSupplier}
              dropdownValues={supplierOptions}
              placeholder="Select supplier"
              borderIfPlaceholder={true}
              borderColor="orange"
              textSize={textSize}
            />
          </div>
          <div>
            <GenericDropdownSelector
              state={bulkUploadCurrency}
              setState={setBulkUploadCurrency}
              dropdownValues={currencyOptions}
              placeholder="Select currency"
              borderIfPlaceholder={true}
              borderColor="orange"
              textSize={textSize}
            />
          </div>
        </div>
        <textarea
          rows={10}
          value={clipboardData}
          onChange={(e) => setClipboardData(e.target.value)}
          placeholder={`Example:\nQuantity\tUnit Price\tExt Price\n400\tkr 20,13403\tkr 8 053,61`}
          style={{ width: "100%", margin: "20px 0", fontSize: textSize }}
        />
        <div>
          <CancelButton onClick={onHide} disabled={false} className="mr-2">
            Cancel
          </CancelButton>
          <SubmitButton
            className="mr-2"
            onClick={parseClipboardData}
            disabled={!clipboardData.trim() || !bulkUploadCurrency}
            disabledTooltip={"Paste data and select supplier and currency before parsing."}
          >
            Preview
          </SubmitButton>
          <SubmitButton
            onClick={uploadParsedData}
            disabled={parsedData.length === 0}
            disabledTooltip={"Parse and preview the data before uploading."}
          >
            Upload
          </SubmitButton>
        </div>
      </div>

      {parsedData.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <DokulyTable
            data={parsedData}
            tableName="Preview Data"
            columns={tableColumns}
            showSearch={false}
            showPagination={true}
            showCsvDownload={true}
            itemsPerPage={10}
          />
        </div>
      )}
    </DokulyModal>
  );
};

export default BulkUploadPricesModal;
