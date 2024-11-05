import React from "react";
import "./FloatingHelpButton.css";

const FloatingHelpButton = () => {
  return (
    <button
      className="floating-button"
      onClick={() => window.open("https://dokuly.com/#/help", "_blank")}
    >
      ?
    </button>
  );
};

export default FloatingHelpButton;
