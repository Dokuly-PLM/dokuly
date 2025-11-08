import React, { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import FilterPanel from "./filterPanel";

const ColumnSelector = ({
  tableName = "",
  columns,
  selectedColumns,
  setSelectedColumns,
  fontsize = "14px",
  onSetAsDefault = null,
  columnFilters = {},
  onFilterChange = null,
  tableData = [],
  showFilters = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleColumnToggle = (key) => {
    setSelectedColumns((currentColumns) => {
      const isCurrentlySelected = currentColumns.some(
        (column) => column.key === key,
      );
      if (isCurrentlySelected) {
        return currentColumns.filter((column) => column.key !== key);
      } else {
        const columnToAdd = columns.find((column) => column.key === key);
        return [...currentColumns, columnToAdd];
      }
    });
  };

  const handleSetAsDefault = () => {
    if (onSetAsDefault) {
      onSetAsDefault(selectedColumns.map((col) => col.key));
    }
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const columnsPerRow = 6;
  const rows = [];

  // Show all columns when not expanded if they are 12 or fewer
  const visibleColumns = isExpanded ? columns : columns.slice(0, 12);

  // Sort only when expanded
  const sortedColumns = isExpanded
    ? [...visibleColumns].sort((a, b) => a.header.localeCompare(b.header))
    : visibleColumns;

  for (let i = 0; i < sortedColumns.length; i += columnsPerRow) {
    rows.push(sortedColumns.slice(i, i + columnsPerRow));
  }

  return (
    <div
      className="column-selector p-2 mb-3"
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: fontsize,
      }}
    >
      {showFilters && onFilterChange && (
        <div style={{ borderBottom: "1px solid #ccc", marginBottom: "20px", paddingBottom: "20px" }}>
          <h6 className="mb-3" style={{ fontWeight: "600" }}>Filters</h6>
          <FilterPanel
            columns={columns}
            selectedColumns={selectedColumns}
            columnFilters={columnFilters}
            onFilterChange={onFilterChange}
            tableData={tableData}
            textSize={fontsize}
          />
        </div>
      )}
      
      <div>
        <h6 className="mb-3" style={{ fontWeight: "600" }}>Columns</h6>
        <Row className="justify-content-center">
          <Col />
          <Col md={10}>
            {rows.map((row, rowIndex) => (
              <Row key={rowIndex} className="align-items-center">
                {row.map((column) => (
                  <Col key={column.key} md={12 / columnsPerRow}>
                    <Form.Check
                      className="dokuly-checkbox dokuly-checkbox-custom"
                      type="checkbox"
                      id={`checkbox-${column.key}`}
                      label={column.header}
                      checked={selectedColumns.some(
                        (col) => col.key === column.key,
                      )}
                      onChange={() => handleColumnToggle(column.key)}
                    />
                  </Col>
                ))}
              </Row>
            ))}
          </Col>
          <Col />
        </Row>
        <Row className="justify-content-center mt-2">
          <Col md={10}>
            <div className="d-flex justify-content-between align-items-center">
              {columns.length > 12 && (
                <Button
                  className="btn btn-bg-transparent"
                  onClick={handleExpandToggle}
                >
                  {isExpanded ? "Collapse" : "Expand"}
                </Button>
              )}
              {onSetAsDefault && (
                <Button
                  className="btn dokuly-btn-transparent"
                  onClick={handleSetAsDefault}
                  style={{ marginLeft: "auto" }}
                >
                  Set as Default Columns
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ColumnSelector;
