import React from "react";

const CloseIssueButton = ({ handleClick, children, className = "" }) => {
  return (
    <button
      style={{ maxHeight: "35px", borderRadius: "10px" }}
      className={`btn btn-sm dokuly-btn-primary ${className}`}
      type="button"
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default CloseIssueButton;
