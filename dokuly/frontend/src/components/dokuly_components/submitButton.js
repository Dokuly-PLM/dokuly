import React from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

// Custom SubmitButton component definition
const SubmitButton = ({
  disabledTooltip, // Tooltip text when the button is disabled
  onClick,
  disabled,
  className,
  type = "submit",
  style = {},
  children,
}) => {
  // Function to render the tooltip when the button is disabled
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {disabledTooltip}
    </Tooltip>
  );

  // Set the inline styles for the disabled button
  const disabledButtonStyles = {
    backgroundColor: "#165216ff",
    borderColor: "#165216ff",
    opacity: 0.65,
    pointerEvents: "none",
  };

  // If the button is disabled, render the button with a tooltip
  return disabled ? (
    <OverlayTrigger placement="top" overlay={renderTooltip}>
      <span>
        <Button
          type={type}
          className={`btn dokuly-bg-primary ${className}`}
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
      className={`btn dokuly-bg-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </Button>
  );
};

export default SubmitButton;
