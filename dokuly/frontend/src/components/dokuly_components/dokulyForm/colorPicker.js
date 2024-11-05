import React from "react";
import { Form } from "react-bootstrap";

/**
 * A reusable color picker form control using React Bootstrap.
 *
 * @param {string} label - The label for the form group.
 * @param {string} value - The current value of the color input.
 * @param {Function} onChange - The function to call when the color value changes.
 * @param {string} [id] - The id for the form control, optional.
 * @param {boolean} [disabled] - Whether the input is disabled, optional.
 * @param {object} [style] - Inline styles to apply to the form group, optional.
 * @param {string} [className] - Additional class names for the form group, optional.
 */
const ColorPicker = ({
  label,
  value,
  onChange,
  id,
  disabled = false,
  style = {},
  className = "",
}) => {
  return (
    <Form.Group controlId={id} style={style} className={className}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </Form.Group>
  );
};

export default ColorPicker;
