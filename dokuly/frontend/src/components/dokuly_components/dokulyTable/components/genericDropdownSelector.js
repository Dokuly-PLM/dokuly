import React, { useEffect, useState } from "react";
import Select from "react-select";
import DokulyMarkdown from "../../dokulyMarkdown/dokulyMarkdown";

const Tooltip = ({ markdownText }) => {
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
      }}
    >
      <DokulyMarkdown markdownText={markdownText} />
    </div>
  );
};

const GenericDropdownSelector = ({
  state,
  setState,
  dropdownValues,
  placeholder,
  borderIfPlaceholder = false,
  borderColor = "red",
  textSize = "14px",
  readOnly = false,
  onHoverTooltip = false, // New prop for enabling/disabling tooltip
  borderOnNoEdit = false, // New prop for border when not editing
  tooltipText = "", // New prop for tooltip text
  borderSize = "1px",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipTimeout, setTooltipTimeout] = useState(null); // State to manage the timeout
  const [selected, setSelected] = useState(null);

  const colors = {
    primary: "#165216ff", // dokuly-bg-primary
    primaryHover: "#16521699", // dokuly-bg-primary:hover
    info: "#da4678ff", // dokuly-bg-info
    success: "#165216ff",
    danger: "#B00020", // dokuly-bg-danger
    lightwhite: "#f1f1f1", // dokuly-bg-lightwhite
  };

  const iconSize = "10px";

  const handleChange = (selectedOption) => {
    setState(selectedOption.value);
    setIsEditing(false); // Exit editing mode upon selection
  };

  const isPlaceholder =
    state === placeholder ||
    !dropdownValues.some((option) => option.value === state);

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
      zIndex: 9999, // This zIndex must be high enough to overcome the modal's zIndex
    }),
  };

  const selectedLabel =
    dropdownValues.find((option) => option.value === state)?.label ||
    placeholder;

  const handleMouseEnter = (e) => {
    if (onHoverTooltip) {
      const rect = e.target.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - rect.height,
        left: rect.left,
      });

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

  useEffect(() => {
    if (dropdownValues) {
      const selectedOption = dropdownValues.find(
        (option) => option.value === state
      );
      setSelected(selectedOption);
    }
  }, [state, dropdownValues]);

  if (isEditing) {
    return (
      // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
      <div onBlur={() => setIsEditing(false)} tabIndex={0}>
        <Select
          key={selected ?? "default"}
          value={selected}
          onChange={handleChange}
          options={dropdownValues}
          placeholder={placeholder}
          menuPortalTarget={document.body}
          styles={customStyles}
          autoFocus
          menuIsOpen={true}
          menuPosition="fixed" // Ensures the menu overlays correctly
        />
      </div>
    );
  }
  const nonEditingStyle = {
    cursor: readOnly ? "default" : "pointer", // Change cursor to default if readOnly
    fontSize: textSize,
    border:
      (borderIfPlaceholder && isPlaceholder) || borderOnNoEdit
        ? `${borderSize} solid ${borderColor}`
        : "none",
    padding: "4px",
    borderRadius: "4px",
    backgroundColor: isPlaceholder ? colors.lightwhite : "transparent",
    color: isPlaceholder ? colors.dark : "black",
    position: "relative", // Needed for the tooltip position
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      onClick={() => {
        if (!readOnly) {
          setIsEditing(true);
        }
      }}
      style={nonEditingStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span>{selectedLabel}</span>
      {showTooltip && (
        <Tooltip
          markdownText={tooltipText ? tooltipText : selectedLabel}
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        />
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
};

export default GenericDropdownSelector;
