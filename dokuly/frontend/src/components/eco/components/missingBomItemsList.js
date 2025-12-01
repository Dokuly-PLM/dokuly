import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DokulyImage from "../../dokuly_components/dokulyImage";
import { releaseStateFormatterNoObject } from "../../dokuly_components/formatters/releaseStateFormatter";

const MissingBomItemsList = ({ items, textSize = "12px", show, style = {} }) => {
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const navigate = useNavigate();

  if (!show || !items || items.length === 0) {
    return null;
  }

  const handleItemClick = (item) => {
    if (item && item.id) {
      const typeToRoute = {
        'Part': 'parts',
        'PCBA': 'pcbas',
        'Assembly': 'assemblies',
      };
      const route = typeToRoute[item.type];
      if (route) {
        navigate(`/${route}/${item.id}`);
      }
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 1050,
        paddingTop: "5px", // Small gap but keeps hover continuity
        ...style,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid #ddd",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          minWidth: "350px",
          maxWidth: "450px",
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
          {items.length} BOM item{items.length !== 1 ? 's' : ''} not in ECO
        </strong>
        <div style={{ fontSize: "11px", color: "#666" }}>
          These items are unreleased BOM items of affected Assemblies/PCBAs
        </div>
      </div>
      <div style={{ maxHeight: "350px", overflowY: "auto", padding: "8px" }}>
        {items.map((item, index) => {
          const itemKey = `${item.type}-${item.id}`;
          const isHovered = hoveredItemId === itemKey;
          return (
            <div
              key={itemKey}
              className="card mb-2"
              style={{
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: isHovered ? "1px solid #165216" : "1px solid #ddd",
                position: "relative",
                backgroundColor: isHovered ? "#f8fff8" : "white",
                boxShadow: isHovered ? "0 0 8px rgba(22, 82, 22, 0.3)" : "none",
              }}
              onMouseEnter={() => setHoveredItemId(itemKey)}
              onMouseLeave={() => setHoveredItemId(null)}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleItemClick(item);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Navigate to ${item.full_part_number || 'item'}`}
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
                    {item.thumbnail_id ? (
                      <DokulyImage
                        src={`/api/files/images/download/${item.thumbnail_id}/`}
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
                    <div className="d-flex align-items-center">
                      <span
                        className="badge badge-sm me-2"
                        style={{ 
                          backgroundColor: item.type === 'Part' ? '#6c757d' : item.type === 'PCBA' ? '#17a2b8' : '#28a745',
                          color: 'white',
                          fontSize: '10px',
                          marginRight: '6px',
                        }}
                      >
                        {item.type}
                      </span>
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: textSize,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.full_part_number || "-"}
                      </span>
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
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#999",
                        marginTop: "2px",
                      }}
                    >
                      {releaseStateFormatterNoObject(item.release_state)} • BOM of {item.parent_type}: {item.parent_part_number}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};

export default MissingBomItemsList;
