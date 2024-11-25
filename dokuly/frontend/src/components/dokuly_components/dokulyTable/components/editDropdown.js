import React, { useState, useRef } from "react";

function DokulySettingsButton({ textSize, onTextSizeChange }) {
  // Remove "px" from textSize and parse it as an integer for internal use
  const initialSize = parseInt(textSize.replace("px", ""), 10);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [inputValue, setInputValue] = useState(initialSize || 16); // Fallback to 16 if undefined
  const inputRef = useRef(null);

  const toggleDropdown = () => {
    setDropdownVisible((prev) => {
      // Reset input value to the current textSize when opening
      if (!prev) {
        setInputValue(initialSize || 16);
      }
      return !prev;
    });
  };

  const closeDropdown = () => {
    setDropdownVisible(false);
  };

  const applyChanges = () => {
    if (onTextSizeChange) {
      onTextSizeChange(`${inputValue}px`); // Add "px" to inputValue before passing it
    }
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      setInputValue(newValue);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDropdown(); // Close without updating
    } else if (e.key === "Enter") {
      applyChanges(); // Apply changes
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Settings Button */}
      <div
        className="settings-button"
        onClick={toggleDropdown}
        title="Settings"
      >
        <img
          src="../../static/icons/edit.svg"
          alt="Edit"
          className="settings-icon"
        />
      </div>

      {/* Dropdown */}
      {isDropdownVisible && (
        <div className="settings-dropdown">
          <label htmlFor="text-size-input" style={{ fontSize: "14px" }}>
            Text Size:
          </label>
          <input
            id="text-size-input"
            type="number"
            className="input-display"
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown} // Handle key events directly on the input
            style={{ width: "100%", marginTop: "8px" }}
          />
        </div>
      )}
    </div>
  );
}

export default DokulySettingsButton;
