import React, { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";

const ColumnSelector = ({
  tableName = "",
  columns,
  selectedColumns,
  setSelectedColumns,
  fontsize = "14px",
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
      {columns.length > 12 && (
        <Button
          className="btn btn-bg-transparent"
          onClick={handleExpandToggle}
          style={{ marginTop: "10px" }}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </Button>
      )}
    </div>
  );
};

export default ColumnSelector;
