import React from "react";

const Danger = ({
  className = "",
  width = 40,
  style = { border: "none" },
  height,
}) => {
  return (
    <img
      className={`dokuly-filter-danger ${className}`}
      src="../../../../static/icons/alert-triangle.svg"
      alt="Danger"
      width={width}
      style={style}
    />
  );
};

export default Danger;
