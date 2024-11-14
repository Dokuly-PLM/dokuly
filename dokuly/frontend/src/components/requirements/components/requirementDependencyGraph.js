import React, { useEffect, useState, useLayoutEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import ReactFlow, {
  MiniMap,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from "react-flow-renderer";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import { Handle } from "react-flow-renderer";
import DokulyMarkdown from "../../dokuly_components/dokulyMarkdown/dokulyMarkdown";

const getParentChain = (requirement, requirementSet) => {
  const chain = [];
  const visited = new Set(); // Track visited requirements

  let currentRequirement = requirement;

  while (currentRequirement && currentRequirement.parent_requirement) {
    // If we've already visited this requirement, break to avoid infinite loop
    if (visited.has(currentRequirement.id)) {
      console.warn(
        `Circular dependency detected for requirement ID: ${currentRequirement.id}`
      );
      break;
    }

    visited.add(currentRequirement.id); // Mark this requirement as visited
    const parent = requirementSet.find(
      (req) => req.id === currentRequirement.parent_requirement
    );

    if (parent) {
      chain.push(parent);
      currentRequirement = parent;
    } else {
      break;
    }
  }

  return chain;
};

const CustomNode = ({ data }) => {
  const maxHeight = "140px";

  return (
    <div
      className="custom-node"
      style={{
        border: "1px solid #ddd",
        borderRadius: 5,
        background: "#fff",
        maxWidth: "380px",
        maxHeight: maxHeight,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 10,
          backgroundColor: data.isCurrent ? "#155216" : "#f0f0f0",
          color: data.isCurrent ? "#ffffff" : "#000000",
          borderBottom: "1px solid #ddd",
          borderRadius: "5px 5px 0 0",
        }}
      >
        <strong>ID:</strong> {data.id}
      </div>
      <div style={{ padding: 10, overflow: "auto", maxHeight: maxHeight }}>
        <div>
          <strong>Statement:</strong>
        </div>
        <DokulyMarkdown markdownText={data.statement} />
      </div>
      <Handle type="source" position="right" />
      <Handle type="target" position="left" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const RequirementDependencyGraphContent = ({
  requirement,
  requirement_set,
  showGrid,
  showMiniMap,
  windowHeight,
  isFullscreen,
  onExitFullscreen,
}) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const containerRef = useRef(null);
  const [nodeSize, setNodeSize] = useState(null);

  useLayoutEffect(() => {
    if (!requirement || !containerRef.current) return;

    const nodeElements = containerRef.current.querySelectorAll(
      ".react-flow__node.custom-node",
    );
    const currentNodeElement = Array.from(nodeElements).find((el) =>
      el.textContent.includes(requirement.id),
    );

    if (currentNodeElement) {
      const currentNodeRect = currentNodeElement.getBoundingClientRect();
      setNodeSize({
        width: currentNodeRect.width,
        height: currentNodeRect.height,
      });
    }
  }, [nodes]);

  useEffect(() => {
    const newNodes = [];
    const newEdges = [];
  
    if (requirement) {
      const visited = new Set(); // Track visited nodes to prevent circular loops
  
      // Add the current requirement node
      newNodes.push({
        id: requirement.id.toString(),
        type: "custom",
        data: {
          id: requirement.id,
          statement: requirement.statement,
          isCurrent: true,
        },
        position: { x: 0, y: 0 },
      });
  
      // Recursively add all parent requirements up to the root
      const parentChain = getParentChain(requirement, requirement_set);
      if (parentChain && Array.isArray(parentChain)) {
        let yOffset = -150; // Positioning offset for each level up
        let xOffset = -250; // Positioning offset for each parent node to the left
  
        parentChain.forEach((parentReq, index) => {
          if (parentReq && parentReq.id) {
            if (visited.has(parentReq.id)) {
              console.warn(`Circular dependency detected at requirement ID: ${parentReq.id}`);
              return; // Skip adding this node if it creates a circular dependency
            }
            visited.add(parentReq.id);
  
            newNodes.push({
              id: parentReq.id.toString(),
              type: "custom",
              data: {
                id: parentReq.id,
                statement: parentReq.statement,
                isCurrent: false,
              },
              position: { x: xOffset, y: yOffset },
            });
  
            // Connect each parent to its child
            if (index === 0) {
              newEdges.push({
                id: `e${parentReq.id}-${requirement.id}`,
                source: parentReq.id.toString(),
                target: requirement.id.toString(),
                animated: true,
                label: "parent",
              });
            } else {
              newEdges.push({
                id: `e${parentReq.id}-${parentChain[index - 1].id}`,
                source: parentReq.id.toString(),
                target: parentChain[index - 1].id.toString(),
                animated: true,
                label: "parent",
              });
            }
  
            yOffset -= 150; // Move up for the next parent
            xOffset -= 250; // Move left for the next parent
          }
        });
      }
  
      // Add all subrequirements (existing code)
      if (requirement_set && requirement_set.length > 0) {
        let subYOffset = 100;
        let subXOffset = 500;
        for (const req of requirement_set) {
          if (req && req.parent_requirement === requirement.id) {
            if (visited.has(req.id)) {
              console.warn(`Circular dependency detected at requirement ID: ${req.id}`);
              continue; // Skip adding this node if it creates a circular dependency
            }
            visited.add(req.id);
  
            newNodes.push({
              id: req.id.toString(),
              type: "custom",
              data: { id: req.id, statement: req.statement, isCurrent: false },
              position: { x: subXOffset, y: subYOffset },
            });
  
            newEdges.push({
              id: `e${requirement.id}-${req.id}`,
              source: requirement.id.toString(),
              target: req.id.toString(),
              animated: true,
              label: "subrequirement",
            });
  
            subYOffset += 150;
          }
        }
      }
  
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [requirement, requirement_set]);
  

  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.1 }), 0);
    }
  }, [nodes, fitView]);

  return (
    <div
      ref={containerRef}
      style={{
        height: isFullscreen ? "100vh" : windowHeight,
        width: isFullscreen ? "100vw" : "100%",
        position: isFullscreen ? "fixed" : "relative",
        top: 0,
        left: 0,
        backgroundColor: "#fff",
        zIndex: isFullscreen ? 9999 : "auto",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        elementsSelectable={false}
      >
        {(isFullscreen || showMiniMap) && <MiniMap />}
        {showGrid && <Background />}
        <Controls />
      </ReactFlow>
      {isFullscreen && (
        <Button
          className="btn-bg-transparent "
          onClick={onExitFullscreen}
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            zIndex: 10000,
          }}
        >
          Exit Fullscreen
        </Button>
      )}
    </div>
  );
};

const RequirementDependencyGraph = ({
  requirement = null,
  requirement_set = [],
  showGrid = false,
  showMiniMap = false,
  windowHeight = 250,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.getElementById("graph-container").requestFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleExitFullscreen = () => {
    document.exitFullscreen();
    setIsFullscreen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isFullscreen) {
        handleExitFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const hasRelations = () => {
    if (!requirement) return false;
    const hasParent = !!requirement.parent_requirement;
    const hasSubrequirements = requirement_set.some(
      (req) => req.parent_requirement === requirement.id,
    );
    const hasSatisfiedBy =
      requirement.satisfied_by && requirement.satisfied_by.length > 0;
    const hasDerivedFrom =
      requirement.derived_from && requirement.derived_from.length > 0;
    return hasParent || hasSubrequirements || hasSatisfiedBy || hasDerivedFrom;
  };

  const isHidden = !hasRelations();

  return (
    <DokulyCard isHidden={isHidden} hiddenText={"Requirement has no relations"}>
      <CardTitle titleText={"Dependencies"} />
      <Button
        onClick={handleFullscreenToggle}
        size="sm"
        className="btn-bg-transparent "
        style={{
          position: "absolute", // Change position to "absolute"
          top: 10,
          right: 10,
          zIndex: 10000,
        }}
      >
        {isFullscreen ? "Exit Fullscreen" : "Show in Fullscreen"}
      </Button>
      <ReactFlowProvider>
        <div id="graph-container">
          <RequirementDependencyGraphContent
            requirement={requirement}
            requirement_set={requirement_set}
            showGrid={showGrid}
            showMiniMap={showMiniMap}
            windowHeight={windowHeight}
            isFullscreen={isFullscreen}
            onExitFullscreen={handleExitFullscreen}
          />
        </div>
      </ReactFlowProvider>
    </DokulyCard>
  );
};

export default RequirementDependencyGraph;
