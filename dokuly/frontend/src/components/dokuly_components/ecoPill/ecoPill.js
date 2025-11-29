import React from "react";
import { useNavigate } from "react-router-dom";
import { OverlayTrigger, Popover } from "react-bootstrap";
import DokulyMarkdown from "../dokulyMarkdown/dokulyMarkdown";

/**
 * EcoPeek - Popover content for ECO pill hover
 * Shows title, description preview, and affected items count
 */
const EcoPeek = ({ eco }) => {
  if (!eco) return null;

  // Truncate description to first 200 characters
  const descriptionPreview = eco.description_text
    ? eco.description_text.length > 200
      ? eco.description_text.substring(0, 200) + "..."
      : eco.description_text
    : "No description";

  return (
    <div style={{ minWidth: "250px", maxWidth: "350px" }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        ECO{eco.id}: {eco.display_name || "Untitled"}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          color: "#666",
          marginBottom: "8px",
          borderLeft: "2px solid #165216",
          paddingLeft: "8px",
        }}
      >
        <DokulyMarkdown markdownText={descriptionPreview} />
      </div>
      <div style={{ fontSize: "0.75rem", color: "#888" }}>
        <span style={{ marginRight: "12px" }}>
          <strong>Affected items:</strong> {eco.affected_items_count || 0}
        </span>
        <span>
          <strong>State:</strong> {eco.release_state || "Draft"}
        </span>
      </div>
    </div>
  );
};

/**
 * Get pill background color based on ECO release state
 */
const getPillColor = (releaseState) => {
  switch (releaseState) {
    case "Released":
      return "#165216"; // dokuly-bg-primary green
    case "Review":
      return "#f6c208"; // dokuly-bg-warning yellow
    case "Draft":
    default:
      return "#108e82"; // dokuly-bg-secondary teal
  }
};

/**
 * Get text color for contrast
 */
const getTextColor = (releaseState) => {
  switch (releaseState) {
    case "Review":
      return "#000000"; // Black text for yellow background
    default:
      return "#ffffff"; // White text for other backgrounds
  }
};

/**
 * EcoPill - A clickable pill that shows ECO information
 * 
 * @param {Object} props
 * @param {Object} props.eco - ECO object with id, display_name, release_state, description_text, affected_items_count
 * @param {boolean} props.showPeek - Whether to show the hover popover (default: true)
 * @param {string} props.size - Size variant: 'sm', 'md' (default: 'md')
 */
const EcoPill = ({ eco, showPeek = true, size = "md" }) => {
  const navigate = useNavigate();

  if (!eco || !eco.id) return null;

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+click or Cmd+click - open in new tab
      window.open(`/eco/${eco.id}`, "_blank");
    } else {
      // Normal click - navigate in same tab
      navigate(`/eco/${eco.id}`);
    }
  };

  const bgColor = getPillColor(eco.release_state);
  const textColor = getTextColor(eco.release_state);

  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: size === "sm" ? "2px 8px" : "4px 12px",
    borderRadius: "12px",
    backgroundColor: bgColor,
    color: textColor,
    fontSize: size === "sm" ? "0.75rem" : "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "filter 0.15s ease",
  };

  const pillContent = (
    <span
      style={pillStyle}
      onClick={handleClick}
      onMouseEnter={(e) => (e.target.style.filter = "brightness(1.1)")}
      onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
      title={showPeek ? "" : `ECO${eco.id}: ${eco.display_name || "Untitled"}`}
    >
      ECO{eco.id}
    </span>
  );

  if (!showPeek) {
    return pillContent;
  }

  const popover = (
    <Popover id={`eco-peek-${eco.id}`}>
      <Popover.Body>
        <EcoPeek eco={eco} />
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger={["hover", "focus"]}
      placement="auto"
      overlay={popover}
      delay={{ show: 300, hide: 100 }}
    >
      {pillContent}
    </OverlayTrigger>
  );
};

/**
 * EcoPillList - Renders multiple ECO pills
 * 
 * @param {Object} props
 * @param {Array} props.ecos - Array of ECO objects
 * @param {boolean} props.showPeek - Whether to show hover popovers
 * @param {string} props.size - Size variant
 */
export const EcoPillList = ({ ecos = [], showPeek = true, size = "md" }) => {
  if (!ecos || ecos.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {ecos.map((eco) => (
        <EcoPill key={eco.id} eco={eco} showPeek={showPeek} size={size} />
      ))}
    </div>
  );
};

export { EcoPeek };
export default EcoPill;
