import React from "react";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";
import DokulyImage from "../../dokuly_components/dokulyImage";

export const numberFormatter = (row) => {
  if (row !== undefined && row != null) {
    // full_part_number already contains the properly formatted part number with revision
    return row?.full_part_number;
  }
  return row?.full_part_number;
};

export const thumbnailFormatter = (row) => {
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
          lazy={true}
          defaultSrc=""
          style={{
            maxWidth: "70px",
            maxHeight: "70px",
            objectFit: "contain",
            display: "block",
            margin: "auto",
          }}
        />
      </div>
    );
  }
  if (row?.image_url !== undefined && row?.image_url !== null) {
    return (
      <div style={containerStyle}>
        <DokulyImage
          src={row?.image_url}
          alt="Thumbnail"
          lazy={true}
          defaultSrc=""
          style={{
            maxWidth: "70px",
            maxHeight: "70px",
            objectFit: "contain",
            display: "block",
            margin: "auto",
          }}
        />
      </div>
    );
  }
  if(row?.part_type?.icon_url) {
    return (
      <div style={containerStyle}>
        <img 
          src={row?.part_type?.icon_url} 
          alt="icon" 
          loading="lazy"
          style={{
            maxWidth: "70px",
            maxHeight: "70px",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }
  return "";
};
