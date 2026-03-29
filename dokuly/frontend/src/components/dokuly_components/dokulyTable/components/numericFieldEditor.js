import React, { useState, useEffect, useRef } from "react";

const NumericFieldEditor = ({
  number,
  setNumber,
  onBlur,
  showBorder = false,
  unit = "",
  style = {},
  disabled = false,
  renderWithParentheses = false,
}) => {
  const [value, setValue] = useState(number);
  const [originalValue, setOriginalValue] = useState(number);
  const [isEditing, setIsEditing] = useState(false);
  const [isEnterPressed, setIsEnterPressed] = useState(false);
  const inputRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const newValue = number ?? 0;
    setValue(newValue);
    setOriginalValue(newValue);
  }, [number]);

  // Handle click outside to revert changes
  useEffect(() => {
    function handleClickOutside(event) {
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        // Reset to original value and exit edit mode
        setValue(originalValue);
        setIsEditing(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editorRef, originalValue]);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setIsEnterPressed(true);
      // Don't save yet - wait for keyup
    } else if (event.key === "Escape") {
      setValue(originalValue);
      setIsEditing(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === "Enter" && isEnterPressed) {
      setIsEnterPressed(false);
      const parsedValue = parseFloat(value) || 0;
      setNumber(parsedValue);
      setOriginalValue(parsedValue);
      onBlur && onBlur();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    // Reset to original value instead of saving
    setValue(originalValue);
    setIsEditing(false);
  };

  const handleFocus = (event) => {
    event.target.select();
  };

  const inputStyle = {
    width: "100%",
    paddingLeft: "5px",
    paddingBottom: "5px",
    paddingTop: "0px",
    paddingRight: "5px",
    border: `1px solid`,
    outline: "none",
    borderRadius: "4px",
  };

  if (isEditing) {
    return (
      <div ref={editorRef} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <input
          className="input-edit"
          ref={inputRef}
          type="number"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={handleBlur}
          onFocus={handleFocus}
          style={inputStyle}
          title="Press Enter to submit, Escape to cancel"
          autoFocus
        />
        <span className={`enter-key-indicator ${isEnterPressed ? 'pressed' : ''}`}>↵</span>
      </div>
    );
  } else {
    return (
      <div
        ref={editorRef}
        className="bom-editable-field"
        onClick={() => {
          if (disabled) return;
          setIsEditing(true);
          setTimeout(() => {
            inputRef.current && inputRef.current.focus();
          }, 0);
        }}
        style={{
          cursor: !disabled ? "pointer" : "default",
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          paddingLeft: "5px",
          paddingBottom: "5px",
          paddingTop: "0px",
          paddingRight: "5px",
          borderRadius: "4px",
          // Let CSS class handle border, only override if showBorder is explicitly true
          ...(showBorder && { border: `1px solid rgba(0, 0, 0, 0.2) !important` }),
          ...style,
        }}
      >
        <span>
          {renderWithParentheses ? `(${originalValue} ${unit})` : `${originalValue} ${unit}`}
        </span>
        {!disabled && (
          <img 
            src="../../static/icons/edit.svg" 
            alt="edit"
            className="icon-dark bom-edit-icon"
          />
        )}
      </div>
    );
  }
};

export default NumericFieldEditor;
