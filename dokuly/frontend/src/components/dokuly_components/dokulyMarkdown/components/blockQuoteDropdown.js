import React from "react";
import { Dropdown } from "react-bootstrap";

// Define blockquote styles available
const blockquoteOptions = {
  Warning: {
    value: "> !WARNING ",
    icon: (
      <img
        className="dokuly-filter-warning"
        src="../../../../../static/icons/exclamation-lg.svg"
        alt="Warning"
        width={40}
        style={{ border: "none" }}
      />
    ),
  },
  Danger: {
    value: "> !DANGER ",
    icon: (
      <img
        className="dokuly-filter-danger"
        src="../../../../../static/icons/alert-triangle.svg"
        alt="Danger"
        width={40}
        style={{ border: "none" }}
      />
    ),
  },
  Info: {
    value: "> !INFO ",
    icon: (
      <img
        className="dokuly-filter-blue"
        src="../../../../../static/icons/info-lg.svg"
        alt="Info"
        width={40}
        style={{ border: "none" }}
      />
    ),
  },
  Quote: {
    value: "> !QUOTE ",
    icon: (
      <img
        className="dokuly-filter-black"
        src="../../../../../static/icons/quote.svg"
        alt="Quote"
        width={40}
        style={{ border: "none" }}
      />
    ),
  },
};

const BlockquoteDropdown = ({ onSelect }) => (
  <Dropdown as="span">
    <Dropdown.Toggle variant="btn-tg-transparent" id="dropdown-basic">
      Blockquote
    </Dropdown.Toggle>

    <Dropdown.Menu>
      {Object.entries(blockquoteOptions).map(
        ([key, { icon, value, label }]) => (
          <Dropdown.Item key={key} onClick={() => onSelect(value)}>
            {icon}
            {key}
          </Dropdown.Item>
        )
      )}
    </Dropdown.Menu>
  </Dropdown>
);

export default BlockquoteDropdown;
