import React, { useRef } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useDrag, useDrop } from "react-dnd";
import ReactMarkdown from "react-markdown";
import ColumnFilter from "./columnFilter";

const DraggableHeader = ({
  column,
  index,
  moveColumn,
  handleHeaderClick,
  sortedColumn,
  sortOrder,
  filterValue,
  onFilterChange,
  tableData,
  textSize,
  showColumnFilters = false,
}) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: "COLUMN",
    item: () => ({ type: "COLUMN", index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop && item.index !== index) {
        // Reset if dropped outside
        moveColumn(item.index, item.index);
      }
    },
  });

  const [{ isOver }, drop] = useDrop({
    accept: "COLUMN",
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      
      const draggedIndex = item.index;
      const hoveredIndex = index;
      
      // Don't replace items with themselves
      if (draggedIndex === hoveredIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // Only perform the move when the mouse has crossed half of the items width
      // Dragging right
      if (draggedIndex < hoveredIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      
      // Dragging left
      if (draggedIndex > hoveredIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      // Time to actually perform the action
      moveColumn(draggedIndex, hoveredIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoveredIndex;
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
          opacity: isDragging ? 0.4 : isOver ? 0.8 : 1,
          maxWidth: column.maxWidth ? column.maxWidth : "auto",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: isDragging ? "grabbing" : "grab",
          position: "relative",
          transition: isDragging ? "none" : "opacity 0.2s ease",
          backgroundColor: isOver && !isDragging ? "rgba(0, 0, 0, 0.05)" : "transparent",
        }}
      >
        <div className="d-flex align-items-center">
          <span>
            {typeof column.header === "function" ? column.header() : column.header}
          </span>
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
          {showColumnFilters && column.filterable !== false && (
            <ColumnFilter
              column={column}
              filterValue={filterValue}
              onFilterChange={onFilterChange}
              data={tableData}
              textSize={textSize}
            />
          )}
        </div>
      </th>
    </OverlayTrigger>
  );
};

export default DraggableHeader;
