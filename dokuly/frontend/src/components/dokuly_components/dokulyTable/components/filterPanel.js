import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import ColumnFilter from "./columnFilter";

/**
 * FilterPanel component displays all column filters in a panel
 */
const FilterPanel = ({
  columns,
  selectedColumns,
  columnFilters,
  onFilterChange,
  tableData,
  textSize = "16px",
}) => {
  // Only show filters for columns that are currently visible/selected
  const filterableColumns = selectedColumns.filter(
    (col) => col.filterable !== false && (col.filterType || col.key)
  );

  if (filterableColumns.length === 0) {
    return (
      <div className="p-3" style={{ fontSize: textSize }}>
        <p className="text-muted mb-0">No filterable columns available.</p>
      </div>
    );
  }

  return (
    <div style={{ fontSize: textSize }}>
      <Row className="g-3">
        {filterableColumns.map((column) => {
          const filterType = column.filterType || "text";
          const isWideFilter = filterType === "multiselect" || filterType === "date" || filterType === "number";
          
          return (
            <Col 
              key={column.key} 
              xs={12} 
              sm={isWideFilter ? 12 : 6} 
              md={isWideFilter ? 6 : 4}
              lg={isWideFilter ? 6 : 3}
            >
              <Form.Group className="mb-0">
                <Form.Label 
                  style={{ 
                    fontSize: textSize, 
                    fontWeight: "500", 
                    marginBottom: "6px",
                    display: "block"
                  }}
                >
                  {column.header}
                </Form.Label>
                <div>
                  <ColumnFilter
                    column={column}
                    filterValue={columnFilters[column.key]}
                    onFilterChange={onFilterChange}
                    data={tableData}
                    textSize={textSize}
                    inline={true}
                  />
                </div>
              </Form.Group>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default FilterPanel;

