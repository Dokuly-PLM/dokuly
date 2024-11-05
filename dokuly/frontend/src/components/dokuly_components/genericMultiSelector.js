import React, { useState } from "react";
import Select from "react-select";
import DokulyMarkdown from "./dokulyMarkdown/dokulyMarkdown";

const Tooltip = ({ markdownText, position }) => {
  if (!markdownText) return null;

  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "white",
        border: "1px solid #ddd",
        padding: "10px",
        borderRadius: "4px",
        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        whiteSpace: "nowrap",
        top: position.top,
        left: position.left,
      }}
    >
      <DokulyMarkdown markdownText={markdownText} />
    </div>
  );
};

const GenericMultiSelector = ({
  state,
  setState,
  dropdownValues,
  placeholder,
  maxDropdownTextLen = 55,
  borderIfPlaceholder = false,
  borderColor = "red",
  textSize = "14px",
  readOnly = false,
  onHoverTooltip = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipTimeout, setTooltipTimeout] = useState(null);

  const colors = {
    primary: "#165216ff",
    primaryHover: "#16521699",
    info: "#da4678ff",
    success: "#165216ff",
    danger: "#B00020",
    lightwhite: "#f1f1f1",
  };

  const iconSize = "10px";

  const handleChange = (selectedOptions) => {
    const values = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    setState(values);
    setIsEditing(false);
  };

  const isPlaceholder =
    state.length === 0 ||
    state.every(
      (value) => !dropdownValues.some((option) => option.value === value),
    );

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      fontSize: textSize,
      backgroundColor: colors.lightwhite,
      borderColor: state.isFocused
        ? colors.primary
        : isPlaceholder
          ? borderColor
          : "transparent",
      boxShadow: state.isFocused ? `0 0 0 1px ${colors.primary}` : "none",
      "&:hover": {
        borderColor: state.isFocused ? colors.primary : colors.info,
      },
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: textSize,
      backgroundColor: state.isSelected
        ? colors.success
        : state.isFocused
          ? colors.primaryHover
          : null,
      color: state.isSelected
        ? colors.lightwhite
        : state.isFocused
          ? colors.lightwhite
          : "black",
      "&:active": {
        backgroundColor: colors.success,
      },
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: textSize,
      backgroundColor: colors.lightwhite,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  const selectedLabels = state
    .map(
      (value) => dropdownValues.find((option) => option.value === value)?.label,
    )
    .filter((label) => label);

  const handleMouseEnter = (e, label) => {
    if (onHoverTooltip) {
      const rect = e.target.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - rect.height,
        left: rect.left,
      });
      setTooltipContent(label);

      const timeout = setTimeout(() => {
        setShowTooltip(true);
      }, 500);
      setTooltipTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    if (onHoverTooltip) {
      clearTimeout(tooltipTimeout);
      setShowTooltip(false);
    }
  };

  if (isEditing) {
    return (
      <div onBlur={() => setIsEditing(false)} tabIndex={0}>
        <Select
          isMulti
          value={dropdownValues.filter((option) =>
            state.includes(option.value),
          )}
          onChange={handleChange}
          options={dropdownValues}
          placeholder={placeholder}
          menuPortalTarget={document.body}
          styles={customStyles}
          autoFocus
          menuIsOpen={true}
          menuPosition="fixed"
        />
      </div>
    );
  } else {
    const nonEditingStyle = {
      cursor: readOnly ? "default" : "pointer",
      fontSize: textSize,
      border:
        borderIfPlaceholder && isPlaceholder
          ? `1px solid ${borderColor}`
          : "none",
      padding: "4px",
      borderRadius: "4px",
      backgroundColor: isPlaceholder ? colors.lightwhite : "transparent",
      color: isPlaceholder ? colors.dark : "black",
      position: "relative",
    };

    return (
      <div
        onClick={() => {
          if (!readOnly) {
            setIsEditing(true);
          }
        }}
        style={nonEditingStyle}
      >
        {selectedLabels.length > 0
          ? selectedLabels.map((label, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#f0f0f0",
                  borderRadius: "5px",
                  padding: "4px 8px",
                  margin: "4px 0",
                }}
                onMouseEnter={(e) => handleMouseEnter(e, label)}
                onMouseLeave={handleMouseLeave}
              >
                {label.length > maxDropdownTextLen
                  ? label.substring(0, maxDropdownTextLen) + "..."
                  : label}
              </div>
            ))
          : placeholder}
        {showTooltip && (
          <Tooltip markdownText={tooltipContent} position={tooltipPosition} />
        )}
        {!readOnly && (
          <img
            src="/static/icons/chevron-down.svg"
            alt="Open dropdown"
            style={{ width: iconSize, marginLeft: "5px" }}
          />
        )}
      </div>
    );
  }
};

export default GenericMultiSelector;
