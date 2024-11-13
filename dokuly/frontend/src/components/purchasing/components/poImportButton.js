import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Modal, Form, Row, Col } from "react-bootstrap";
import Papa from "papaparse";

import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import SubmitButton from "../../dokuly_components/submitButton";
import FileUpload from "../../dokuly_components/fileUpload/fileUpload";
import {
  addPoItemWithContents,
  matchPoItemsWithParts,
} from "../functions/queries";

/**
 * PO importer component.
 *
 * ## Example
 * ```jsx
 * <PoImportButton
 *    po_id={database_po?.id}
 *    readOnly={readOnly}
 *    setRefreshPo={setRefreshPo}
 *    showDnmDropdown={true}
 *    showPoIgnoreDropdown={true}
 * />
 * ```
 */
const PoImportButton = ({
  po_id,
  readOnly,
  setRefreshPo,
  showPoIgnoreDropdown,
  btnClassName,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [headers, setHeaders] = useState([]);

  const [quantity, setQuantity] = useState("");
  const [unit_price, setUnitPrice] = useState("");
  const [mpn, setMpn] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [poIgnoreColumn, setPoIgnoreColumn] = useState("");
  const [designator, setDesignator] = useState("");

  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [filteredCsvData, setFilteredCsvData] = useState([]);

  useEffect(() => {
    if (file == null) {
      return;
    }
    if (
      file &&
      (file.type.toLowerCase() === "text/csv" ||
        file.name.toLowerCase().endsWith(".csv"))
    ) {
      Papa.parse(file, {
        complete: (result) => {
          processCSVData(result);
        },
        header: true,
      });
    } else {
      toast.error("Please upload a CSV file.");
    }
  }, [file]);

  const processCSVData = (result) => {
    if (result.data.length > 0) {
      const extractedHeaders = Object.keys(result.data[0]);

      setHeaders(extractedHeaders);
      const validDataRows = result.data.filter(
        (row) => !isIncorrectHeaderRow(row, extractedHeaders),
      );
      setCsvData(validDataRows);

      setQuantity(
        findFirstMatch(extractedHeaders, [
          "Quantity",
          "Qty",
          "Amount",
          "Antall",
        ]),
      );
      setUnitPrice(
        findFirstMatch(extractedHeaders, [
          "Price",
          "Unit Price",
          "Cost",
          "Enhetspris",
        ]),
      );
      setMpn(
        findFirstMatch(extractedHeaders, [
          "Produsentens Delenummer",
          "Part Number",
          "P/N",
          "Part No",
          "PN",
        ]),
      );
      setManufacturer(
        findFirstMatch(extractedHeaders, ["Manufacturer", "Mfg", "Supplier"]),
      );
      if (showPoIgnoreDropdown) {
        setPoIgnoreColumn(findFirstMatch(extractedHeaders, ["Ignore", "NOPO"]));
      }
      setDesignator(
        findFirstMatch(extractedHeaders, ["Designator", "Reference"]),
      );

      toast.info("CSV file processed successfully.");
    } else {
      toast.error("CSV file is empty or not formatted correctly.");
    }
  };

  const isIncorrectHeaderRow = (row, headers) => {
    // This checks if a significant number of header fields in a row are empty or undefined
    const threshold = headers.length * 0.75; // Set threshold, e.g., 75% of fields must be empty or match header names
    let emptyOrMatchCount = 0;

    headers.forEach((header) => {
      if (
        !row[header] ||
        row[header].trim() === "" ||
        row[header].trim().toLowerCase() === header.toLowerCase()
      ) {
        emptyOrMatchCount++;
      }
    });

    return emptyOrMatchCount >= threshold;
  };

  const findFirstMatch = (headers, typicalHeadings) => {
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase();
      if (
        typicalHeadings.some((typicalHeading) =>
          normalizedHeader.includes(typicalHeading.toLowerCase()),
        )
      ) {
        return header;
      }
    }
    return "";
  };

  const handleClose = () => {
    setShowModal(false);
    setHeaders([]);
    setQuantity("");
    setUnitPrice("");
    setMpn("");
    setManufacturer("");
    setDesignator("");
    setPoIgnoreColumn("");
  };

  const filter_ignored_rows = (data, poIgnoreColumn) => {
    if (poIgnoreColumn === undefined) {
      return data;
    }
    if (!showPoIgnoreDropdown) {
      return data;
    }

    return data.filter(
      (row) =>
        row[poIgnoreColumn] === undefined || row[poIgnoreColumn].trim() === "",
    );
  };

  useEffect(() => {
    setFilteredCsvData(filter_ignored_rows(csvData, poIgnoreColumn));
  }, [csvData, poIgnoreColumn]);

  const handleSubmit = () => {
    const toastId = toast.loading("Uploading Items...");
  
    const promises = filteredCsvData.map((item) => {
      const itemQuantity = item[quantity]
        ? Number.parseFloat(item[quantity].replace(",", "."))
        : 1;
      const itemPrice = item[unit_price]
        ? Number.parseFloat(
            item[unit_price].replace(/[^0-9,\.]/g, "").replace(",", ".")
          ).toFixed(4)
        : "0.0000";
      const itemMpn = item[mpn] || "N/A";
      const itemManufacturer = item[manufacturer] || "N/A";
      const itemDesignator = item[designator] || "";
  
      return addPoItemWithContents(
        po_id,
        itemQuantity,
        itemPrice,
        itemMpn,
        itemManufacturer,
        itemDesignator // Pass the designator here
      ).catch((error) => {
        toast.error("An error occurred while processing an item:", error);
      });
    });
  
    Promise.all(promises)
      .then(() => {
        return matchPoItemsWithParts(po_id);
      })
      .then(() => {
        toast.dismiss(toastId);
        toast.success("PO uploaded successfully!");
  
        setRefreshPo(true);
        handleClose();
      })
      .catch((error) => {
        toast.error("An error occurred during import:", error);
      });
  };

  const previewColumns = [
    { key: "mpn", header: "MPN" },
    { key: "quantity", header: "Quantity" },
    { key: "unit_price", header: "Price" },
    { key: "manufacturer", header: "Manufacturer" },
    { key: "designator", header: "Designator" },
  ];

  return (
    !readOnly && (
      <>
        <button
          type="button"
          className={`btn dokuly-bg-transparent ${btnClassName || ""}`}
          data-toggle="tooltip"
          data-placement="top"
          title="Add an item to the PO"
          onClick={() => setShowModal(true)}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../../static/icons/upload.svg"
              alt="icon"
            />
            <span className="btn-text">Import items from CSV</span>
          </div>
        </button>

        <Modal
          show={showModal}
          onHide={handleClose}
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header>
            <Modal.Header>
              <h5 className="modal-title" id="editPoInfoLabel">
                Import PO
              </h5>
              <small className="form-text text-muted pl-3">
                * Mandatory fields
              </small>
            </Modal.Header>
          </Modal.Header>
          <Modal.Body>
            {0 === headers.length && (
              <Row>
                <Col>
                  <FileUpload file={file} setFile={setFile} />
                </Col>
              </Row>
            )}

            <Row>
              <Col>
                {0 < headers.length && (
                  <React.Fragment>
                    <Form.Group controlId="quantitySelect">
                      <Form.Label>Quantity Column</Form.Label>
                      <Form.Control
                        as="select"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      >
                        <option value="">None</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="priceSelect">
                      <Form.Label>Price Column</Form.Label>
                      <Form.Control
                        as="select"
                        value={unit_price}
                        onChange={(e) => setUnitPrice(e.target.value)}
                      >
                        <option value="">None</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="mpnSelect">
                      <Form.Label>Part Number Column</Form.Label>
                      <Form.Control
                        as="select"
                        value={mpn}
                        onChange={(e) => setMpn(e.target.value)}
                      >
                        <option value="">None</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="manufacturerSelect">
                      <Form.Label>Manufacturer Column</Form.Label>
                      <Form.Control
                        as="select"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                      >
                        <option value="">None</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>

                    <Form.Group controlId="manufacturerSelect">
                      <Form.Label>Designator Column</Form.Label>
                      <Form.Control
                        as="select"
                        value={designator}
                        onChange={(e) => setDesignator(e.target.value)}
                      >
                        <option value="">None</option>
                        {headers.map((header, index) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>

                    {showPoIgnoreDropdown && (
                      <Form.Group controlId="poIgnoreSelect">
                        <Form.Label>PO Ignore Column</Form.Label>
                        <Form.Control
                          as="select"
                          value={poIgnoreColumn}
                          onChange={(e) => setPoIgnoreColumn(e.target.value)}
                        >
                          <option value="">None</option>
                          {headers.map((header, index) => (
                            <option key={index} value={header}>
                              {header}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    )}
                  </React.Fragment>
                )}
              </Col>
              <Col>
                {0 < headers.length && (
                  <DokulyTable
                    data={filteredCsvData.map((row) => ({
                      mpn: row[mpn] || "N/A",
                      quantity: row[quantity] || "N/A",
                      unit_price: row[unit_price] || "N/A",
                      manufacturer: row[manufacturer] || "N/A",
                      designator: row[designator] || "N/A",
                    }))}
                    columns={previewColumns}
                    showCsvDownload={false}
                    itemsPerPage={10}
                    showPagination={true}
                  />
                )}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <SubmitButton
              onClick={handleSubmit}
              className="btn dokuly-bg-primary"
              disabled={csvData.length === 0}
              disabledTooltip="Please upload a CSV file"
            >
              Submit
            </SubmitButton>
          </Modal.Footer>
        </Modal>
      </>
    )
  );
};

export default PoImportButton;
