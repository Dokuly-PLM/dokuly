import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { getIssue } from "../dokulyIssues/functions/queries";

/**
 * IssuePeek - Popover content for issue pill hover
 * Shows id, title, criticality, and status
 */
const IssuePeek = ({ issue }) => {
  if (!issue) return null;

  return (
    <div style={{ minWidth: "250px", maxWidth: "350px" }}>
      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
        #{issue.id}: {issue.title || "Untitled"}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          color: "#666",
          marginBottom: "8px",
          borderLeft: `2px solid ${getPillColor(issue.criticality)}`,
          paddingLeft: "8px",
        }}
      >
        {issue.criticality || "Low"} criticality
      </div>
      <div style={{ fontSize: "0.75rem", color: "#888" }}>
        <span>
          <strong>Status:</strong> {issue.closed_at ? "Closed" : "Open"}
        </span>
      </div>
    </div>
  );
};

/**
 * Get pill background color based on issue criticality
 */
const getPillColor = (criticality) => {
  switch (criticality) {
    case "Critical":
      return "red";
    case "High":
      return "#f6c208ff";
    default:
      return "#54a4daff"; // Low / default
  }
};

/**
 * Get text color for contrast
 */
const getTextColor = (criticality) => {
  switch (criticality) {
    case "High":
      return "#333";
    default:
      return "#ffffff";
  }
};

/**
 * IssuePill - A clickable pill that shows issue information
 *
 * @param {Object} props
 * @param {Object} props.issue - Issue object with id, title, criticality, closed_at
 * @param {boolean} props.showPeek - Whether to show the hover popover (default: true)
 * @param {string} props.size - Size variant: 'sm', 'md' (default: 'md')
 */
const IssuePill = ({ issue, showPeek = true, size = "md" }) => {
  const navigate = useNavigate();

  if (!issue || !issue.id) return null;

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      window.open(`/#/issues/${issue.id}`, "_blank");
    } else {
      navigate(`/issues/${issue.id}`);
    }
  };

  const bgColor = getPillColor(issue.criticality);
  const textColor = getTextColor(issue.criticality);
  const isClosed = !!issue.closed_at;

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
    textDecoration: isClosed ? "line-through" : "none",
    opacity: isClosed ? 0.6 : 1,
    whiteSpace: "nowrap",
    transition: "filter 0.15s ease",
  };

  const pillContent = (
    <span
      style={pillStyle}
      onClick={handleClick}
      onMouseEnter={(e) => (e.target.style.filter = "brightness(1.1)")}
      onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
      title={showPeek ? "" : `#${issue.id}: ${issue.title || "Untitled"}`}
    >
      #{issue.id}
    </span>
  );

  if (!showPeek) {
    return pillContent;
  }

  const popover = (
    <Popover id={`issue-peek-${issue.id}`}>
      <Popover.Body>
        <IssuePeek issue={issue} />
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
 * IssuePillById - Fetches issue data by ID and renders an IssuePill
 * Used in markdown rendering where only the issue ID is known.
 */
export const IssuePillById = ({ issueId }) => {
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    let active = true;
    getIssue(issueId)
      .then((res) => {
        if (active && res.status === 200) {
          setIssue(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [issueId]);

  if (!issue) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: "12px",
          backgroundColor: "#ccc",
          color: "#666",
          fontSize: "0.75rem",
          fontWeight: "500",
          whiteSpace: "nowrap",
        }}
      >
        #{issueId}
      </span>
    );
  }

  return <IssuePill issue={issue} showPeek={true} size="sm" />;
};

export { IssuePeek };
export default IssuePill;
