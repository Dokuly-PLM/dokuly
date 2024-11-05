import React from "react";

export const hexColorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})\b/;

export const ColorRenderer = ({ value }) => {
    const isHexColor = hexColorRegex.test(value);
  
    if (isHexColor) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", marginLeft: "5px" }}>
          <span
            style={{
              backgroundColor: value,
              width: "15px",
              height: "15px",
              display: "inline-block",
              marginRight: "5px",
              border: "1px solid #ddd",
              borderRadius: "3px",
              verticalAlign: "middle",
            }}
          />
          {value}
        </span>
      );
    }
  
    return <span>{value}</span>;
  };
  