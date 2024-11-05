import React, { useState, useEffect } from "react";
import { Button, Collapse } from "react-bootstrap";
import { useNavigate } from "react-router";

const TreeNode = ({
  node,
  currentRequirementId = -1,
  forceOpen = false,
  fontSize,
  iconSize = 24,
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const basePath = "/static/icons";

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen]);

  const statusIcon = (is_verified, state, verification_class) => {
    let iconPath = "";
    let iconFilter = ""; // Define filter for color
  
    if (is_verified) {
      iconPath = `${basePath}/circle-check.svg`;  // Verified
      iconFilter =
        "invert(50%) sepia(89%) saturate(469%) hue-rotate(87deg) brightness(94%) contrast(90%)"; // Green color
    } else if (state === "Rejected") {
      iconPath = `${basePath}/circle-x.svg`;  // Rejected
      iconFilter =
        "invert(18%) sepia(94%) saturate(7474%) hue-rotate(355deg) brightness(95%) contrast(105%)"; // Red color
    } else if (verification_class === "placeholder text") {
      iconPath = `${basePath}/alert-circle.svg`;  // Issue
      iconFilter =
        "invert(58%) sepia(89%) saturate(300%) hue-rotate(35deg) brightness(95%) contrast(85%)"; // Orange color
    } else {
      iconPath = `${basePath}/circle.svg`;  // Default state
      iconFilter = "invert(45%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(80%)"; // Default gray
    }
  
    return (
      <img
        src={iconPath}
        alt="status"
        style={{
          marginLeft: "10px",
          width: iconSize,
          height: iconSize,
          filter: iconFilter, // Apply color filter
        }}
      />
    );
  };
  
  

  const toggleIcon = open ? `${basePath}/minus.svg` : `${basePath}/plus.svg`;

  const displayString =
    node.statement.length > 50
      ? node.statement.substring(0, 50) + "..."
      : node.statement || "No Description Available";
  const handleNavigate = () => {
    navigate(`/requirement/${node.id}`);
  };

  const isCurrent = node.id === currentRequirementId;
  const highlightStyle = isCurrent
    ? {
        backgroundColor: "#16521622",
        padding: "3px",
        borderRadius: "5px",
        fontSize,
        fontWeight: "bold",
      }
    : {
        fontSize,
        fontWeight: "normal",
      };

  const nodeStyle = { marginBottom: "4px" };

  const buttonStyle = {
    padding: 0,
    border: "none",
    background: "none",
    width: iconSize,
    height: iconSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    boxShadow: "none",
    ":focus": {
      outline: "none",
      boxShadow: "none",
    },
    ":active": {
      boxShadow: "none",
    },
  };

  return (
    <div style={nodeStyle}>
      <div className="d-flex align-items-center">
        {node.children && node.children.length > 0 ? (
          <Button
            variant="transparent"
            onClick={() => setOpen(!open)}
            style={buttonStyle}
          >
            <img
              src={toggleIcon}
              alt={open ? "Collapse" : "Expand"}
              style={{ width: iconSize, height: iconSize }}
            />
          </Button>
        ) : (
          <div style={{ ...buttonStyle, opacity: 0 }}></div> // Invisible placeholder
        )}
        {statusIcon(node.is_verified, node.state, node.verification_class)}
        <span
          className="ml-2"
          onClick={handleNavigate}
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            ...highlightStyle,
          }}
        >
          {displayString}
        </span>
      </div>
      <Collapse in={open}>
        <div className="ml-4">
          {node.children &&
            node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                currentRequirementId={currentRequirementId}
                forceOpen={forceOpen && isCurrent}
                fontSize={fontSize}
                iconSize={iconSize}
              />
            ))}
        </div>
      </Collapse>
    </div>
  );
};

const TreeView = ({
  data,
  currentRequirementId,
  fontSize = "11px",
  iconSize = 18,
}) => {
  return (
    <div className="container mt-3">
      {data.map((rootNode) => (
        <TreeNode
          key={rootNode.id}
          node={rootNode}
          currentRequirementId={currentRequirementId}
          fontSize={fontSize}
          iconSize={iconSize}
        />
      ))}
    </div>
  );
};

export default TreeView;
