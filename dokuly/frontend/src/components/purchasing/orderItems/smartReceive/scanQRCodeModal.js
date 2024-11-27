// components/ScanQRCodeModal.js

import React, { useState, useEffect, useContext, useRef } from "react";
import DokulyModal from "../../../dokuly_components/dokulyModal";
import { Form, Button } from "react-bootstrap";
import { parseQRCodeData } from "./functions/parseQRCodeData";
import { markItemAsReceived } from "../../functions/queries";
import { adjustStock } from "../../../dokuly_components/dokulyInventory/functions/queries";
import { toast } from "react-toastify";
import GenericDropdownSelector from "../../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import useLocations from "../../../common/hooks/useLocations";
import { AuthContext } from "../../../App";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import NumericFieldEditor from "../../../dokuly_components/dokulyTable/components/numericFieldEditor";
import DeleteButton from "../../../dokuly_components/deleteButton";
import { addInventoryEntry } from "../../../dokuly_components/dokulyInventory/functions/queries";
import SubmitButton from "../../../dokuly_components/submitButton";

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
  const [locations, refreshLocations, loadingLocations] = useLocations({
    setIsAuthenticated: setIsAuthenticated,
  });
  const [locationOptions, setLocationOptions] = useState([]);
  const [stagedItems, setStagedItems] = useState([]);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const isMountedRef = useRef(false);
  const isProcessingRef = useRef(false); // Flag to control processing
  const [scannerStarted, setScannerStarted] = useState(false);
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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (show && !scannerStarted && locationId) {
      startScanner();
    } else if (!show && scannerStarted) {
      stopScanner();
    }
  }, [show, scannerStarted, locationId]);

  const startScanner = () => {
    if (!locationId) {
      toast.error("Please select a location before starting the scanner.");
      return;
    }

    setScannerStarted(true);

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    codeReader
      .decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (!isMountedRef.current) return;

        if (result) {
          if (isProcessingRef.current) {
            // Ignore scans during processing cooldown
            return;
          }

          isProcessingRef.current = true; // Set processing flag
          const data = result.getText();
          console.log("Scanned data:", data);

          handleScanResult(data);

          // Reset processing flag after 1 second
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 1000);
        }

        if (err && !(err instanceof NotFoundException)) {
          console.error(err);
          toast.error("Error scanning QR code.");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error initializing QR scanner.");
      });
  };

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setScannerStarted(false);
  };

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

    // Find matching order item
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

    // Check if item is already in stagedItems
    const existingItemIndex = stagedItems.findIndex(
      (item) => item.matchingItem.id === matchingItem.id
    );

    if (existingItemIndex !== -1) {
      // Update existing item's quantity
      const updatedStagedItems = [...stagedItems];
      updatedStagedItems[existingItemIndex].quantity += parsed.quantity;
      setStagedItems(updatedStagedItems);
    } else {
      // Add new item to stagedItems
      const stagedItem = {
        id: nextIdRef.current++, // Assign a unique ID
        matchingItem,
        quantity: parsed.quantity,
        locationId,
      };
      setStagedItems((prevItems) => [...prevItems, stagedItem]);
    }
  };

  const handleDeleteStagedItem = (row) => {
    console.log("Deleting row:", row);
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
        // Mark the item as received
        await markItemAsReceived(matchingItem.id);

        // Prepare data for the new API call
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

        // Call the new API endpoint
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
    stagedItems.length = 0; // Clear staged items
    onHide();
  };

  // Define columns for DokulyTable
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
    <>
      <DokulyModal show={show} onHide={onHide} title="Bulk receive" size="lg">
        <Form>
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

          {/* Embed the QR Scanner here */}
          {locationId && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <video ref={videoRef} style={{ width: "100%" }} />
            </div>
          )}

          <h5 className="mt-4">Staged Items</h5>
          {stagedItems.length > 0 ? (
            <DokulyTable
              data={stagedItems}
              columns={columns}
              tableName="StagedItemsTable"
              showColumnSelector={false}
              itemsPerPage={100000} // No pagination
              showPagination={false}
              showSearch={false}
              showCsvDownload={false}
              navigateColumn={false}
            />
          ) : (
            <p>No items staged yet.</p>
          )}

          <SubmitButton
            onClick={handleSubmitAll}
            disabled={stagedItems.length === 0}
          >
            Submit All
          </SubmitButton>
        </Form>
      </DokulyModal>
    </>
  );
};

export default ScanQRCodeModal;
