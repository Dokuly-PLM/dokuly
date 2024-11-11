import React from "react";
import { Form, Row } from "react-bootstrap";
import QuestionToolTip from "../questionToolTip";
import Select, { components } from "react-select";

const DokulyFormSection = ({
  onChange,
  options = [],
  as = "input",
  id = "",
  label = "",
  value = "",
  showToolTip = false,
  tooltipText = "",
  placeholder = "",
  className = "",
  style = {},
  useCustomSelect = false,
  disabled = false,
  onKeyDown = () => {},
  customSelectChildren = () => {},
}) => {
  // Render the label with tooltip for alignment consistency across all input types
  const renderLabel = () => {
    return (
      <Form.Group className="d-flex align-items-center mb-1">
        <Form.Label className="mb-0" style={{ marginRight: "5px" }}>
          {label}
        </Form.Label>
        {showToolTip && (
          <QuestionToolTip optionalHelpText={tooltipText} placement="right" />
        )}
      </Form.Group>
    );
  };

  // Render the appropriate control based on the "as" prop
  const renderControl = () => {
    if (as === "select") {
      return (
        <Form.Control
          as="select"
          onChange={(e) => onChange(e.target.value)}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Control>
      );
    } else if (as === "check") {
      // Checkbox control with tooltip alignment handled directly in this block
      return (
        <Row className="align-items-center mb-3 mx-3">
          <Form.Group className="d-flex align-items-center" style={{ flex: 1 }}>
            <Form.Check
              type="checkbox"
              className="dokuly-checkbox mr-2 me-2"
              id={label} // Ensure the checkbox has an id
              checked={value}
              label={label}
              onChange={(e) => onChange(e.target.checked)}
            />
            {showToolTip && (
              <QuestionToolTip
                optionalHelpText={tooltipText}
                placement="right"
              />
            )}
          </Form.Group>
        </Row>
      );
    } else {
      // Default text field or other control
      return (
        <Form.Control
          as={as}
          id={label}
          onChange={(e) => onChange(e.target.value)}
          value={value}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          style={style}
          disabled={disabled}
        />
      );
    }
  };

  // Render custom select if specified
  if (useCustomSelect) {
    return <>{customSelectChildren()}</>;
  }

  return (
    <Form.Group key={id} className={className}>
      {as !== "check" && renderLabel()} {/* Render label for non-checkbox fields */}
      {renderControl()}
    </Form.Group>
  );
};

export default DokulyFormSection;
