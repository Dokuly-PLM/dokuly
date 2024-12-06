import React, { useState, useEffect } from "react";
import QuestionToolTip from "../questionToolTip";
import { inventoryTableTooltipText } from "./inventoryTableTooltipText";
import AddLocationEntry from "./addLocationEntry";
import DokulyCard from "../dokulyCard";
import { Form, Row } from "react-bootstrap";
import CardTitle from "../cardTitle";
import DokulyTable from "../dokulyTable/dokulyTable";
import AddButton from "../AddButton";
import {
  addNewLocationEntry,
  adjustStock,
  deleteLocationEntry,
  updateLocationEntry,
} from "./functions/queries";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import GenericDropdownSelector from "../dokulyTable/components/genericDropdownSelector";
import { toast } from "react-toastify";
import TransactionInput from "./components/transactionInput";
import CheckBox from "../checkBox";
import DeleteButton from "../deleteButton";
import NoDataFound from "../dokulyTable/components/noDataFound";

const InventoryTable = ({
  dbObject,
  locationEntities,
  app,
  setRefresh,
  locations = [],
  otherRevisionsStockList = [],
  loading = false,
  refreshPart = () => {},
  quantityFromPoItem = 0,
  autoFocus = true,
  autoRefresh = true,
}) => {
  const [filteredLocationData, setFilteredLocationData] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [showEmptyLocations, setShowEmptyLocations] = useState(false);
  const [showStockForOtherRevisions, setShowStockForOtherRevisions] =
    useState(false);
  const [focusedRowId, setFocusedRowId] = useState(null);

  const handleRowClick = (rowId, row, e) => {
    setFocusedRowId(row.id); // Set the focused row ID when a row is clicked
  };

  const newLocationEntry = () => {
    const data = {
      object_id: dbObject.id,
      app: app,
    };
    addNewLocationEntry(data).then((res) => {
      if (res.status === 201) {
        toast.success("Location entry added successfully.");
        setRefresh(true);
      }
    });
  };

  const onNavigate = (row) => {};

  const newInventoryTransaction = (row) => {
    const transactionQuantity = row?.transactionQuantity;
    if (!row?.location_id) {
      alert("Please select a location first.");
      return;
    }
    if (!transactionQuantity) {
      toast.error("Please enter a quantity to adjust stock.");
      return;
    }
    const data = {
      object_id: dbObject.id,
      app: app,
      quantity: Number.parseInt(transactionQuantity, 10),
      inventory_id: row?.id,
      location_id: row?.location_id,
    };
    if (row?.revision) {
      data.object_id = row?.revision_object_id;
    }
    row.transactionQuantity = "0";
    adjustStock(data).then((res) => {
      if (res.status === 201) {
        toast.success("Stock adjusted successfully.");
        setRefresh(true);
        refreshPart(true);
      }
    });
  };

  const handleSelectDropdown = (row, value) => {
    const data = {
      inventory_id: row.id,
      location_id: value,
      app: app,
      object_id: dbObject.id,
    };
    if (row?.revision) {
      data.object_id = row?.revision_object_id;
    }
    updateLocationEntry(data).then((res) => {
      if (res.status === 201) {
        toast.success("Location updated successfully.");
        setRefresh(true);
      }
      if (res.status === 204) {
        toast.info(
          "This location is already assigned to this inventory item. Check empty locations!"
        );
      }
    });
  };

  const handleDelete = (row) => {
    if (!confirm("Are you sure you want to delete this location entry?")) {
      return;
    }
    deleteLocationEntry(row?.id)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Location entry deleted successfully.");
          setRefresh(true);
        }
      })
      .catch((error) => {
        toast.error("Error deleting location entry.");
      });
  };

  useEffect(() => {
    if (locationEntities) {
      let filteredData = locationEntities.filter(
        (item) =>
          showEmptyLocations ||
          item?.in_stock !== 0 ||
          item?.name?.startsWith("On order")
      );

      // Conditionally add other revisions stock list if the toggle is true
      if (showStockForOtherRevisions && otherRevisionsStockList.length > 0) {
        const safeArray = Array.isArray(otherRevisionsStockList)
          ? otherRevisionsStockList
          : [];
        filteredData = filteredData.concat(safeArray);
      }

      setFilteredLocationData(filteredData);
    }
  }, [
    locationEntities,
    showEmptyLocations,
    showStockForOtherRevisions,
    otherRevisionsStockList,
  ]);

  useEffect(() => {
    if (locations) {
      const formattedLocations = locations.map((location) => {
        return {
          ...location,
          value: location.id,
          label: location.name,
        };
      });
      setLocationOptions(formattedLocations);
    }
  }, [locations]);

  const columns = [
    {
      key: "name",
      header: "Location",
      headerTooltip: "The name of the location.",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) => {
        if (!row?.name && !row?.location_id) {
          return (
            <GenericDropdownSelector
              state={row?.name}
              setState={(value) => handleSelectDropdown(row, value)}
              dropdownValues={locationOptions}
              placeholder={"Select location"}
              borderIfPlaceholder={false}
              textSize={"12px"}
              readOnly={false}
            />
          );
        }
        if (row?.name === "On order" && row?.revision) {
          const formattedName = `${row?.name} (Revision: ${row?.revision})`;
          return <span>{formattedName}</span>;
        }
        if (row?.revision) {
          const formattedName = `${row?.name} (Revision: ${row?.revision})`;
          return <span>{formattedName}</span>;
        }
        return row?.name;
      },
    },
    {
      key: "in_stock",
      header: "In Stock",
      headerTooltip: "The number of items in stock at this location.",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) => {
        const currentStock = row?.in_stock ?? "No current stock";
        const unit = dbObject?.unit ?? "pcs";
        return `${currentStock} ${unit}`;
      },
    },
    {
      key: "",
      header: "Actions",
      formatter: (row) => {
        if (row?.name === "On order") {
          const connected_pos = row?.connected_pos;
          return (
            <Row>
              {connected_pos &&
                connected_pos.length > 0 &&
                connected_pos.map((po, index) => {
                  if (po?.id && po?.purchase_order_number) {
                    return (
                      <span key={po.id}>
                        <b
                          className={
                            index < connected_pos.length - 1 ? "mr-1" : ""
                          }
                        >
                          <a
                            href={`#/procurement/${po.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ borderBottom: "1px solid #000" }}
                          >
                            {`PO${po.purchase_order_number}`}
                          </a>
                          {index < connected_pos.length - 1 ? ", " : ""}
                        </b>
                      </span>
                    );
                  }
                  return "";
                })}
            </Row>
          );
        }
        return (
          <Row className="d-flex algin-items-center">
            <TransactionInput
              row={row}
              onSubmit={newInventoryTransaction}
              focusInput={focusedRowId === row.id}
              quantityFromPoItem={quantityFromPoItem}
              autoFocus={autoFocus}
            />
            <AddButton
              buttonText={"Update stock"}
              imgSrc="../../static/icons/switch-vertical.svg"
              onClick={() => newInventoryTransaction(row)}
              imgStyle={{ width: "20px", height: "20px" }}
              hideIcon
            />
            {!row?.name && !row?.location_id && (
              <DeleteButton
                className="ml-2"
                onDelete={() => handleDelete(row)}
              />
            )}
          </Row>
        );
      },
      maxWidth: "150px",
      includeInCsv: false,
      defaultShowColumn: true,
    },
  ];

  return (
    <DokulyCard key={dbObject?.id ?? 0}>
      <Row className="align-items-center">
        <CardTitle
          style={{ paddingLeft: "15px", marginRight: "0.5rem" }}
          titleText="Inventory"
        />
        <QuestionToolTip
          optionalHelpText={inventoryTableTooltipText}
          placement="right"
        />
      </Row>
      <Row className="algin-items-center">
        <AddLocationEntry
          className="mr-4"
          addLocationEntry={newLocationEntry}
        />
        <CheckBox
          divClassName={"mt-2 mr-4"}
          className="dokuly-checkbox"
          style={{ marginTop: "0.33rem" }}
          label="Show empty locations"
          checked={showEmptyLocations}
          onChange={(e) => setShowEmptyLocations(e.target.checked)}
        />
        <CheckBox
          divClassName={"mt-2"}
          className="dokuly-checkbox"
          style={{ marginTop: "0.33rem" }}
          label="Show stock for other revisions"
          checked={showStockForOtherRevisions}
          onChange={(e) => setShowStockForOtherRevisions(e.target.checked)}
        />
      </Row>
      {!locations ? (
        <div className="m-2">No locations entires found.</div>
      ) : (
        <>
          {filteredLocationData.length === 0 ? (
            <NoDataFound />
          ) : (
            <DokulyTable
              tableName="locationsTable"
              data={filteredLocationData}
              columns={columns}
              showColumnSelector={true}
              itemsPerPage={100000} // No pagination
              onRowClick={(rowId, row, e) => handleRowClick(rowId, row, e)}
              navigateColumn={false} // No navigation
              onNavigate={(row) => onNavigate(row)}
              defaultSort={{ columnNumber: 0, order: "asc" }}
              textSize="16px"
            />
          )}
        </>
      )}
    </DokulyCard>
  );
};

export default InventoryTable;
