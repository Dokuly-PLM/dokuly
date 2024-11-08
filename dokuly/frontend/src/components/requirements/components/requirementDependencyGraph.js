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

      if (requirement.parent_requirement) {
        let parentRequirement = null;
        if (requirement_set && requirement_set.length > 0) {
          for (const req of requirement_set) {
            if (req.id === requirement.parent_requirement) {
              parentRequirement = req;
              break;
            }
          }

          if (parentRequirement) {
            newNodes.push({
              id: parentRequirement.id.toString(),
              type: "custom",
              data: {
                id: parentRequirement.id,
                statement: parentRequirement.statement,
                isCurrent: false,
              },
              position: { x: -500, y: -100 },
            });

            newEdges.push({
              id: `e${parentRequirement.id}-${requirement.id}`,
              source: parentRequirement.id.toString(),
              target: requirement.id.toString(),
              animated: true,
              label: "subrequirement",
            });
          }
        }
      }

      if (requirement_set && requirement_set.length > 0) {
        let yOffset = 100;
        for (const req of requirement_set) {
          if (req.parent_requirement === requirement.id) {
            newNodes.push({
              id: req.id.toString(),
              type: "custom",
              data: { id: req.id, statement: req.statement, isCurrent: false },
              position: { x: 500, y: yOffset },
            });

            newEdges.push({
              id: `e${requirement.id}-${req.id}`,
              source: requirement.id.toString(),
              target: req.id.toString(),
              animated: true,
              label: "subrequirement",
            });

            yOffset += 150;
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
