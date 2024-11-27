import React from "react";
import { Button } from "react-bootstrap";

const TransparentButton = ({
  onClick,
  buttonText = "Button",
  className = "",
  fontSize = "16px",
  iconWidth = "30px",
  imgSrc = "../../static/icons/circle-plus.svg",
  style = {},
  invertColors = false,
  noFlexClass = false,
}) => {
  // Determine styles based on the invertColors prop
  const textColor = invertColors ? "text-white" : "text-black";
  const iconFilter = invertColors ? "invert(1)" : "invert(0)";

  const combinedClass = noFlexClass ? "" : "d-flex align-items-center";

  return (
    <Button
      variant="bg-transparent ml-2"
      onClick={onClick}
      className={`${combinedClass} ${className}`}
      style={style}
    >
      <img
        className="icon-dark"
        src={imgSrc}
        alt="Button Icon"
        style={{
          width: iconWidth,
          height: iconWidth,
          filter: iconFilter,
        }}
      />
      <span
        className={`btn-text ml-2 ${textColor}`}
        style={{ fontSize: fontSize }}
      >
        {buttonText}
      </span>
    </Button>
  );
};

export default TransparentButton;
