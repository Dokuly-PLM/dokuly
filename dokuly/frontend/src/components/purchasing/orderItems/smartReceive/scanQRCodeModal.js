// components/ScanQRCodeModal.js

import React, { useState, useEffect, useContext, useRef } from "react";
import { toast } from "react-toastify";
import { Form } from "react-bootstrap";

import DokulyModal from "../../../dokuly_components/dokulyModal";
import { parseQRCodeData } from "./functions/parseQRCodeData";
import { markItemAsReceived } from "../../functions/queries";
import GenericDropdownSelector from "../../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import useLocations from "../../../common/hooks/useLocations";
import { AuthContext } from "../../../App";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import NumericFieldEditor from "../../../dokuly_components/dokulyTable/components/numericFieldEditor";
import DeleteButton from "../../../dokuly_components/deleteButton";
import { addInventoryEntry } from "../../../dokuly_components/dokulyInventory/functions/queries";
import SubmitButton from "../../../dokuly_components/submitButton";

import { Html5QrcodeScanner } from "html5-qrcode";

const ScanQRCodeModal = ({
  show,
  onHide,
  poItems,
  setRefreshPo,
  po_id,
  organization,
}) => {
  const { setIsAuthenticated } = useContext(AuthContext);
  const [qrCodeData, setQrCodeData] = useState("");
  const [locationId, setLocationId] = useState(null);
  const [locations] = useLocations({ setIsAuthenticated: setIsAuthenticated });
  const [locationOptions, setLocationOptions] = useState([]);
  const [stagedItems, setStagedItems] = useState([]);

  const scanningCooldownRef = useRef(false);

  const nextIdRef = useRef(1); // For unique IDs

  const defaultParsingConfig = {
    mpnPatterns: [{ prefix: "1P" }],
    quantityPatterns: [{ prefix: "Q" }],
  };
  const [parsingConfigInput, setParsingConfigInput] = useState(
    JSON.stringify(defaultParsingConfig, null, 2)
  );

  useEffect(() => {
    if (locations) {
      const formattedLocations = locations.map((location) => ({
        value: location.id,
        label: location.name,
      }));
      setLocationOptions(formattedLocations);
    }
  }, [locations]);

  useEffect(() => {
    let scanner = null;
    if (show && locationId) {
      // Attempt to override the stored permission flag
      const storedData = localStorage.getItem("HTML5_QRCODE_DATA");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData && typeof parsedData === "object") {
            parsedData.hasPermission = true;
            localStorage.setItem(
              "HTML5_QRCODE_DATA",
              JSON.stringify(parsedData)
            );
          }
        } catch (err) {
          console.warn("Failed to parse HTML5_QRCODE_DATA:", err);
        }
      }

      const onScanSuccess = (decodedText) => {
        if (scanningCooldownRef.current) return;

        // Activate cooldown
        scanningCooldownRef.current = true;

        handleScanResult(decodedText);

        // Deactivate cooldown after 1 second
        setTimeout(() => {
          scanningCooldownRef.current = false;
        }, 1000);
      };

      const onScanError = (errorMessage) => {
        console.warn("QR Scan error:", errorMessage);
      };

      scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 30,
          qrbox: { width: 350, height: 350 },
          rememberLastUsedCamera: true,
        },
        false
      );

      scanner.render(onScanSuccess, onScanError);
    }

    return () => {
      if (scanner) {
        scanner
          .clear()
          .catch((err) => console.warn("Failed to clear scanner", err));
      }
    };
  }, [show, locationId]);

  const handleScanResult = (data) => {
    setQrCodeData(data);
    processScannedData(data);
  };

  const processScannedData = (data) => {
    let parsingConfig;
    try {
      parsingConfig = JSON.parse(parsingConfigInput);
    } catch (error) {
      toast.error("Invalid parsing configuration JSON");
      return;
    }

    const parsed = parseQRCodeData(data, parsingConfig);
    if (!parsed.mpn || !parsed.quantity) {
      toast.error("Failed to parse QR code data");
      return;
    }

    const parsedMPN = parsed.mpn.trim().toUpperCase();

    const matchingItem = poItems.find((item) => {
      const itemMPNs = [
        item.mpn,
        item.temporary_mpn,
        item?.part_information?.["MPN"],
        item?.part_information?.["mpn"],
        item?.manufacturer_part_number,
      ]
        .filter(Boolean)
        .map((mpn) => mpn.trim().toUpperCase());

      return itemMPNs.includes(parsedMPN);
    });

    if (!matchingItem) {
      toast.error(`No matching order item found for MPN: ${parsed.mpn}`);
      return;
    }

    if (matchingItem.item_received) {
      toast.info(`Item ${parsedMPN} is already marked as received. Skipping.`);
      return;
    }

    setStagedItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.mpn === parsedMPN && item.quantity === parsed.quantity
      );

      if (existingItemIndex !== -1) {
        const confirmed = window.confirm(
          `Double scan detected. Add another ${parsedMPN} with Quantity: ${parsed.quantity}?`
        );
        if (!confirmed) {
          return prevItems;
        }

        const updatedStagedItems = [...prevItems];
        updatedStagedItems[existingItemIndex].quantity += parsed.quantity;
        toast.success(`Scanned ${parsedMPN}!`);
        return updatedStagedItems;
      } else {
        const stagedItem = {
          id: nextIdRef.current++,
          matchingItem,
          quantity: parsed.quantity,
          locationId,
          mpn: parsedMPN,
        };
        toast.success(`Scanned ${parsedMPN}!`);
        return [...prevItems, stagedItem];
      }
    });
  };

  const handleDeleteStagedItem = (row) => {
    setStagedItems((prevItems) =>
      prevItems.filter((item) => item.id !== row.id)
    );
  };

  const handleQuantityChange = (rowId, newQuantity) => {
    setStagedItems((prevItems) =>
      prevItems.map((item) =>
        item.id === rowId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleSubmitAll = async () => {
    for (const stagedItem of stagedItems) {
      const { matchingItem, quantity, locationId } = stagedItem;

      try {
        const markItemData = {
          po_id,
          item_id: matchingItem.id,
          quantity,
        };
        await markItemAsReceived(matchingItem.id, markItemData);

        const adjustData = {
          object_id:
            matchingItem.part || matchingItem.assembly || matchingItem.pcba,
          app:
            (matchingItem.part && "parts") ||
            (matchingItem.assembly && "assemblies") ||
            (matchingItem.pcba && "pcbas"),
          quantity: quantity,
          location_id: locationId,
        };

        await addInventoryEntry(adjustData);
      } catch (error) {
        toast.error(
          `Error processing item ${
            matchingItem.mpn || matchingItem.temporary_mpn
          }: ${error.message}`
        );
        continue;
      }
    }

    toast.success("All staged items have been processed successfully");
    setRefreshPo(true);
    setStagedItems([]);
    onHide();
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part Number",
      formatter: (row) => row.matchingItem.full_part_number || "",
    },
    {
      key: "display_name",
      header: "Display Name",
      formatter: (row) => row.matchingItem.display_name || "Unnamed Item",
    },
    {
      key: "mpn",
      header: "MPN",
      formatter: (row) =>
        row.matchingItem.mpn ||
        row.matchingItem.temporary_mpn ||
        row.matchingItem?.part_information?.["MPN"] ||
        "",
    },
    {
      key: "quantity",
      header: "Quantity",
      formatter: (row) => (
        <NumericFieldEditor
          number={row.quantity}
          setNumber={(newQuantity) => handleQuantityChange(row.id, newQuantity)}
        />
      ),
    },
    {
      key: "delete",
      header: "Action",
      formatter: (row) => (
        <DeleteButton
          onDelete={() => handleDeleteStagedItem(row)}
          imgStyle={{ width: "20px" }}
        />
      ),
    },
  ];

  return (
    <DokulyModal
      show={show}
      onHide={onHide}
      title="Bulk receive"
      size="fullscreen"
    >
      <Form.Group controlId="parsingConfig">
        <Form.Label>Parsing Configuration (JSON)</Form.Label>
        <Form.Control
          as="textarea"
          rows={5}
          value={parsingConfigInput}
          onChange={(e) => setParsingConfigInput(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId="location">
        <Form.Label>Select Location</Form.Label>
        <GenericDropdownSelector
          state={locationId}
          setState={setLocationId}
          dropdownValues={locationOptions}
          placeholder={"Select location"}
          borderIfPlaceholder={false}
          textSize={"16px"}
          readOnly={false}
        />
      </Form.Group>

      {locationId && (
        <div className="d-flex mt-4">
          <div style={{ flex: "1", paddingRight: "10px", textAlign: "center" }}>
            <div id="qr-scanner-container" style={{ width: "100%" }} />
          </div>

          <div style={{ flex: "1", maxWidth: "50%" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Staged Items</h5>
              <span className="badge bg-warning">
                Entries Scanned: {stagedItems.length}
              </span>
            </div>
            {stagedItems.length > 0 ? (
              <DokulyTable
                data={stagedItems}
                columns={columns}
                tableName="StagedItemsTable"
                showColumnSelector={false}
                itemsPerPage={100000}
                showPagination={false}
                showSearch={false}
                showCsvDownload={false}
                navigateColumn={false}
              />
            ) : (
              <p>No items staged yet.</p>
            )}
          </div>
        </div>
      )}

      <SubmitButton
        onClick={handleSubmitAll}
        disabled={stagedItems.length === 0}
        className="mt-4"
      >
        Submit All
      </SubmitButton>
    </DokulyModal>
  );
};

export default ScanQRCodeModal;
