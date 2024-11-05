import React from "react";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";
import DokulyImage from "../../dokuly_components/dokulyImage";

export const numberFormatter = (cell, row) => {
  if (row !== undefined && row != null) {
    return `${row?.full_part_number}${row?.revision}`;
  }
  return row?.full_part_number;
};

export const imageFormatter = (cell, row, partTypes) => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically (if needed)
    maxHeight: "70px", // Ensure the container has a fixed height
    width: "100%", // Use full width of the cell
  };

  if (row?.thumbnail !== undefined && row?.thumbnail !== null) {
    return (
      <div style={containerStyle}>
        <DokulyImage
          src={formatCloudImageUri(row?.thumbnail)}
          alt="Thumbnail"
          style={{
            maxWidth: "70px",
            maxHeight: "70px",
            objectFit: "contain",
            display: "block",
            margin: "auto",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = ""; // set default image to no image
          }}
        />
      </div>
    );
  }

  if (row?.image_url !== "" && row?.image_url !== null) {
    return (
      <div style={containerStyle}>
        <img
          className="rounded float-left"
          width="40px"
          height="40px"
          alt="Part Image"
          src={row.image_url}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = ""; // set default image to no image
          }}
        />
      </div>
    );
  } else if (partTypes !== undefined && partTypes != null) {
    const partType = partTypes.find((type) => type.id === row.part_type);
    if (
      partType !== undefined &&
      partType != null &&
      partType.icon_url !== "" &&
      partType.icon_url !== null
    ) {
      return (
        <div style={containerStyle}>
          <img
            src={partType.icon_url}
            alt="icon"
            title={partType.description || ""}
          />
        </div>
      );
    }
  }
  return "";
};
