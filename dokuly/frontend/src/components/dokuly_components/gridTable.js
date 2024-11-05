import React from "react";
import { Col, Row } from "react-bootstrap";

const GridTable = ({
  rows,
  cols,
  items,
  rowClassName,
  rowStyle,
  colClassName,
  colStyle,
  onSelect,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: No id to use for key
        <Row key={rowIndex} className={rowClassName} style={rowStyle}>
          {Array.from({ length: cols }).map((_, colIndex) => {
            const itemIndex = rowIndex * cols + colIndex;
            return itemIndex < items.length ? (
              <Col
                // biome-ignore lint/suspicious/noArrayIndexKey: No id to use for key
                key={colIndex}
                className={colClassName}
                onClick={() => onSelect(items[itemIndex])}
                style={{
                  cursor: "pointer",
                  padding: "5px",
                  ...colStyle,
                }}
              >
                {items[itemIndex]}
              </Col>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: No id to use for key
              <Col key={colIndex} className={colClassName} />
            );
          })}
        </Row>
      ))}
    </>
  );
};

export default GridTable;
