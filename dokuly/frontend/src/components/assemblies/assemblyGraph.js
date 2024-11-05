import React, { useEffect, useState } from "react";
import ReactFlow, {
	MiniMap,
	Controls,
	Background,
	isNode,
	addEdge,
	removeElements,
} from "react-flow-renderer";
import dagre from "dagre";
import getLayoutedElements from "./assembliesProd/graphFunctions/layoutElements";
import {
	fetchNodesForblueprint,
	saveEdge,
} from "./assembliesProd/graphFunctions/queries";
import loadNodes from "./assembliesProd/graphFunctions/loadNodes";
import nodeOnClick from "./assembliesProd/graphFunctions/nodeOnClick";

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

const AssemblyGraph = (props) => {
	// Props
	let asm = props.selectedAsm;
	// Vars
	let initElements = [];

	// Hooks (States)
	const [elements, setElements] = useState(initElements);
	const [nodeData, setNodeData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [reactFlowInstance, setReactFlowInstance] = useState(null);

	const onElementsRemoveF = (elementsToRemove) => {
		if (isNode(elementsToRemove)) {
			// Not allowed
			return;
		}
		setElements((els) => removeElements(elementsToRemove, els));
	};

	const onConnect = (params) => {
		let source = nodeData.filter(
			(el) => parseInt(params.source) == el.part_number,
		);
		let target = nodeData.filter(
			(el) => parseInt(params.target) == el.part_number,
		);
		const edges = {
			prev_pcba: source[0].part_number,
			next_pcba: target[0].part_number,
		};
		saveEdge(parseInt(source[0].id), parseInt(target[0].id), edges, 1, asm.id);
		setElements((el) =>
			addEdge(
				{
					...params,
					type: "smoothstep",
					style: { strokeWidth: "5.0px" },
					animated: true,
				},
				el,
			),
		);
	};

	const onLoad = (_reactFlowInstance) => {
		setReactFlowInstance(_reactFlowInstance);
	};

	const nodeOnClickF = (event, element) => {
		nodeOnClick(event, element);
	};

	const loadNodesF = (nData, elements, asmId) => {
		let newElements = loadNodes(nData, elements, 1, asmId);
		let layoutedElements = layoutElements(newElements);
		setElements(layoutedElements);
	};

	useEffect(() => {
		let pcbasToFetch = asm.pcba_used;
		if (pcbasToFetch != (null && undefined)) {
			fetchNodesForblueprint(pcbasToFetch)
				.then((res) => {
					setNodeData(res.data);
					loadNodesF(res.data, elements, asm.id); // 1 is flag for PCBA
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [asm]);

	return (
		<div className="m-2">
			{loading ? (
				<div
					style={{ margin: "5rem" }}
					className="d-flex m-5 dokuly-primary justify-content-center"
				>
					<div className="spinner-border" role="status"></div>
				</div>
			) : (
				<div style={{ width: "40rem", height: "40rem" }}>
					<ReactFlow
						elements={elements}
						onElementsRemove={onElementsRemoveF}
						onConnect={onConnect}
						onLoad={onLoad}
						snapToGrid={true}
						snapGrid={[15, 15]}
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
			)}
		</div>
	);
};

export default AssemblyGraph;
