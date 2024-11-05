import React, { useState, useEffect } from "react";

const DokulyCard = ({
  children,
  className = "card rounded m-3 p-3",
  style = { marginBottom: "20px" },
  isHidden = false,
  hiddenText = "",
  expandText = "",
  isCollapsed,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Synchronize isExpanded with isCollapsed
  useEffect(() => {
    if (isCollapsed) {
      setIsExpanded(false); // Automatically collapse the card when isCollapsed becomes true
    }
  }, [isCollapsed]); // Dependency on isCollapsed

  const toggleContainerStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  };

  const lineAfterText = {
    flex: 1,
    borderBottom: "1px solid #ccc",
    marginLeft: "10px",
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  if (isHidden) {
    return (
      <div className={`m-3`} style={toggleContainerStyle}>
        <span>{hiddenText}</span>
        {hiddenText && <div style={lineAfterText} />}
      </div>
    );
  }
  if (isCollapsed && !isExpanded) {
    return (
      <div className={`m-3`} style={toggleContainerStyle}>
        <button
          type="button"
          className={"btn btn-bg-transparent"}
          onClick={handleToggle}
        >
          <img
            src="/static/icons/circle-plus.svg"
            alt="expand"
            style={{ marginRight: "5px" }}
          />
          <span className="btn-text">{expandText}</span>
        </button>
        <div style={lineAfterText}></div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default DokulyCard;
