import React from "react";
import { Badge, Button } from "react-bootstrap";

/**
 * FilterChips component displays active filters as removable pills
 */
const FilterChips = ({ filters, columns, onRemoveFilter, onClearAll, textSize = "16px" }) => {
  const activeFilters = Object.entries(filters || {}).filter(
    ([_, value]) => {
      if (!value) return false;
      if (typeof value === "string") return value.length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") {
        return Object.values(value).some((v) => v != null && v !== "");
      }
      return false;
    }
  );

  if (activeFilters.length === 0) return null;

  const getFilterLabel = (columnKey, filterValue) => {
    const column = columns.find((col) => col.key === columnKey);
    const columnName = column?.header || columnKey;

    if (Array.isArray(filterValue)) {
      return `${columnName}: ${filterValue.join(", ")}`;
    }
    if (typeof filterValue === "object") {
      const parts = [];
      if (filterValue.min != null) parts.push(`≥${filterValue.min}`);
      if (filterValue.max != null) parts.push(`≤${filterValue.max}`);
      if (filterValue.from) parts.push(`From: ${filterValue.from}`);
      if (filterValue.to) parts.push(`To: ${filterValue.to}`);
      return `${columnName}: ${parts.join(", ")}`;
    }
    return `${columnName}: ${filterValue}`;
  };

  return (
    <div
      className="d-flex flex-wrap align-items-center gap-2 mb-2"
      style={{ fontSize: textSize }}
    >
      {activeFilters.length > 0 && (
        <span style={{ marginRight: "4px", fontWeight: "500" }}>Filters:</span>
      )}
      {activeFilters.map(([columnKey, filterValue]) => (
        <Badge
          key={columnKey}
          bg="secondary"
          className="d-flex align-items-center gap-1"
          style={{
            fontSize: textSize,
            padding: "4px 8px",
            cursor: "default",
            backgroundColor: "#6c757d",
          }}
        >
          <span>{getFilterLabel(columnKey, filterValue)}</span>
          <button
            type="button"
            className="btn-close btn-close-white"
            style={{
              fontSize: "10px",
              padding: "0",
              marginLeft: "4px",
              opacity: 0.8,
            }}
            onClick={() => onRemoveFilter(columnKey)}
            aria-label="Remove filter"
          />
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="link"
          size="sm"
          className="dokuly-btn-transparent"
          onClick={onClearAll}
          style={{
            fontSize: textSize,
            padding: "0 4px",
            textDecoration: "none",
          }}
        >
          Clear all
        </Button>
      )}
    </div>
  );
};

export default FilterChips;

