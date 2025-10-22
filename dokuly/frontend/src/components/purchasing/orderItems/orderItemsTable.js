import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import {
  getPoItemsByPoId,
  addPoItemWithContents,
  matchPoItemsWithParts,
  editPoItem,
  removePoItem,
  markItemAsReceived,
} from "../functions/queries"; // Import the editPoItem function
import { thumbnailFormatter } from "../../dokuly_components/formatters/thumbnailFormatter";
import PoImportButton from "../components/poImportButton";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import useCurrencyConversions from "../../common/hooks/useCurrencyConversions";
import InlineItemSelector from "../../dokuly_components/dokulyTable/components/inlineItemSelector";
import NumericFieldEditor from "../../dokuly_components/dokulyTable/components/numericFieldEditor";
import DeleteButton from "../../dokuly_components/deleteButton";
import AddButton from "../../dokuly_components/AddButton";
import { separateBomItemIDs } from "../../common/bom/functions/separateBomItemIDs";
import { usePartTypes } from "../../parts/partTypes/usePartTypes";
import { buildBomObject } from "../../common/bom/functions/buildBomObject";
import { getLinkedParts } from "../../common/bom/functions/queries";
import { totalPriceFormatter } from "../../dokuly_components/formatters/totalPriceFormatter";
import TextFieldEditor from "../../dokuly_components/dokulyTable/components/textFieldEditor";
import ItemReceivedForm from "../forms/itemReceivedForm";
import DokulyPriceFormatter from "../../dokuly_components/formatters/priceFormatter";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import { ClearOrderItemsButton } from "./clearOrderItemsButton";
import ScanQRCodeModal from "./smartReceive/scanQRCodeModal";
import TransparentButton from "../../dokuly_components/transparentButton";
import NoDataFound from "../../dokuly_components/dokulyTable/components/noDataFound";

const OrderItemsTable = ({
  po_id,
  poState = null,
  purchaseOrder = {},
  readOnly = false,
  isPrintable = false, // this prop indicates if the component is used in a printable view
  showTable = true,
  organizationCurrency = "USD",
  loadingPurchaseOrder = false,
  organization = {},
  supplier = {},
  setRefresh = () => {},
}) => {
  const navigate = useNavigate();
  const partTypes = usePartTypes();
  const {
    currencyPairs,
    conversionRate,
    fetchCurrencyConversions,
    loadingCurrency,
    errorCurrency,
  } = useCurrencyConversions("USD");

  const [tableTextSize, setTableTextSize] = useState("16px");

  const [refreshPo, setRefreshPo] = useState(false);
  const [poItems, setPoItems] = useState([]);
  const [matchedPoItems, setMatchedPoItems] = useState([]);
  const [parts, setParts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [pcbas, setPcbas] = useState([]);
  const [expandPnCol, setExpandPnCol] = useState(false);
  const [partInformationColumns, setPartInformationColumns] = useState([]);
  const [isCorrectCurrencySet, setIsCorrectCurrencySet] = useState(false);
  const [showItemReceivedModal, setShowItemReceivedModal] = useState(false);
  const [selectedPoItem, setSelectedPoItem] = useState(null);
  const [selectedPoItemApp, setSelectedPoItemApp] = useState("parts");
  const previousPoState = useRef(null); // Ref to track previous poState value
  const [showScanQRCodeModal, setShowScanQRCodeModal] = useState(false);

  const fetchPoData = useCallback(() => {
    if (po_id && refreshPo) {
      getPoItemsByPoId(po_id).then((res) => {
        setPoItems(res);
        setRefreshPo(false);
      });
    }
  }, [po_id, refreshPo]);

  useEffect(() => {
    if (refreshPo) {
      fetchPoData();
      setRefresh(true);
    }
  }, [refreshPo, fetchPoData]);

  useEffect(() => {
    // Check if poState has changed from a non-null value to another
    if (
      poState !== previousPoState.current &&
      previousPoState.current !== null
    ) {
      fetchPoData();
    }
    // Update previousPoState to the current poState
    previousPoState.current = poState;
  }, [poState, fetchPoData]);

  useEffect(() => {
    if (!isCorrectCurrencySet) {
      fetchCurrencyConversions(organizationCurrency).then(() => {
        setIsCorrectCurrencySet(true);
      });
    }
  }, [organizationCurrency, fetchCurrencyConversions, isCorrectCurrencySet]);

  useEffect(() => {
    const uniqueKeys = new Set();
    parts.forEach((part) => {
      if (part.part_information) {
        Object.keys(part.part_information).forEach((key) => {
          uniqueKeys.add(key);
        });
      }
    });
    setPartInformationColumns(Array.from(uniqueKeys));
  }, [parts]);

  useEffect(() => {
    const { pcbaIds, assemblyIds, partIds } = separateBomItemIDs(poItems);
    if (poItems.length > 0) {
      getLinkedParts(assemblyIds, partIds, pcbaIds)
        .then((res) => {
          setParts(res?.parts || []);
          setAssemblies(res?.asms || []);
          setPcbas(res?.pcbas || []);
        })
        .catch((err) => {
          toast.error(err.message || "Error fetching related items");
          setParts([]);
          setAssemblies([]);
          setPcbas([]);
        });
    }
  }, [poItems]);

  useEffect(() => {
    if (poItems && Array.isArray(poItems) && parts && pcbas && assemblies) {
      const mergedPoList = buildBomObject(
        poItems,
        parts,
        pcbas,
        assemblies,
        partTypes
      );
      const sortedMergedList = mergedPoList.sort((a, b) => {
        if (a.temporary_mpn === "Shipping Cost") return 1;
        if (b.temporary_mpn === "Shipping Cost") return -1;
        return 0;
      });
      const moveNewRowsToTop = sortedMergedList.sort((a, b) => {
        const aIsNew =
          a?.temporary_mpn === "" &&
          a?.assembly === null &&
          a?.pcba === null &&
          a?.part === null;
        const bIsNew =
          b?.temporary_mpn === "" &&
          b?.assembly === null &&
          b?.pcba === null &&
          b?.part === null;

        if (aIsNew && !bIsNew) return -1; // a goes before b
        if (!aIsNew && bIsNew) return 1; // b goes before a
        return 0; // Otherwise, no change in order
      });

      setMatchedPoItems(moveNewRowsToTop);
    }
  }, [poItems, pcbas, assemblies, parts, partTypes]);

  useEffect(() => {
    if (isCorrectCurrencySet && !loadingCurrency && currencyPairs) {
      setRefreshPo(true);
    }
  }, [loadingCurrency, currencyPairs, isCorrectCurrencySet]);

  const handleClick = (value) => {
    navigator.clipboard.writeText(value).then(
      () => {},
      (err) => {
        toast.error("Failed to copy: ", err);
      }
    );
  };

  const convertPriceToOrganizationCurrency = (price, currency) => {
    if (!currency || currency === organizationCurrency) {
      return Number.parseFloat(price);
    }

    const rate = conversionRate[currency];
    if (!rate) {
      return Number.parseFloat(price);
    }
    return Number.parseFloat(price) / rate;
  };

  const handleEditItem = (rowId, key, value) => {
    const data = { [key]: value };
    editPoItem(rowId, data)
      .then((response) => {
        toast.success("Item updated successfully");
      })
      .catch((error) => {
        toast.error(`Error updating item: ${error.message}`);
      })
      .finally(() => {
        setRefreshPo(true);
      });
  };

  const handleSelectItem = (rowId, selectedItem) => {
    const idField =
      {
        Part: "part",
        PCBA: "pcba",
        Assembly: "assembly",
      }[selectedItem.item_type] || "item_id";

    const data = { [idField]: selectedItem.id };

    editPoItem(rowId, data)
      .then((response) => {
        toast.success("Item updated successfully");
      })
      .catch((error) => {
        toast.error(`Error updating item: ${error.message}`);
      })
      .finally(() => {
        setRefreshPo(true);
      });
  };

  const handleAddItem = () => {
    addPoItemWithContents(po_id, 1, 0, "", "") // Add item with default values
      .then(() => {
        toast.success("Item added successfully");
      })
      .catch((error) => {
        toast.error(`Error adding item: ${error.message}`);
      })
      .finally(() => {
        setRefreshPo(true);
      });
  };

  const handleAddShippingCost = () => {
    addPoItemWithContents(po_id, 1, 50, "Shipping Cost", "") // Add item with default values
      .then(() => {
        toast.success("Shipping cost added successfully");
      })
      .catch((error) => {
        toast.error(`Error adding shipping cost: ${error.message}`);
      })
      .finally(() => {
        setRefreshPo(true);
      });
  };

  const handleDeleteItem = (row) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      removePoItem(row?.id)
        .then((res) => {
          toast.success("Item deleted successfully");
        })
        .catch((error) => {
          toast.error(`Error deleting item: ${error.message}`);
        })
        .finally(() => {
          setRefreshPo(true);
        });
    }
  };

  const handleItemReceived = (row) => {
    // Open received items modal
    setSelectedPoItem(row);
    if (row?.part) {
      setSelectedPoItemApp("parts");
    } else if (row?.assembly) {
      setSelectedPoItemApp("assemblies");
    } else if (row?.pcba) {
      setSelectedPoItemApp("pcbas");
    }
    setShowItemReceivedModal(true);
  };

  const markItemReceived = () => {
    markItemAsReceived(selectedPoItem.id)
      .then(() => {
        toast.success("Item marked as received successfully");
      })
      .catch((error) => {
        toast.error(`Error marking item as received: ${error.message}`);
      })
      .finally(() => {
        setRefreshPo(true);
      });

    setShowItemReceivedModal(false);
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part Number",
      headerTooltip: "Dokulys unique part number.",
      sort: true,
      formatter: (row) => {
        if (row?.temporary_mpn === "Shipping Cost") {
          return "-";
        }
        return (
          <InlineItemSelector
            row={row}
            readOnly={readOnly}
            onSelectItem={handleSelectItem}
            searchTerm={row.full_part_number || row.temporary_mpn}
          />
        );
      },
      csvFormatter: (row) => {
        if (!(row.part || row.assembly || row.pcba)) {
          return "";
        }
        if (row?.full_part_number) {
          return row?.full_part_number;
        }
        return "Unknown";
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: expandPnCol ? "360px" : "120px",
    },
    {
      key: "thumbnail",
      header: "Thumbnail",
      formatter: thumbnailFormatter,
      includeInCsv: false,
      defaultShowColumn: true,
      maxWidth: "150px",
    },
    {
      key: "display_name",
      header: "Display Name",
      formatter: (row) => {
        if (row?.temporary_mpn === "Shipping Cost") {
          return "Shipping Cost";
        }
        return row?.display_name || "";
      },
      csvFormatter: (row) => {
        if (row?.temporary_mpn === "Shipping Cost") {
          return "Shipping Cost";
        }
        return row?.display_name || "";
      },
      defaultShowColumn: true,
      maxWidth: expandPnCol ? "120px" : "800px",
    },
    {
      key: "designator",
      header: "Designator",
      headerTooltip: "Customer Reference Designator",
      maxWidth: "100px",
      includeInCsv: true,
      csvFormatter: (row) => (row?.designator ? `${row?.designator}` : ""),
      formatter: (row) => {
        if (row?.temporary_mpn === "Shipping Cost") {
          return "-";
        }
        return (
          <TextFieldEditor
            text={row?.designator}
            setText={(newText) => handleEditItem(row.id, "designator", newText)}
            multiline={true}
            readOnly={readOnly}
          />
        );
      },
    },
    {
      key: "comment",
      header: "Comment",
      maxWidth: "100px",
      includeInCsv: true,
      csvFormatter: (row) => (row?.comment ? `${row?.comment}` : ""),
      formatter: (row) => {
        if (row?.temporary_mpn === "Shipping Cost") {
          return "-";
        }
        return (
          <TextFieldEditor
            text={row?.comment}
            setText={(newText) => handleEditItem(row.id, "comment", newText)}
            multiline={true}
            readOnly={readOnly}
          />
        );
      },
    },
    {
      key: "mpn",
      header: "MPN",
      headerTooltip: "Manufacturer Part Number",
      sort: true,
      formatter: (row) => {
        if (row.mpn) {
          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <span
              onClick={() => handleClick(row.mpn)}
              title="Copy"
              style={{
                cursor: "pointer",
                padding: "5px",
                borderRadius: "5px",
              }}
            >
              {row.mpn}
            </span>
          );
        }
        if (row.temporary_mpn === "Shipping Cost") {
          return "-";
        }
        if (!(row.part || row.assembly || row.pcba) && row.temporary_mpn) {
          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
            <span
              className="badge bg-warning text-dark"
              onClick={() => handleClick(row.temporary_mpn)}
              title="Copy"
              style={{
                cursor: "pointer",
                padding: "5px",
                borderRadius: "5px",
              }}
            >
              {row.temporary_mpn}
            </span>
          );
        }
        return "";
      },
      csvFormatter: (row) => {
        if (row.mpn) {
          return `${row.mpn}`;
        }
        if (
          !(row.part || row.assembly || row.pcba) &&
          row.temporary_mpn &&
          row.temporary_mpn !== "Shipping Cost"
        ) {
          return `${row.temporary_mpn}`;
        }
        return "";
      },
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: expandPnCol ? "160px" : "800px",
    },
    {
      key: "manufacturer",
      header: "Manufacturer",
      csvFormatter: (row) => (row?.manufacturer ? `${row?.manufacturer}` : ""),
      includeInCsv: true,
      defaultShowColumn: false,
    },
    {
      key: "quantity",
      header: "Quantity",
      formatter: (row) => {
        if (row.temporary_mpn === "Shipping Cost") {
          return row?.quantity || 1;
        }
        return (
          <NumericFieldEditor
            number={row.quantity}
            setNumber={(value) => handleEditItem(row?.id, "quantity", value)}
          />
        );
      },
      csvFormatter: (row) => (row?.quantity ? `${row?.quantity}` : ""),
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: expandPnCol ? "70px" : "200px",
    },
    {
      key: "price",
      header: `Unit Price [${purchaseOrder?.po_currency}]`,
      headerTooltip: "Unit Price",
      formatter: (row) => (
        <NumericFieldEditor
          number={row.price}
          setNumber={(value) => handleEditItem(row?.id, "price", value)}
        />
      ),
      csvFormatter: (row) => {
        if (!row.price) {
          return "-";
        }
        const price = parseFloat(row?.price) || 0;
        return price.toFixed(2);
      },
      includeInCsv: true,
      defaultShowColumn: true,
    },
    {
      key: "total_price",
      header: `Total Price [${purchaseOrder?.po_currency || "USD"}]`,
      headerTooltip: "The total price of the item in the supplier's currency.",
      formatter: (row) => {
        const price = row?.price ?? 0;
        const quantity = row?.quantity ?? 1;
        const totalPrice = price * quantity;

        // Ensure valid currency code
        const currencyCode =
          purchaseOrder?.po_currency && purchaseOrder.po_currency.includes("/")
            ? "USD" // Fallback to USD if invalid currency code format
            : purchaseOrder?.po_currency || "USD";

        const formattedPrice = totalPrice.toLocaleString("en-US", {
          style: "currency",
          currency: currencyCode,
        });
        return <span>{formattedPrice}</span>;
      },
      csvFormatter: (row) => {
        const price = row?.price ?? 0;
        const quantity = row?.quantity ?? 1;
        const totalPrice = price * quantity;

        // Ensure valid currency code
        const currencyCode =
          purchaseOrder?.po_currency && purchaseOrder.po_currency.includes("/")
            ? "USD" // Fallback to USD if invalid currency code format
            : purchaseOrder?.po_currency || "USD";

        const formattedPrice = totalPrice.toLocaleString("en-US", {
          style: "currency",
          currency: currencyCode,
        });
        return formattedPrice;
      },
      includeInCsv: true,
      defaultShowColumn: true,
    },
  ];

  partInformationColumns.map((key) =>
    columns.push({
      key: key,
      header: key,
      headerTooltip: key,
      formatter: (row) => `${row?.part_information?.[key] || ""}`,
      csvFormatter: (row) => `${row?.part_information?.[key] || ""}`,
      includeInCsv: true,
      defaultShowColumn: false,
    })
  );

  if (!readOnly) {
    columns.push({
      key: "",
      header: "Action",
      formatter: (row) => {
        return (
          <Row className="justify-content-center align-items-center">
            <Col className="col-auto">
              <AddButton
                onClick={() => handleDeleteItem(row)}
                imgSrc="../../../static/icons/trash.svg"
              />
            </Col>
          </Row>
        );
      },
      includeInCsv: false,
    });
  }

  if (readOnly) {
    columns.push({
      key: "",
      header: "Action",
      formatter: (row) => {
        return (
          <Row className="justify-content-center align-items-center">
            <Col className="col-auto">
              {!row?.item_received ? (
                <div onClick={() => handleItemReceived(row)}>
                  {row?.quantity_received === 0 ? (
                    <AddButton
                      imgSrc="../../../static/icons/boxes.svg"
                      imgStyle={{ width: "25px" }}
                    />
                  ) : (
                    <span
                      className="badge badge-pill badge-warning"
                      data-toggle="tooltip"
                      data-placement="top"
                      title={`Partially received: ${row?.quantity_received} / ${row?.quantity}`}
                    >
                      Partially received
                    </span>
                  )}
                </div>
              ) : (
                <span
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Are you sure you want to mark this item as not received?"
                      )
                    ) {
                      return;
                    }
                    handleEditItem(row?.id, "item_received", false);
                  }}
                  className="badge badge-pill badge-success"
                >
                  Received
                </span>
              )}
            </Col>
          </Row>
        );
      },
      includeInCsv: false,
    });
  }

  const handleRowClick = (index) => {
    const selectedItem = poItems[index];
    if (event.ctrlKey || event.metaKey) {
      let url = "";
      if (selectedItem.pcba) {
        url = `/#/pcbas/${selectedItem.pcba}`;
      } else if (selectedItem.assembly) {
        url = `/#/assemblies/${selectedItem.assembly}`;
      } else if (selectedItem.part) {
        url = `/#/parts/${selectedItem.part}`;
      }
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  const onNavigate = (selectedItem) => {
    let url = "";
    if (selectedItem.pcba) {
      url = `/pcbas/${selectedItem.pcba}`;
    } else if (selectedItem.assembly) {
      url = `/assemblies/${selectedItem.assembly}`;
    } else if (selectedItem.part) {
      url = `/parts/${selectedItem.part}`;
    }
    if (url) {
      navigate(url);
    }
  };

  return (
    showTable && (
      <DokulyCard>
        <CardTitle titleText="Order Items" />
        {poItems != null && (
          <React.Fragment>
            <Row className="ml-1 mx-2 mb-2 align-items-center">
              {!readOnly && (
                <AddButton buttonText="Add Item" onClick={handleAddItem} />
              )}
              <ClearOrderItemsButton
                po_id={po_id}
                readOnly={readOnly}
                setRefresh={setRefreshPo}
              />

              {!readOnly &&
                !matchedPoItems.find(
                  (row) => row.temporary_mpn === "Shipping Cost"
                ) && (
                  <AddButton
                    className="mx-2"
                    buttonText="Add Shipping Cost"
                    onClick={handleAddShippingCost}
                  />
                )}
              <PoImportButton
                btnClassName={"mx-2"}
                po_id={po_id}
                readOnly={readOnly}
                setRefreshPo={setRefreshPo}
                showPoIgnoreDropdown={true}
              />
              <TransparentButton
                className="mx-2"
                buttonText="Bulk receive"
                imgSrc="../../static/icons/inbox.svg"
                onClick={() => setShowScanQRCodeModal(true)}
              />
            </Row>
            <Row>
              {!loadingPurchaseOrder ? (
                <>
                  {matchedPoItems.length === 0 ? (
                    <NoDataFound />
                  ) : (
                    <DokulyTable
                      key={poState ?? 1}
                      tableName="OrderItemsTable"
                      data={matchedPoItems}
                      columns={columns}
                      showColumnSelector={!isPrintable}
                      itemsPerPage={100000} // No pagination
                      onRowClick={(index) => handleRowClick(index)}
                      navigateColumn={!isPrintable}
                      onNavigate={(row) => onNavigate(row)}
                      textSize={tableTextSize}
                      setTextSize={setTableTextSize}
                      showTableSettings={true}
                      showCsvDownload={!isPrintable}
                      showPagination={false}
                      showSearch={!isPrintable}
                    />
                  )}
                </>
              ) : (
                loadingSpinner()
              )}
            </Row>

            {!readOnly && (
              <React.Fragment>
                <Row className="mt-2">
                  <Col>
                    <p className="text-muted">
                      <small>
                        <b>Click</b> a cell to edit the data.
                      </small>
                    </p>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <p className="text-muted">
                      <small>
                        <b>Ctrl+click</b> to open item in new tab.
                      </small>
                    </p>
                  </Col>
                </Row>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        <ItemReceivedForm
          show={showItemReceivedModal}
          onHide={() => setShowItemReceivedModal(false)}
          selectedPoItem={selectedPoItem}
          app={selectedPoItemApp}
          markItemReceived={markItemReceived}
        />
        <ScanQRCodeModal
          show={showScanQRCodeModal}
          onHide={() => setShowScanQRCodeModal(false)}
          poItems={matchedPoItems}
          setRefreshPo={setRefreshPo}
          po_id={po_id}
          organization={organization}
        />
      </DokulyCard>
    )
  );
};

export default OrderItemsTable;
