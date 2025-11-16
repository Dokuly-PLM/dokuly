import React from "react";
import { formatPartNumberWithRevision } from "../../../../utils/revisionUtils";

export const partNumberFormatter = (cell, row) => {
  if (row?.full_part_number) {
    // full_part_number already contains the properly formatted part number with revision
    return row?.full_part_number;
  } else {
    // Default or fallback formatting
    return (
      <span>
        {row?.type || "Unknown"}
        {row?.part_number}
        {row?.formatted_revision}
      </span>
    );
  }
};