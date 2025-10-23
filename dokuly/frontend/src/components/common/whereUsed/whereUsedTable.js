import React, { useState, useEffect, useCallback } from "react";
import { Button, Badge, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { referenceDesignatorFormatter } from "../bom/functions/referenceDesignatorFormatter";
import { formatBOMImageData } from "../../assemblies/functions/formatBOMImageData";
import { fetchWhereUsedData } from "../queries";

const WhereUsedTable = ({ app, itemId, itemType }) => {
  const [whereUsedData, setWhereUsedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestOnly, setLatestOnly] = useState(true);
  const navigate = useNavigate();

  const loadWhereUsedData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWhereUsedData(app, itemId, latestOnly);
      setWhereUsedData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching where used data:", err);
      setError("Failed to load where used data");
    } finally {
      setLoading(false);
    }
  }, [app, itemId, latestOnly]);

  useEffect(() => {
    if (itemId && itemId !== -1) {
      loadWhereUsedData();
    }
  }, [itemId, loadWhereUsedData]);

  const handleNavigateToParent = (parentType, parentId) => {
    if (parentType === "assembly") {
      navigate(`/assemblies/${parentId}`);
    } else if (parentType === "pcba") {
      navigate(`/pcbas/${parentId}`);
    }
  };

  const columns = [
    {
      key: "thumbnail",
      header: "Thumbnail",
      formatter: (row) => {
        // Create a mock entry object for the formatBOMImageData function
        const mockEntry = {
          thumbnail: row.parent?.thumbnail,
          part_type: row.parent?.part_type
        };
        return formatBOMImageData(mockEntry, row.parent_type?.toUpperCase());
      },
      includeInCsv: false,
      defaultShowColumn: true,
      maxWidth: "150px",
    },
    {
      key: "parent",
      header: "Parent",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      formatter: (row) => {
        return (
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
              {row.parent?.display_name || row.parent?.part_number || "Unknown"}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>
              {row.parent?.full_part_number || "-"}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6c757d", marginTop: "2px" }}>
              {row.parent_type?.toUpperCase()}
            </div>
          </div>
        );
      },
    },
    {
      key: "total_quantity",
      header: "Quantity",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "120px",
      formatter: (row) => {
        const displayQuantity = row.total_quantity || "-";
        const unit = "pcs"; // Default unit like in BOM table
        
        return (
          <div className="d-flex w-100" style={{ minWidth: "100px" }}>
            <span>
              {`${displayQuantity} ${unit}`}
            </span>
          </div>
        );
      },
    },
    {
      key: "designators",
      header: "Designators",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "200px",
      formatter: (row) => {
        return row.designators && row.designators !== "No designators" ? (
          <div className="d-flex w-100" style={{ minWidth: "4rem" }}>
            <span className="w-100">
              {referenceDesignatorFormatter(row.designators)}
            </span>
          </div>
        ) : (
          <span className="text-muted">-</span>
        );
      },
    },
    {
      key: "all_mounted",
      header: "DNM",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: (row) => {
        return (
          <div className="d-flex align-items-center" style={{ minWidth: "100px" }}>
            <input
              className="dokuly-checkbox"
              type="checkbox"
              checked={!row.all_mounted} // Inverted logic: DNM is checked when not all mounted
              disabled
              style={{ marginLeft: "10px" }}
            />
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (whereUsedData.length === 0) {
    return (
      <DokulyCard>
        <CardTitle titleText="Where Used" />
        <div className="text-center p-4">
          <h5>No Usage Found</h5>
          <p className="text-muted">
            This {itemType} is not currently used in any assemblies or PCBAs.
          </p>
        </div>
      </DokulyCard>
    );
  }

  return (
    <DokulyCard>
      <CardTitle 
        titleText="Where Used" 
        subtitle={`Showing ${whereUsedData.length} usage${whereUsedData.length !== 1 ? "s" : ""}`}
      />
      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input dokuly-checkbox"
            type="checkbox"
            id="latestOnlyCheckbox"
            checked={latestOnly}
            onChange={(e) => setLatestOnly(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="latestOnlyCheckbox">
            Show only latest revisions
          </label>
        </div>
      </div>
      <DokulyTable
                tableName="whereUsedTable"
                data={whereUsedData}
                columns={columns}
                showColumnSelector={true}
                showCsvDownload={true}
                showPagination={true}
                showSearch={true}
                navigateColumn={true}
                onNavigate={(row) => handleNavigateToParent(row.parent_type, row.parent?.id)}
                itemsPerPage={50}
                defaultSort={{ columnNumber: 0, order: "asc" }}
                textSize="16px"
              />
    </DokulyCard>
  );
};

export default WhereUsedTable;