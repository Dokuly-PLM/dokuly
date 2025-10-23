import React, { useRef } from "react";
import { Dropdown } from "react-bootstrap";

const DokulyDropdown = ({
  children,
  title,
  variant = "outline-secondary",
  id = "dropdown-basic",
  className = "",
  style,
  menuClassName,
  menuStyle,
  disabled = false,
}) => {
  const dropdownToggleRef = useRef(null);

  const closeDropdown = () => {
    dropdownToggleRef.current.click();
  };

  // Custom styling to match Bootstrap Form.Select with Dokuly green colors
  const toggleStyle = {
    width: "100%",
    textAlign: "left",
    backgroundColor: disabled ? "#e9ecef" : "#fff",
    border: "1px solid #ced4da",
    borderRadius: "0.375rem",
    padding: "0.375rem 2.25rem 0.375rem 0.75rem",
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "1.5",
    color: disabled ? "#6c757d" : "#212529",
    boxShadow: "none",
    outline: "none",
    transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
    ...style,
  };

  const toggleClassName = `form-select-like ${className}`.trim();
  const finalMenuClassName = `dokuly-dropdown-menu ${menuClassName || ''}`.trim();

  return (
    <Dropdown style={{ width: "100%" }}>
      <Dropdown.Toggle
        ref={dropdownToggleRef}
        variant={variant}
        id={id}
        className={toggleClassName}
        style={toggleStyle}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.target.style.borderColor = "#165216ff";
            e.target.style.boxShadow = "0 0 0 0.25rem rgba(22, 82, 22, 0.25)";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.target.style.borderColor = "#ced4da";
            e.target.style.boxShadow = "none";
          }
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = "#165216ff";
            e.target.style.boxShadow = "0 0 0 0.25rem rgba(22, 82, 22, 0.25)";
          }
        }}
        onBlur={(e) => {
          if (!disabled) {
            e.target.style.borderColor = "#ced4da";
            e.target.style.boxShadow = "none";
          }
        }}
      >
        {title}
      </Dropdown.Toggle>
      <Dropdown.Menu
        className={finalMenuClassName}
        style={{ 
          ...menuStyle, 
          overflow: "auto",
          width: "100%",
          minWidth: "100%",
          border: "1px solid #165216ff",
          borderRadius: "0.375rem",
          boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)"
        }}
      >
        {typeof children === "function"
          ? children({ closeDropdown })
          : children}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default DokulyDropdown;
