import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { getRequirement } from "../../requirements/functions/queries";

const RequirementPeek = ({ requirement }) => {
  if (!requirement) return null;

  return (
    <div style={{ minWidth: "250px", maxWidth: "350px" }}>
      <div style={{ fontWeight: "bold", marginBottom: requirement.external_requirement_id ? "4px" : "8px" }}>
        Requirement {requirement.id}
      </div>
      {requirement.external_requirement_id && (
        <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: "8px" }}>
          {requirement.external_requirement_id}
        </div>
      )}
      <div
        style={{
          fontSize: "0.9rem",
          color: "#1f1f1f",
          fontWeight: "600",
          lineHeight: 1.4,
          marginBottom: "8px",
          borderLeft: "2px solid #1d5fbf",
          paddingLeft: "8px",
        }}
      >
        {requirement.statement || "No statement"}
      </div>
    </div>
  );
};

const RequirementPill = ({ requirement, showPeek = true, size = "md" }) => {
  const navigate = useNavigate();

  if (!requirement || !requirement.id) return null;

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      window.open(`/#/requirement/${requirement.id}`, "_blank");
    } else {
      navigate(`/requirement/${requirement.id}`);
    }
  };

  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: size === "sm" ? "2px 8px" : "4px 12px",
    borderRadius: "12px",
    backgroundColor: "#e7f1ff",
    border: "1px solid #1d5fbf",
    color: "#144a97",
    fontSize: size === "sm" ? "0.75rem" : "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "filter 0.15s ease",
  };

  const pillContent = (
    <span
      style={pillStyle}
      onClick={handleClick}
      onMouseEnter={(e) => (e.target.style.filter = "brightness(1.1)")}
      onMouseLeave={(e) => (e.target.style.filter = "brightness(1)")}
      title={showPeek ? "" : `Req. ${requirement.id}`}
    >
      Req. {requirement.id}
    </span>
  );

  if (!showPeek) {
    return pillContent;
  }

  const popover = (
    <Popover id={`requirement-peek-${requirement.id}`}>
      <Popover.Body>
        <RequirementPeek requirement={requirement} />
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

export const RequirementPillById = ({ requirementId }) => {
  const [requirement, setRequirement] = useState(null);

  useEffect(() => {
    let active = true;
    getRequirement(requirementId)
      .then((res) => {
        if (active && res.status === 200) {
          setRequirement(res.data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [requirementId]);

  if (!requirement) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: "12px",
          backgroundColor: "#e7f1ff",
          border: "1px solid #1d5fbf",
          color: "#144a97",
          fontSize: "0.75rem",
          fontWeight: "600",
          whiteSpace: "nowrap",
        }}
      >
        REQ{requirementId}
      </span>
    );
  }

  return <RequirementPill requirement={requirement} showPeek={true} size="sm" />;
};

export { RequirementPeek };
export default RequirementPill;