import React from "react";

const NavigateButton = ({
  onNavigateClick,
  disabled = false,
  imgAlt = "Navigate",
  imgSrc = "/static/icons/arrow-right.svg",
  imageSize = "17px",
  imgOpacity = 0.5,
  tooltip = "Navigate",
}) => {
  return (
    <button
      type="button"
      className={"btn btn-bg-transparent"}
      disabled={disabled}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",

        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onNavigateClick}
      title={tooltip}
    >
      <img
        src={imgSrc}
        alt={imgAlt}
        style={{
          width: imageSize,
          opacity: imgOpacity,
          transition: "opacity 0.3s",
        }}
      />
    </button>
  );
};

export default NavigateButton;
