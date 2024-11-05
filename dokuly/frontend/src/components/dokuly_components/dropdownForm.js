import React from "react";
import { Container, Row } from "react-bootstrap";

const DropdownForm = ({ title, items, onClick, style, keys, children }) => {
  return (
    <Container style={style}>
      <h5>{title}</h5>
      <ul className="list-group">
        {items.map((item, index) => {
          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: No need for button here
            <li
              key={item?.id ? item.id : index}
              className="list-group-item"
              onClick={() => onClick(item)}
            >
              <Row className="align-items-center">
                <span className="ml-2">
                  {keys.map((key) => item[key]).join(", ")}
                </span>
                {children}
              </Row>
            </li>
          );
        })}
      </ul>
    </Container>
  );
};

export default DropdownForm;
