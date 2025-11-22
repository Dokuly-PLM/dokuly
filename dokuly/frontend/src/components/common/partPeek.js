import React from "react";
import DokulyImage from "../dokuly_components/dokulyImage";
import { formatCloudImageUri } from "../pcbas/functions/productionHelpers";

/**
 * PartPeek - A reusable tooltip card component that displays item details on hover
 * 
 * @param {Object} item - The item object (part, pcba, or assembly)
 * @param {string} item.id - Item ID
 * @param {string} item.thumbnail - Thumbnail ID (for cloud images)
 * @param {string} item.image_url - Direct image URL (fallback)
 * @param {string} item.full_part_number - Full part number
 * @param {string} item.display_name - Display name
 * @param {string} type - Type of item: "part", "pcba", or "assembly" (default: "part")
 * @param {Object} style - Additional styles to apply to the container
 * @param {string} position - Position of the tooltip: "top", "bottom", "left", "right" (default: "bottom")
 */
const PartPeek = ({ 
  item, 
  type = "part", 
  style = {}, 
  position = "bottom" 
}) => {
  if (!item) return null;

  const getPositionStyles = () => {
    const baseStyles = {
      position: "absolute",
      backgroundColor: "white",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      zIndex: 1000,
      minWidth: "250px",
      maxWidth: "350px",
    };

    switch (position) {
      case "top":
        return {
          ...baseStyles,
          bottom: "calc(100% + 5px)",
          left: "0",
        };
      case "left":
        return {
          ...baseStyles,
          right: "calc(100% + 5px)",
          top: "0",
        };
      case "right":
        return {
          ...baseStyles,
          left: "calc(100% + 5px)",
          top: "0",
        };
      case "bottom":
      default:
        return {
          ...baseStyles,
          top: "calc(100% + 5px)",
          left: "0",
        };
    }
  };

  return (
    <div style={{ ...getPositionStyles(), ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Thumbnail */}
        <div
          style={{
            flex: "0 0 50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            maxHeight: "50px",
          }}
        >
          {(item.thumbnail || item.image_url) ? (
            <DokulyImage
              src={
                item.thumbnail
                  ? formatCloudImageUri(item.thumbnail)
                  : item.image_url
              }
              alt="Thumbnail"
              style={{
                maxWidth: "50px",
                maxHeight: "50px",
                objectFit: "contain",
                display: "block",
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "";
              }}
            />
          ) : null}
        </div>

        {/* Item info */}
        <div
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            fontSize: "12px",
          }}
        >
          <div
            style={{
              fontWeight: "600",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.full_part_number || item.full_doc_number || "-"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.display_name || "-"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartPeek;
