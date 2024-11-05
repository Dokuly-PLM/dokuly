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
  const renderLabel = () => {
    return showToolTip ? (
      <Row className="align-items-center">
        <Form.Label>{label}</Form.Label>
        <QuestionToolTip optionalHelpText={tooltipText} placement="right" />
      </Row>
    ) : (
      <Form.Label>{label}</Form.Label>
    );
  };

  const renderControl = () => {
    if (as === "select") {
      return (
        <Form.Control
          as="select"
          onChange={(e) => onChange(e.target.value)}
          value={value}
        >
          {options.map((option) => (
            <>
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            </>
          ))}
        </Form.Control>
      );
    } else if (as === "check") {
      // Here we assume value is a boolean, and onChange expects a boolean
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

  if (useCustomSelect) {
    return <>{customSelectChildren()}</>;
  }

  return (
    <Form.Group key={id} className={className}>
      {as !== "check" && renderLabel()}
      {renderControl()}
    </Form.Group>
  );
};

export default DokulyFormSection;
