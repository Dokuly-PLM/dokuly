import React from "react";
import { Form, Row } from "react-bootstrap";

const DokulyCheckFormGroup = ({
  label,
  value,
  onChange,
  showToolTip,
  tooltipText,
  id = "",
}) => {
  return (
    <Row className="align-items-center mb-3 mx-3">
      <Form.Group className="d-flex align-items-center" style={{ flex: 1 }}>
        <Form.Check
          type="checkbox"
          className="dokuly-checkbox mr-2 me-2"
          id={id !== "" ? id : label} // Ensure the checkbox has an id
          checked={value}
          label={label}
          onChange={(e) => onChange(e.target.checked)}
        />
        {showToolTip && (
          <QuestionToolTip optionalHelpText={tooltipText} placement="right" />
        )}
      </Form.Group>
    </Row>
  );
};

export default DokulyCheckFormGroup;
