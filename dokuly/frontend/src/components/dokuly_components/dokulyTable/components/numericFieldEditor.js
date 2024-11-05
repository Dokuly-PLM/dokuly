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
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(number ?? 0); // Ensure default value is 0 if null or undefined
  }, [number]);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      setNumber(parseFloat(value) || 0); // Ensure number is 0 if parseFloat fails
      onBlur && onBlur();
      setIsEditing(false);
    } else if (event.key === "Escape") {
      setValue(number);
      onBlur && onBlur();
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setNumber(parseFloat(value) || 0); // Ensure number is 0 if parseFloat fails
    onBlur && onBlur();
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
      <input
        className="input-edit"
        ref={inputRef}
        type="number"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        style={inputStyle}
        autoFocus
      />
    );
  } else {
    return (
      <div
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
          border: showBorder ? `1px solid rgba(0, 0, 0, 0.2)` : `none`,
          borderRadius: "4px",
          ...style,
        }}
      >
        {renderWithParentheses ? `(${value} ${unit})` : `${value} ${unit}`}
      </div>
    );
  }
};

export default NumericFieldEditor;
