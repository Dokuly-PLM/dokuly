import React, { useRef } from "react";
import { Dropdown } from "react-bootstrap";

const DokulyDropdown = ({
  children,
  title,
  variant = "success",
  id = "dropdown-basic",
  className,
  style,
  menuClassName,
  menuStyle,
}) => {
  const dropdownToggleRef = useRef(null);

  const closeDropdown = () => {
    dropdownToggleRef.current.click();
  };

  return (
    <Dropdown style={{ display: "inline-block" }}>
      <Dropdown.Toggle
        ref={dropdownToggleRef}
        variant={variant}
        id={id}
        className={className}
        style={style}
      >
        {title}
      </Dropdown.Toggle>
      <Dropdown.Menu
        className={menuClassName}
        style={{ ...menuStyle, overflow: "auto" }}
      >
        {typeof children === "function"
          ? children({ closeDropdown })
          : children}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default DokulyDropdown;
