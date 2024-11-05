import React from "react";

export const partNumberFormatter = (cell, row) => {
  if (row?.full_part_number) {
    return row?.full_part_number + row?.revision;
  } else {
    // Default or fallback formatting
    return (
      <span>
        {row?.type || "Unknown"}
        {row?.part_number}
        {row?.revision}
      </span>
    );
  }
};