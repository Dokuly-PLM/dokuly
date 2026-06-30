import React from "react";
import Select from "react-select";

const DokulySelect = ({
  options = [],
  value = null,
  onChange = () => {},
  onInputChange = () => {},
  placeholder = "",
  isClearable = false,
  components = {},
  styles = {},
  menuPortalTarget,
  menuPosition = "fixed",
  noOptionsMessage = () => "No options found.",
  onKeyDown = () => {},
  openMenuOnFocus = true,
  className = "",
  ...rest
}) => {
  // Custom styles
  const customStyles = {
    control: (styles) => ({
      ...styles,
      borderColor: "#ccc",
      boxShadow: "none",
      "&:hover": { borderColor: "#aaa" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#165216"
        : state.isFocused
          ? "rgba(22, 82, 22, 0.12)"
          : base.backgroundColor,
      color: state.isSelected ? "#ffffff" : "#212529",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999, // Ensure the menu portal has a high z-index
    }),
  };

  const mergedStyles = {
    ...customStyles,
    ...styles,
  };

  return (
    <Select
      className={className}
      value={value}
      onChange={onChange}
      onInputChange={onInputChange}
      placeholder={placeholder}
      isClearable={isClearable}
      components={components}
      styles={mergedStyles}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      noOptionsMessage={noOptionsMessage}
      onKeyDown={onKeyDown}
      openMenuOnFocus={openMenuOnFocus}
      options={options}
      {...rest} // Spread any additional props
    />
  );
};

export default DokulySelect;
