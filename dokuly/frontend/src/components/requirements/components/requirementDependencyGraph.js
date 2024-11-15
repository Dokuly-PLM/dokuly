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
import DokulyTags from "../../dokuly_components/dokulyTags/dokulyTags";

const getParentChainWithDerived = (requirement, requirementSet) => {
  const chain = [];
  const visited = new Set(); // Track visited requirements

  let currentRequirement = requirement;

  while (currentRequirement && currentRequirement.parent_requirement) {
    if (visited.has(currentRequirement.id)) {
      console.warn(
        `Circular dependency detected for requirement ID: ${currentRequirement.id}`
      );
      break;
    }

    visited.add(currentRequirement.id);

    // Find the parent
    const parent = requirementSet.find(
      (req) => req.id === currentRequirement.parent_requirement
    );

    if (parent) {
      // Collect parent and its derived_from requirements
      const derived = (parent.derived_from || []).map((derivedReqId) =>
        requirementSet.find((req) => req.id === derivedReqId)
      ).filter(Boolean); // Filter out any undefined values
      
      chain.push({ parent, derived });
      currentRequirement = parent;
    } else {
      break;
    }
  }

  return chain;
};

const CustomNode = ({ data }) => {
  const maxHeight = "780px";

  return (
    <div
      className="custom-node"
      style={{
        border: "1px solid #ddd",
        borderRadius: 5,
        background: "#fff",
        maxWidth: "680px",
        maxHeight: maxHeight,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 15,
          backgroundColor: data.isCurrent ? "#155216" : "#f0f0f0",
          color: data.isCurrent ? "#ffffff" : "#000000",
          borderBottom: "1px solid #ddd",
          borderRadius: "5px 5px 0 0",
        }}
      >
        <strong>ID:</strong> {data.id}
      </div>

      {data.tags && data.tags.length > 0 && (
        <div style={{ padding: 4, display: "flex", flexWrap: "wrap", gap: "2px" }}>
          <DokulyTags tags={data.tags || []} readOnly={true} />
        </div>
      )}
      

      <div style={{ padding: 15, overflow: "auto", maxHeight: maxHeight }}>
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
      const visited = new Set();
    
      // Add the current requirement node with tags
      newNodes.push({
        id: requirement.id.toString(),
        type: "custom",
        data: {
          id: requirement.id,
          statement: requirement.statement,
          isCurrent: true,
          tags: requirement.tags,
        },
        position: { x: 0, y: 0 },
      });
    
      // Handle derived_from nodes for the main requirement
      if (requirement.derived_from && requirement.derived_from.length > 0) {
        const derivedXOffset = -800; // Position to the left
        let derivedYOffset = -200 * (requirement.derived_from.length - 1); // Start above the main requirement
  
        requirement.derived_from.forEach((derivedReqId) => {
          const derivedReq = requirement_set.find((req) => req.id === derivedReqId);
          if (derivedReq && !visited.has(derivedReq.id)) {
            visited.add(derivedReq.id);
  
            // Add derived node above the main requirement node
            newNodes.push({
              id: derivedReq.id.toString(),
              type: "custom",
              data: {
                id: derivedReq.id,
                statement: derivedReq.statement,
                isCurrent: false,
                tags: derivedReq.tags,
              },
              position: { x: derivedXOffset, y: derivedYOffset },
            });
  
            // Connect derived node to main requirement node
            newEdges.push({
              id: `e${derivedReq.id}-${requirement.id}`,
              source: derivedReq.id.toString(),
              target: requirement.id.toString(),
              animated: true,
              label: "derived from",
            });
  
            derivedYOffset += 800; // Stack each derived_from node vertically below the previous
          }
        });
      }
    
      // Traverse up the parent chain with derived relationships
      const parentChainWithDerived = getParentChainWithDerived(requirement, requirement_set);
      if (parentChainWithDerived && Array.isArray(parentChainWithDerived)) {
        let yOffset = -200;
        let xOffset = -800;
    
        parentChainWithDerived.forEach(({ parent, derived }, index) => {
          if (parent && !visited.has(parent.id)) {
            visited.add(parent.id);
    
            // Add the parent node
            newNodes.push({
              id: parent.id.toString(),
              type: "custom",
              data: {
                id: parent.id,
                statement: parent.statement,
                isCurrent: false,
                tags: parent.tags,
              },
              position: { x: xOffset, y: yOffset },
            });
  
            // Connect the parent to its child in the chain
            newEdges.push({
              id: `e${parent.id}-${index === 0 ? requirement.id : parentChainWithDerived[index - 1].parent.id}`,
              source: parent.id.toString(),
              target: index === 0 ? requirement.id.toString() : parentChainWithDerived[index - 1].parent.id.toString(),
              animated: true,
              label: "parent",
            });
    
            // Position derived nodes for the parent above and to the left
            let derivedYOffset = yOffset - 200 * derived.length;
            derived.forEach((derivedReq) => {
              if (derivedReq && !visited.has(derivedReq.id)) {
                visited.add(derivedReq.id);
    
                newNodes.push({
                  id: derivedReq.id.toString(),
                  type: "custom",
                  data: {
                    id: derivedReq.id,
                    statement: derivedReq.statement,
                    isCurrent: false,
                    tags: derivedReq.tags,
                  },
                  position: { x: xOffset - 800, y: derivedYOffset },
                });
  
                newEdges.push({
                  id: `e${derivedReq.id}-${parent.id}`,
                  source: derivedReq.id.toString(),
                  target: parent.id.toString(),
                  animated: true,
                  label: "derived from",
                });
  
                derivedYOffset += 800; // Stack each derived node vertically below the previous
              }
            });
  
            yOffset -= 200;
            xOffset -= 800;
          }
        });
      }
    
      // Add all subrequirements
      if (requirement_set && requirement_set.length > 0) {
        let subYOffset = 100;
        let subXOffset = 800;
    
        for (const req of requirement_set) {
          if (req && req.parent_requirement === requirement.id && !visited.has(req.id)) {
            visited.add(req.id);
    
            newNodes.push({
              id: req.id.toString(),
              type: "custom",
              data: {
                id: req.id,
                statement: req.statement,
                isCurrent: false,
                tags: req.tags,
              },
              position: { x: subXOffset, y: subYOffset },
            });
    
            newEdges.push({
              id: `e${requirement.id}-${req.id}`,
              source: requirement.id.toString(),
              target: req.id.toString(),
              animated: true,
              label: "subrequirement",
            });
  
            subYOffset += 800;
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
