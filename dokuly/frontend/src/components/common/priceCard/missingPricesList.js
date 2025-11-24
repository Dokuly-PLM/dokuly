import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PartPeek from "../partPeek";
import DokulyImage from "../../dokuly_components/dokulyImage";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";

const MissingPricesList = ({ parts, textSize = "12px", show, style = {} }) => {
  const [hoveredPartId, setHoveredPartId] = useState(null);
  const navigate = useNavigate();

  if (!show || !parts || parts.length === 0) {
    return null;
  }

  const handlePartClick = (part) => {
    if (part && part.id) {
      navigate(`/parts/${part.id}`);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        zIndex: 1050,
        minWidth: "300px",
        maxWidth: "400px",
        ...style,
      }}
    >
      <div 
        style={{ 
          padding: "10px",
          borderBottom: "1px solid #dee2e6",
          backgroundColor: "white",
          borderTopLeftRadius: "4px",
          borderTopRightRadius: "4px",
        }}
      >
        <strong style={{ fontSize: textSize }}>
          {parts.length} component{parts.length !== 1 ? 's' : ''} missing price
        </strong>
      </div>
      <div style={{ maxHeight: "350px", overflowY: "auto", padding: "8px" }}>
        {parts.map((part) => {
          const isHovered = hoveredPartId === part.id;
          return (
            <div
              key={part.id}
              className="card mb-2"
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: isHovered ? "1px solid #165216" : "1px solid #ddd",
                position: "relative",
                backgroundColor: isHovered ? "#f8fff8" : "white",
                boxShadow: isHovered ? "0 0 8px rgba(22, 82, 22, 0.3)" : "none",
              }}
              onMouseEnter={() => setHoveredPartId(part.id)}
              onMouseLeave={() => setHoveredPartId(null)}
              onClick={() => handlePartClick(part)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handlePartClick(part);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Navigate to ${part.full_part_number || 'part'}`}
            >
            <div className="card-body p-2">
              <div className="d-flex align-items-center justify-content-between">
                {/* Thumbnail */}
                <div
                  style={{
                    flex: "0 0 40px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: "10px",
                  }}
                >
                  {(part.thumbnail || part.image_url) ? (
                    <DokulyImage
                      src={
                        part.thumbnail
                          ? formatCloudImageUri(part.thumbnail)
                          : part.image_url
                      }
                      alt="Thumbnail"
                      style={{
                        maxWidth: "40px",
                        maxHeight: "40px",
                        objectFit: "contain",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "#999" }}>N/A</span>
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: textSize,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {part.full_part_number || "-"}
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
                    {part.display_name || "-"}
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
        })}
      </div>
    </div>
  );
};

export default MissingPricesList;
