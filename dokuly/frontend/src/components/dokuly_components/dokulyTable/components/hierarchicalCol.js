import React from "react";

const HierarchicalCol = ({
  content,
  indent,
  handleToggleExpand,
  row,
  idKey,
  expandedRows,
  hasSubObject,
}) => {
  return (
    <div style={{ marginLeft: `${indent}px` }}>
      {hasSubObject && (
        <span
          style={{ cursor: "pointer", marginRight: 5, marginLeft: -25 }}
          onClick={() => handleToggleExpand(row[idKey])}
        >
          <img
            src={
              expandedRows[row[idKey]]
                ? "../../../static/icons/chevron-down.svg"
                : "../../../static/icons/chevron-right.svg"
            }
            alt={expandedRows[row[idKey]] ? "Collapse" : "Expand"}
            style={{ width: "20px", height: "20px" }}
          />
        </span>
      )}
      <span style={hasSubObject ? { fontWeight: "bold" } : {}}>{content}</span>
    </div>
  );
};

export default HierarchicalCol;
