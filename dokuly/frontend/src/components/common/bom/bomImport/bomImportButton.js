import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Modal, Form, Row, Col } from "react-bootstrap";
import Papa from "papaparse";

import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import SubmitButton from "../../../dokuly_components/submitButton";
import FileUpload from "../../../dokuly_components/fileUpload/fileUpload";
import {
  addBomItemWithValues,
  matchBomItemsWithParts,
} from "../functions/queries";

/**
 * BOM importer component.
 *
 * ## Example
 * ```jsx
 * <BomImportButton
 *    bom_id={database_bom?.id}
 *    is_locked_bom={is_locked_bom}
 *    setRefreshBom={setRefreshBom}
 *    showDnmDropdown={true}
 *    showBomIgnoreDropdown={true}
 * />
 * ```
 */
const BomImportButton = ({
  app = "",
  bom_id,
  is_locked_bom,
  setRefreshBom,
  showDnmDropdown,
  showBomIgnoreDropdown,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [headers, setHeaders] = useState([]);

  const [designator, setDesignator] = useState("");
  const [mpn, setMpn] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dnmColumn, setDnmColumn] = useState("");
  const [bomIgnoreColumn, setBomIgnoreColumn] = useState("");
  const [delimiter, setDelimiter] = useState("auto");

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
      // Determine the delimiter to use
      let delimiterConfig = "";
      if (delimiter === "comma") {
        delimiterConfig = ",";
      } else if (delimiter === "semicolon") {
        delimiterConfig = ";";
      } else if (delimiter === "tab") {
        delimiterConfig = "\t";
      } else if (delimiter === "pipe") {
        delimiterConfig = "|";
      }
      // If delimiter is "auto" or any other value, delimiterConfig remains ""

      Papa.parse(file, {
        complete: (result) => {
          processCSVData(result);
        },
        header: true,
        delimiter: delimiterConfig, // Auto-detect delimiter (comma, semicolon, tab, etc.)
        skipEmptyLines: true,
      });
    } else {
      toast.error("Please upload a CSV file.");
    }
  }, [file, delimiter]);

  const processCSVData = (result) => {
    if (result.data.length > 0) {
      const extractedHeaders = Object.keys(result.data[0]);
      setHeaders(extractedHeaders);
      setCsvData(result.data);

      setDesignator(
        findFirstMatch(extractedHeaders, [
          "Designator",
          "Find",
          "F/N",
          "Find No",
          "Ref",
          "Parts",
        ])
      );
      setMpn(
        findFirstMatch(extractedHeaders, [
          "Part Number",
          "P/N",
          "Part No",
          "PN",
        ])
      );
      setQuantity(
        findFirstMatch(extractedHeaders, ["Quantity", "Qty", "Amount"])
      );
      if (showDnmDropdown) {
        setDnmColumn(
          findFirstMatch(extractedHeaders, ["DN", "Do Not Mount", "DNM"])
        );
      }
      if (showBomIgnoreDropdown) {
        setBomIgnoreColumn(
          findFirstMatch(extractedHeaders, ["Ignore", "NOBOM"])
        );
      }

      toast.info("CSV file processed successfully.");
    } else {
      toast.error("CSV file is empty or not formatted correctly.");
    }
  };

  const findFirstMatch = (headers, typicalHeadings) => {
    // Loop through each header
    for (const header of headers) {
      // Normalize header for case-insensitive comparison
      const normalizedHeader = header.toLowerCase();
      // Check if this header includes any of the typical headings
      if (
        typicalHeadings.some((typicalHeading) =>
          normalizedHeader.includes(typicalHeading.toLowerCase())
        )
      ) {
        return header; // Return the original header if a match is found
      }
    }
    return ""; // Return an empty string if no match is found
  };

  const handleClose = () => {
    setShowModal(false);
    // Reset states when modal is closed
    setHeaders([]);
    setDesignator("");
    setMpn("");
    setQuantity("");
    setDnmColumn("");
    setBomIgnoreColumn("");
    setDelimiter("auto");
  };

  const filter_ignored_rows = (data, bomIgnoreColumn) => {
    if (bomIgnoreColumn === undefined) {
      return data;
    }
    if (!showBomIgnoreDropdown) {
      return data;
    }

    return data.filter(
      (row) =>
        row[bomIgnoreColumn] === undefined || row[bomIgnoreColumn].trim() === ""
    );
  };

  useEffect(() => {
    setFilteredCsvData(filter_ignored_rows(csvData, bomIgnoreColumn));
  }, [csvData, bomIgnoreColumn]);

  const handleSubmit = () => {
    const toastId = toast.loading("Uploading BOM...");

    // Map each item in csvData to a Promise
    const promises = filteredCsvData.map((item) => {
      // Use the selected headers to index into the item
      const itemDesignator = item[designator] || "N/A";
      const itemMpn = item[mpn] || "N/A";
      const itemQuantity = item[quantity] ? item[quantity] : 1;
      const is_mounted = !item[dnmColumn] || item[dnmColumn].trim() === "";

      // Correctly scope data variable inside the promise chain
      return addBomItemWithValues(
        bom_id,
        itemMpn,
        itemDesignator,
        itemQuantity,
        is_mounted
      ).catch((error) => {
        toast.error("An error occurred while processing an item:", error);
      });
    });

    // Wait for all Promises to complete
    Promise.all(promises)
      .then(() => {
        // After all items have been processed, call the matching function
        return matchBomItemsWithParts(bom_id);
      })
      .then(() => {
        // This code will run after all items have been processed
        toast.dismiss(toastId);
        toast.success("BOM uploaded successfully!");

        setRefreshBom(true); // Refresh the BOM
        handleClose(); // Close the modal
      })
      .catch((error) => {
        toast.error("An error occurred during import:", error);
      });
  };

  const previwColumns = [
    { key: "mpn", header: "MPN" },
    {
      key: "designator",
      header: "Designator",
    },
    {
      key: "quantity",
      header: "Quantity",
    },
  ];

  if (showDnmDropdown) {
    previwColumns.push({
      key: "dnm",
      header: "DNM",
      formatter: (row, col) => {
        // Determine if the item should be mounted based on the DNM column
        const is_mounted = !row.dnm || row.dnm.trim() === "";
        return is_mounted ? "" : "DNM";
      },
    });
  }

  return (
    !is_locked_bom && (
      <>
        <button
          type="button"
          className="btn dokuly-bg-transparent ml-4 mb-2"
          data-toggle="tooltip"
          data-placement="top"
          title="Add an item to the BOM"
          onClick={() => setShowModal(true)}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../../static/icons/upload.svg"
              alt="icon"
            />
            <span className="btn-text">Import BOM</span>
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
              <h5 className="modal-title" id="editAsmInfoLabel">
                Import BOM
              </h5>
              <small className="form-text text-muted pl-3">
                * Mandatory fields
              </small>
            </Modal.Header>
          </Modal.Header>
          <Modal.Body>
            {0 === headers.length && (
              <>
                <Row>
                  <Col>
                    <Form.Group controlId="delimiterSelect">
                      <Form.Label>CSV Delimiter</Form.Label>
                      <Form.Control
                        as="select"
                        value={delimiter}
                        onChange={(e) => setDelimiter(e.target.value)}
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="comma">Comma (,)</option>
                        <option value="semicolon">Semicolon (;)</option>
                        <option value="tab">Tab</option>
                        <option value="pipe">Pipe (|)</option>
                      </Form.Control>
                      <small className="form-text text-muted">
                        If auto-detection fails, manually select the delimiter used in your CSV file.
                      </small>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FileUpload file={file} setFile={setFile} />
                  </Col>
                </Row>
              </>
            )}

            <Row>
              <Col>
                {0 < headers.length && (
                  <React.Fragment>
                    <Form.Group controlId="designatorSelect">
                      <Form.Label>
                        {app === "pcbas"
                          ? "Reference Designator Column"
                          : "Find Number Column"}{" "}
                        *
                      </Form.Label>
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

                    {showDnmDropdown && (
                      <Form.Group controlId="dnmSelect">
                        <Form.Label>Do Not Mount Column</Form.Label>
                        <Form.Control
                          as="select"
                          value={dnmColumn}
                          onChange={(e) => setDnmColumn(e.target.value)}
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

                    {showBomIgnoreDropdown && (
                      <Form.Group controlId="bomIgnoreSelect">
                        <Form.Label>BOM Ignore Column</Form.Label>
                        <Form.Control
                          as="select"
                          value={bomIgnoreColumn}
                          onChange={(e) => setBomIgnoreColumn(e.target.value)}
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
                      designator: row[designator] || "N/A",
                      mpn: row[mpn] || "N/A",
                      quantity: row[quantity] || "N/A",
                      dnm: row[dnmColumn] || "",
                    }))}
                    columns={previwColumns}
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

export default BomImportButton;
