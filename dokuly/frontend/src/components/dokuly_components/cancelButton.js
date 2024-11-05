import React from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

// Custom CancelButton component definition
const CancelButton = ({
  disabledTooltip,
  onClick,
  disabled,
  type = "button",
  className = "",
  style = {},
  children,
  useDefaultStyles = true,
}) => {
  let combinedClassName = `${className}`.trim();
  if (useDefaultStyles) {
    combinedClassName = `${combinedClassName} dokuly-bg-danger dokuly-text-white`;
  }
  // Function to render the tooltip when the button is disabled
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {disabledTooltip}
    </Tooltip>
  );

  // Set the inline styles for the disabled button
  const disabledButtonStyles = {
    backgroundColor: "#B00020", // Using the color from dokuly-bg-danger
    borderColor: "#B00020", // Using the border color from dokuly-bg-danger
    opacity: 0.65,
    pointerEvents: "none", // Prevent interactions when disabled
  };

  // If the button is disabled, render the button with a tooltip
  return disabled ? (
    <OverlayTrigger placement="top" overlay={renderTooltip}>
      <span>
        {" "}
        {/* Span is necessary for the OverlayTrigger to function correctly */}
        <Button
          type={type}
          className={combinedClassName}
          onClick={onClick}
          disabled={true}
          style={disabledButtonStyles}
        >
          {children}
        </Button>
      </span>
    </OverlayTrigger>
  ) : (
    // If the button is not disabled, render the button without a tooltip
    <Button
      style={style}
      type={type}
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export default CancelButton;
