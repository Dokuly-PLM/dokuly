import React, { useEffect, useState, useRef, useMemo } from "react";
import { fetchNodes } from "./graphFunctions/queries";
import getLayoutedElements from "./graphFunctions/layoutElements";
import nodeOnClick from "./graphFunctions/nodeOnClick";
import connectElements from "./graphFunctions/connectElements";
import loadNodes from "./graphFunctions/loadNodes";
import onElementsRemove from "./graphFunctions/removeElements";
import dagre from "dagre";
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  isNode,
} from "react-flow-renderer";
import { fetchSerial } from "../../serialNumbers/serialNumbersFunctions/queries";
import onDrop from "./graphFunctions/onDrop";
import DndSidebar from "./dndSidebar";
import { addIdToAddedNode } from "./graphFunctions/queries";
import CheckList from "./graphFunctions/checkList";
import useEventListener from "@use-it/event-listener";
import KeyboardShorts from "./keyboardShorts";

// Layouting library for react-flow-renderer graphs
const graph = new dagre.graphlib.Graph();
graph.setDefaultEdgeLabel(() => ({}));

const layoutElements = (elements) => {
  let result = getLayoutedElements(elements, graph);
  if (result != []) {
    return result;
  } else {
    return [];
  }
};

const NodeGraph = (props) => {
  // Vars
  let initialNodes = [];

  // Props
  let currentSerial = props.data.data;
  let currentBom = props.data.bom;
  let currentASM = props.selectedAsm;

  if (currentBom != null && currentBom != undefined) {
    localStorage.setItem("currentBom", JSON.stringify(currentBom));
  } else {
    let bomFromStorage = localStorage.getItem("currentBom", currentBom);
    if (bomFromStorage != undefined && bomFromStorage != null) {
      currentBom = JSON.parse(bomFromStorage);
    } else if (bomFromStorage.length === 0 || bomFromStorage === []) {
      localStorage.removeItem("currentBom");
    } else {
      localStorage.removeItem("currentBom");
    }
  }

  // Hooks
  const [nodesData, setNodesData] = useState(null);
  const [serialData, setSerialData] = useState(
    currentSerial != undefined ? currentSerial : null,
  );
  const [loading, setLoading] = useState(
    currentSerial != undefined ? false : true,
  );
  const [loading2, setLoading2] = useState(true);
  const [fetch, setFetch] = useState(true);
  const [elements, setElements] = useState(layoutElements(initialNodes));
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedPN, setSelectedPN] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const flowWrapper = useRef(null);

  if (elements != null) {
    localStorage.setItem("graphElements", JSON.stringify(elements));
  }

  const onElementsRemoveF = (elementsToRemove) => {
    let newElements = onElementsRemove(elementsToRemove, elements);

    let layoutedElements = layoutElements(newElements);

    setElements(layoutedElements);
  };

  const onConnect = (params) => {
    let newElements = connectElements(params, elements);
    let layoutedElements = layoutElements(newElements);
    setElements(layoutedElements);
  };

  const onLoad = (_reactFlowInstance) => {
    setReactFlowInstance(_reactFlowInstance);
  };

  const onDropF = (event) => {
    let newNode = onDrop(event, elements, flowWrapper, reactFlowInstance);
    if (newNode == null) {
      return;
    } else {
      addIdToAddedNode(newNode.data.id, serialData.id);
      setElements((el) => el.concat(newNode));
    }
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const nodeOnClickF = (event, element) => {
    let selected = nodeOnClick(event, element);
    setSelectedNode(selected);
    let source = localStorage.getItem("source");
    if (source != null && source != undefined) {
      let sourceElement = JSON.parse(source);
      if (
        selected != null &&
        selected != undefined &&
        sourceElement != null &&
        sourceElement != undefined
      ) {
        const params = {
          source: sourceElement.id,
          sourceHandle: null,
          target: selected.id,
          targetHandle: null,
        };
        let newElements = connectElements(params, elements);
        let layoutedElements = layoutElements(newElements);
        setElements(layoutedElements);
        localStorage.setItem("source", null);
      } else {
        localStorage.setItem("source", null);
      }
    } else {
      localStorage.setItem("source", null);
    }
  };

  const loadNodesF = (nData, elements) => {
    let newElements = loadNodes(nData, elements, 0, -1); // 0 is flag for Production
    let layoutedElements = layoutElements(newElements);
    setElements(layoutedElements);
  };

  const CONTROL_KEY = ["17", "Control"];

  const keyHandlerDown = ({ key }) => {
    if (CONTROL_KEY.includes(String(key))) {
      if (selectedNode != null && isNode(selectedNode)) {
        localStorage.setItem("source", JSON.stringify(selectedNode));
      }
    }
  };

  const keyHandlerUp = ({ key }) => {
    if (CONTROL_KEY.includes(String(key))) {
    }
  };

  useEventListener("keydown", keyHandlerDown);
  useEventListener("keyup", keyHandlerUp);

  useEffect(() => {
    if (fetch) {
      if (currentSerial == null || currentSerial == undefined) {
        // Got serial data, no need to fetch it
        let locationSplit = window.location.href.toString().split("/");
        let localSerialID = locationSplit[locationSplit.length - 3];
        fetchSerial(localSerialID)
          .then((res) => {
            setSerialData(res.data);
            fetchNodes(res.data.id)
              .then((res) => {
                setNodesData(res.data);
                loadNodesF(res.data, elements);
              })
              .finally(() => {
                setLoading2(false);
              });
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        // Do not have serial data, need to fetch it
        fetchNodes(currentSerial.id)
          .then((res) => {
            setNodesData(res.data);
            loadNodesF(res.data, elements);
          })
          .finally(() => {
            setLoading2(false);
          });
        setLoading(false);
      }
      setFetch(false);
    }
    if (currentASM == null) {
    }
  }, [elements]);

  return (
    <div className="m-2">
      {loading || loading2 ? (
        <div
          style={{ margin: "5rem" }}
          className="d-flex m-5 dokuly-primary justify-content-center"
        >
          <div className="spinner-border" role="status"></div>
        </div>
      ) : (
        <div>
          <div className="dropdown row" style={{ margin: "1rem" }}>
            <button
              className={
                currentBom
                  ? "btn btn-primary dropdown-toggle"
                  : "btn btn-secondary dropdown-toggle"
              }
              id="dropdownMenuButton"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              {currentBom ? "Select PCBA from Bom" : "No bom loaded"}
            </button>
            <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
              {currentBom != null && currentBom != undefined ? (
                currentBom.map((bomItem) => {
                  return (
                    <a
                      key={bomItem.id}
                      className="dropdown-item"
                      onClick={() => {
                        setSelectedPN(bomItem.part_number);
                      }}
                    >
                      {bomItem.part_number}
                      {bomItem.revision}
                    </a>
                  );
                })
              ) : (
                <a className="dropdown-item">No bom loaded</a>
              )}
            </div>
            <div className="ml-2">
              <KeyboardShorts />
            </div>
          </div>
          <ReactFlowProvider>
            <div className="row">
              <div
                className="col-8"
                style={{ width: "65rem", height: "30rem" }}
                ref={flowWrapper}
              >
                <ReactFlow
                  elements={elements}
                  onElementsRemove={onElementsRemoveF}
                  onConnect={onConnect}
                  onLoad={onLoad}
                  snapToGrid={true}
                  snapGrid={[15, 15]}
                  onDrop={onDropF}
                  onDragOver={onDragOver}
                  onElementClick={nodeOnClickF}
                >
                  <MiniMap
                    nodeColor={(n) => {
                      if (n.type === "default") return "#317a85ff";
                    }}
                    style={{ background: "light-grey" }}
                    nodeBorderRadius={5}
                    nodeStrokeWidth={5}
                    nodeStrokeColor={(n) => {
                      if (n.type === "default") return "#000000";
                    }}
                  />
                  <Controls />
                  <Background color="#2F4F4F" gap={10} />
                </ReactFlow>
              </div>
              <div className="col-4">
                <div>
                  <CheckList
                    bom={currentBom}
                    nodes={nodesData}
                    serial={serialData}
                    elements={elements}
                    asm={currentASM}
                  />
                </div>
                {selectedPN != null && (
                  <DndSidebar pn={selectedPN} currentNodes={nodesData} />
                )}
              </div>
            </div>
          </ReactFlowProvider>
        </div>
      )}
    </div>
  );
};

export default NodeGraph;
