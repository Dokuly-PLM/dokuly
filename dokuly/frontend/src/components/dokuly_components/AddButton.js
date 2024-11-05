import React from "react";

const AddButton = ({
  buttonText,
  className,
  disabled,
  imgAlt = "plus", // Default alt text if not provided
  imgSrc = "../../static/icons/circle-plus.svg", // Default image source if not provided
  onClick,
  style, // Accepting style as a prop
  hideIcon = false,
  imgStyle = {},
}) => {
  const combinedClassName = `btn btn-bg-transparent ${className || ""}`; // Safely append className if provided

  // Combine default styles with styles provided via props
  const combinedStyle = { ...style };

  return (
    <button
      type="button"
      className={combinedClassName}
      disabled={disabled}
      style={combinedStyle} // Use the combined style object
      onClick={onClick}
    >
      <div className="row">
        {!hideIcon && (
          <img
            className="icon-dark"
            src={imgSrc} // Use the imgSrc prop, with a default fallback
            alt={imgAlt} // Use the imgAlt prop, with a default fallback
            style={imgStyle} // Use the imgStyle prop
          />
        )}
        <span className="btn-text">{buttonText}</span>
      </div>
    </button>
  );
};

export default AddButton;
