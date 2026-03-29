import React from "react";

const DeleteButton = ({
  onDelete,
  buttonText = "Delete",
  className = "",
  fontSize = "16px",
  iconWidth = "30px",
  style = {},
  invertColors = false,
  noFlexClass = false,
}) => {
  const combinedClassName = `btn btn-bg-transparent ${className}`;
  const buttonStyle = {
    cursor: "pointer",
    ...style,
  };

  const textStyle = {
    fontSize: fontSize,
  };

  const iconStyle = {
    width: iconWidth,
    height: iconWidth,
    filter: invertColors ? "invert(1)" : "invert(0)",
  };

  return (
    <button
      type="button"
      className={combinedClassName}
      style={buttonStyle}
      onClick={onDelete}
    >
      <div className={noFlexClass ? "" : "row align-items-center"}>
        <img
          className="icon-dark"
          src={"../../static/icons/trash.svg"}
          alt="Delete Icon"
          style={iconStyle}
        />
        <span className="btn-text" style={textStyle}>
          {buttonText}
        </span>
      </div>
    </button>
  );
};

export default DeleteButton;
