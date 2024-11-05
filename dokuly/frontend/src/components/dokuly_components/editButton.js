import React from "react";

const EditButton = ({
  buttonText = "Edit",
  onClick,
  disabled = false,
  classNameExtension = "",
  imgAlt = "edit",
  imgSrc = "../../static/icons/edit.svg",
  textSize = "16px",
  iconSize = "20px",
}) => {
  const combinedClassName = `btn btn-bg-transparent ${classNameExtension}`;
  const buttonStyle = {
    cursor: disabled ? "not-allowed" : "pointer",
  };

  const textStyle = {
    fontSize: textSize,
  };

  const iconStyle = {
    width: iconSize,
    height: iconSize,
  };

  return (
    <button
      type="button"
      className={combinedClassName}
      disabled={disabled}
      style={buttonStyle}
      onClick={onClick}
    >
      <div className="row align-items-center">
        <img
          className="icon-dark"
          src={imgSrc}
          alt={imgAlt}
          style={iconStyle}
        />
        <span className="btn-text" style={textStyle}>
          {buttonText}
        </span>
      </div>
    </button>
  );
};

export default EditButton;
