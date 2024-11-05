// SearchButton.jsx

import React from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

const SearchButton = ({
  disabledTooltip = "Please fill in the required fields.", // Default tooltip text when the button is disabled
  onClick,
  disabled,
  type = "button", // Default type is "button"
  className = "dokuly-bg-primary", // Default button style is primary
  children = "Search", // Default button text is "Search"
}) => {
  // Function to render the tooltip when the button is disabled
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {disabledTooltip}
    </Tooltip>
  );

  // Set the inline styles for the disabled button
  const disabledButtonStyles = {
    backgroundColor: "#ccc",
    borderColor: "#ccc",
    opacity: 0.65,
    pointerEvents: "none",
  };

  // If the button is disabled, render the button with a tooltip
  return disabled ? (
    <OverlayTrigger placement="top" overlay={renderTooltip}>
      <span>
        <Button
          type={type}
          className={className}
          onClick={onClick}
          disabled={disabled}
          style={disabledButtonStyles}
        >
          {children}
        </Button>
      </span>
    </OverlayTrigger>
  ) : (
    // If the button is not disabled, render the button without a tooltip
    <Button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export default SearchButton;
