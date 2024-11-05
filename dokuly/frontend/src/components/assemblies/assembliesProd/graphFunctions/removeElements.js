import React from "react";
import { isEdge, removeElements } from "react-flow-renderer";
import { removeEdge, removeNode } from "./queries";

const onElementsRemove = (elementsToRemove, currentElements) => {
	// Do a db call here, check if it is a node or an edge
	// thinking that if we remove a node with connections, remove its connections
	// Need an undo button here, just so if a mistake is made, undo the deletion
	let undoElement = elementsToRemove; // Need to set this in localStorage for undo
	let source = 0;
	let target = 0;
	if (undoElement.length == 1) {
		// Only 1 element selected here
		if (isEdge(undoElement[0])) {
			// Remove the connection, update the connections for connected nodes
			source = undoElement[0].source;
			target = undoElement[0].target;
			removeEdge(source, target).then((res) => {});
		} else {
			// Remove the node, remove its connections, update the connections for connected nodes
			removeNode(elementsToRemove[0].data.id, 0).then((res) => {});
		}
	} else {
		// More than 1 element selected
		removeNode(elementsToRemove[0].data.id, 1).then((res) => {});
	}
	let elementsAfterRemoval = removeElements(elementsToRemove, currentElements);
	return elementsAfterRemoval;
};

export default onElementsRemove;
