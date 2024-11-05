import React from "react";

const loadNodes = (nData, currentElements, flag, asmId) => {
  // Flag: 0 for prod, 1 for PCBA, asmId: For Blueprint graph
  // Push current prod as node for init
  let initialNodes;
  if (currentElements !== null && currentElements !== undefined) {
    if (currentElements.length == 0) {
      initialNodes = [];
    } else {
      initialNodes = currentElements;
    }
  } else {
    initialNodes = [];
  }
  if (flag == 0) {
    if (nData !== undefined && nData !== null) {
      nData.map((node, index) => {
        initialNodes.push({
          sourcePosition: "top",
          targetPosition: "bottom",
          id: node.id.toString(),
          type: "default",
          position: {
            x: 0,
            y: 0,
          },
          data: {
            label: (
              <div>
                {node.serial_number}
                {" - "}
                {node.pcba_part_number}
              </div>
            ),
            id: node.id,
            assembly_date: node.assembly_date,
            comment: node.comment,
            next_prod: node.next_prod,
            prev_prod: node.prev_prod,
            revision: node.revision,
            serial_number: node.serial_number,
            state: node.state,
            pcba_part_number: node.pcba_part_number,
          },
        });
      });

      nData.map((node, index) => {
        if (
          node?.next_prod?.length !== 0 &&
          node.next_prod !== null &&
          node.next_prod !== undefined
        ) {
          node.next_prod.map((next, index) => {
            initialNodes.push({
              id: initialNodes.length + 1,
              source: node.id,
              target: next,
              type: "smoothstep",
              style: { strokeWidth: "5.0px" },
              animated: true,
            });
          });
        }
      });
      return initialNodes;
    }
    return initialNodes;
  } else if (flag == 1) {
    if (nData !== undefined && nData !== null) {
      nData.map((node, index) => {
        initialNodes.push({
          sourcePosition: "top",
          targetPosition: "bottom",
          id: node.part_number.toString(),
          type: "default",
          position: {
            x: 0,
            y: 0,
          },
          data: {
            label: (
              <div>
                {node.display_name}
                {" - "}
                {node.part_number}
              </div>
            ),
            id: node.id,
            part_number: node.part_number,
            prev_pcba: node.prev_pcba,
            next_pcba: node.next_pcba,
            display_name: node.display_name,
          },
        });
      });

      nData.map((node, index) => {
        if (
          node?.next_pcba?.length !== 0 &&
          node.next_pcba !== null &&
          node.next_pcba !== undefined
        ) {
          node.next_pcba.map((next, index) => {
            let nextSplit = next.split(",");
            if (parseInt(nextSplit[1]) == asmId) {
              initialNodes.push({
                id: initialNodes.length + 1,
                source: node.part_number,
                target: parseInt(nextSplit[0]),
                type: "smoothstep",
                style: { strokeWidth: "5.0px" },
                animated: true,
              });
            }
          });
        }
      });

      return initialNodes;
    }
    return initialNodes;
  }
  return -1; // No flag set
};

export default loadNodes;
