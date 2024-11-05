import React, { useRef } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useDrag, useDrop } from "react-dnd";
import ReactMarkdown from "react-markdown";

const DraggableHeader = ({
  column,
  index,
  moveColumn,
  handleHeaderClick,
  sortedColumn,
  sortOrder,
}) => {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: "COLUMN",
    item: { type: "COLUMN", index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const { index: originalIndex } = item;
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        moveColumn(originalIndex, originalIndex);
      }
    },
  });

  const [, drop] = useDrop({
    accept: "COLUMN",
    hover(item) {
      const draggedIndex = item.index;
      const hoveredIndex = index;
      if (draggedIndex !== hoveredIndex) {
        moveColumn(draggedIndex, hoveredIndex);
        item.index = hoveredIndex; // Update the item index for continuous reordering
      }
    },
  });

  drag(drop(ref));

  const tooltipContent = (
    <Tooltip>
      <ReactMarkdown className="tooltip-content">
        {column?.headerTooltip && column?.headerTooltip !== ""
          ? column.headerTooltip
          : column.header}
      </ReactMarkdown>
    </Tooltip>
  );

  return (
    <OverlayTrigger
      placement={"top"}
      delay={{ show: 500, hide: 400 }}
      overlay={tooltipContent}
    >
      <th
        ref={ref}
        key={column.key}
        onClick={() => handleHeaderClick(column)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Space") {
            e.preventDefault();
            handleHeaderClick(column);
          }
        }}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
        tabIndex={0}
        style={{
          opacity: isDragging ? 0.5 : 1,
          maxWidth: column.maxWidth ? column.maxWidth : "auto",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        {typeof column.header === "function" ? column.header() : column.header}
        {sortedColumn === column && (
          <span style={{ marginLeft: "5px" }}>
            {sortOrder === "asc" ? (
              <img src="../../../static/icons/arrow-up.svg" alt="Arrow Up" />
            ) : (
              <img
                src="../../../static/icons/arrow-down.svg"
                alt="Arrow Down"
              />
            )}
          </span>
        )}
      </th>
    </OverlayTrigger>
  );
};

export default DraggableHeader;
