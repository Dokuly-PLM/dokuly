import React from "react";

const CheckBox = ({
  id,
  checked,
  onChange,
  label,
  className = "dokuly-checkbox", // Default to dokuly-checkbox for styling
  divClassName,
  style,
  ...props
}) => {
  const classes = `form-check-input ${className || ""}`;
  const divClasses = `form-check ${divClassName || ""}`;
  return (
    <div className={divClasses}>
      <input
        type="checkbox"
        className={classes}
        id={id}
        checked={checked}
        onChange={onChange}
        style={style}
        {...props} // Spread any additional props
      />
      {label && (
        <label className="form-check-label" htmlFor={id}>
          {label}
        </label>
      )}
    </div>
  );
};

export default CheckBox;