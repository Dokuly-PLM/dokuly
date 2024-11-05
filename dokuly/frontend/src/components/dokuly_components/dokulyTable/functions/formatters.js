import React from "react";
import { formatCloudImageUri } from "../../../common/functions";
import DokulyImage from "../../dokulyImage";

export function ThumbnailFormatter({ thumbnail }) {
  const containerStyle = {
    display: "flex",
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically (if needed)
    maxHeight: "70px", // Ensure the container has a fixed height
    width: "100%", // Use full width of the cell
  };

  const imageStyle = {
    maxWidth: "70px",
    maxHeight: "70px",
    objectFit: "contain",
    display: "block",
    margin: "auto",
  };

  if (!thumbnail) {
    return <div style={{ ...containerStyle, height: "30px" }} />;
  }

  return (
    <div style={containerStyle}>
      <DokulyImage
        src={formatCloudImageUri(thumbnail)}
        alt="Thumbnail"
        style={imageStyle}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = ""; // set default image to no image
        }}
      />
    </div>
  );
}
