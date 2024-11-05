import React from "react";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";
import DokulyImage from "../../dokuly_components/dokulyImage";

export const thumbnailFormatter = (row) => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically (if needed)
    maxHeight: "70px", // Ensure the container has a fixed height
    width: "100%", // Use full width of the cell
  };
  if (row?.temporary_mpn === "Shipping Cost") {
    return "-";
  }
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
  if (row?.image_url !== undefined && row?.image_url !== null) {
    return (
      <div style={containerStyle}>
        <DokulyImage
          src={row?.image_url}
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
  return "";
};
