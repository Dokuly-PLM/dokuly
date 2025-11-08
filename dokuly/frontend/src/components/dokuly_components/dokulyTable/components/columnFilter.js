import React, { useState, useRef, useEffect } from "react";
import { Form, Dropdown } from "react-bootstrap";

/**
 * ColumnFilter component for filtering table columns
 * Supports text, select (single/multi), date range, and numeric range filters
 */
const ColumnFilter = ({
  column,
  filterValue,
  onFilterChange,
  data,
  textSize = "16px",
  inline = false, // If true, render inline without dropdown
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilterValue, setLocalFilterValue] = useState(filterValue || "");
  const dropdownRef = useRef(null);

  useEffect(() => {
    setLocalFilterValue(filterValue || "");
  }, [filterValue]);

  // Get unique values for select filters
  const getUniqueValues = () => {
    if (!data || data.length === 0) return [];
    
    // If filterOptions are provided, use them
    if (column.filterOptions && Array.isArray(column.filterOptions)) {
      return column.filterOptions;
    }
    
    // Otherwise, extract unique values from data
    const values = new Set();
    data.forEach((row) => {
      let value;
      if (column.filterValue) {
        value = column.filterValue(row);
      } else {
        value = row[column.key];
      }
      
      if (value != null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v != null && v !== "") {
              values.add(String(v));
            }
          });
        } else {
          values.add(String(value));
        }
      }
    });
    return Array.from(values).sort();
  };

  const handleFilterChange = (newValue) => {
    setLocalFilterValue(newValue);
    onFilterChange(column.key, newValue);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleFilterChange("");
    setIsOpen(false);
  };

  const renderFilterContent = () => {
    const filterType = column.filterType || "text";
    const padding = inline ? "0" : "8px";
    const minWidth = inline ? "100%" : "200px";

    switch (filterType) {
      case "select":
        const selectContent = (
          <Form.Select
            size="sm"
            className="dokuly-form-input"
            value={localFilterValue || ""}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{ fontSize: textSize, width: inline ? "100%" : "auto" }}
          >
            <option value="">All</option>
            {getUniqueValues().map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Form.Select>
        );
        return inline ? selectContent : <div style={{ padding, minWidth }}>{selectContent}</div>;

      case "multiselect":
        const selectedValues = Array.isArray(localFilterValue)
          ? localFilterValue
          : localFilterValue
            ? [localFilterValue]
            : [];
        const multiselectContent = (
          <>
            <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: selectedValues.length > 0 ? "8px" : "0" }}>
              {getUniqueValues().map((value) => (
                <Form.Check
                  key={value}
                  type="checkbox"
                  className="dokuly-checkbox"
                  id={`filter-${column.key}-${value}`}
                  label={value}
                  checked={selectedValues.includes(value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, value]
                      : selectedValues.filter((v) => v !== value);
                    handleFilterChange(newValues.length > 0 ? newValues : "");
                  }}
                  style={{ fontSize: textSize }}
                />
              ))}
            </div>
            {selectedValues.length > 0 && (
              <button
                type="button"
                className="btn btn-sm dokuly-btn-transparent p-0"
                onClick={handleClear}
                style={{ fontSize: textSize }}
              >
                Clear
              </button>
            )}
          </>
        );
        return inline ? multiselectContent : <div style={{ padding, minWidth, maxHeight: "300px", overflowY: "auto" }}>{multiselectContent}</div>;

      case "number":
        const numberContent = (
          <>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: textSize, marginBottom: "4px" }}>Min</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                className="dokuly-form-input"
                value={localFilterValue?.min || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilterValue,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                style={{ fontSize: textSize }}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: textSize, marginBottom: "4px" }}>Max</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                className="dokuly-form-input"
                value={localFilterValue?.max || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilterValue,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                style={{ fontSize: textSize }}
              />
            </Form.Group>
            {(localFilterValue?.min || localFilterValue?.max) && (
              <button
                type="button"
                className="btn btn-sm dokuly-btn-transparent p-0"
                onClick={handleClear}
                style={{ fontSize: textSize }}
              >
                Clear
              </button>
            )}
          </>
        );
        return inline ? numberContent : <div style={{ padding, minWidth }}>{numberContent}</div>;

      case "date":
        const dateContent = (
          <>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: textSize, marginBottom: "4px" }}>From</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                className="dokuly-form-input"
                value={localFilterValue?.from || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilterValue,
                    from: e.target.value || undefined,
                  })
                }
                style={{ fontSize: textSize }}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: textSize, marginBottom: "4px" }}>To</Form.Label>
              <Form.Control
                type="date"
                size="sm"
                className="dokuly-form-input"
                value={localFilterValue?.to || ""}
                onChange={(e) =>
                  handleFilterChange({
                    ...localFilterValue,
                    to: e.target.value || undefined,
                  })
                }
                style={{ fontSize: textSize }}
              />
            </Form.Group>
            {(localFilterValue?.from || localFilterValue?.to) && (
              <button
                type="button"
                className="btn btn-sm dokuly-btn-transparent p-0"
                onClick={handleClear}
                style={{ fontSize: textSize }}
              >
                Clear
              </button>
            )}
          </>
        );
        return inline ? dateContent : <div style={{ padding, minWidth }}>{dateContent}</div>;

      default: // text
        const textContent = (
          <>
            <Form.Control
              type="text"
              size="sm"
              className="dokuly-form-input"
              placeholder="Filter..."
              value={localFilterValue || ""}
              onChange={(e) => handleFilterChange(e.target.value)}
              style={{ fontSize: textSize, width: inline ? "100%" : "auto" }}
              autoFocus={!inline}
            />
            {localFilterValue && (
              <button
                type="button"
                className="btn btn-sm dokuly-btn-transparent p-0 mt-2"
                onClick={handleClear}
                style={{ fontSize: textSize, display: "block" }}
              >
                Clear
              </button>
            )}
          </>
        );
        return inline ? textContent : <div style={{ padding, minWidth }}>{textContent}</div>;
    }
  };

  const hasActiveFilter = () => {
    if (!localFilterValue) return false;
    if (typeof localFilterValue === "string") return localFilterValue.length > 0;
    if (Array.isArray(localFilterValue)) return localFilterValue.length > 0;
    if (typeof localFilterValue === "object") {
      return Object.values(localFilterValue).some((v) => v != null && v !== "");
    }
    return false;
  };

  // If inline mode, render the filter content directly without dropdown
  if (inline) {
    return <div onClick={(e) => e.stopPropagation()}>{renderFilterContent()}</div>;
  }

  // Default dropdown mode
  return (
    <Dropdown
      ref={dropdownRef}
      show={isOpen}
      onToggle={setIsOpen}
      onClick={(e) => e.stopPropagation()}
    >
      <Dropdown.Toggle
        as="div"
        className="d-inline-block"
        style={{
          cursor: "pointer",
          marginLeft: "5px",
          padding: "2px 4px",
          borderRadius: "3px",
          transition: "background-color 0.2s",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={(e) => {
          if (!hasActiveFilter()) {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <img
          src="../../../static/icons/filter.svg"
          alt="Filter"
          style={{
            width: "14px",
            height: "14px",
            opacity: hasActiveFilter() ? 1 : 0.5,
            verticalAlign: "middle",
          }}
        />
      </Dropdown.Toggle>
      <Dropdown.Menu
        style={{ padding: "4px", minWidth: "220px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {renderFilterContent()}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ColumnFilter;

