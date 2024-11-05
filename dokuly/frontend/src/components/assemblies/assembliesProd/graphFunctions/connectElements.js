import React from "react";
import { isEdge, addEdge } from "react-flow-renderer";
import { saveEdge } from "./queries";

const connectElements = (params, elements) => {
  var ok = true;
  if (params.target && params.source) {
    elements.map((element) => {
      if (isEdge(element)) {
        if (
          element.source == params.source &&
          element.target == params.target
        ) {
          ok = false;
        }
        if (
          element.source == params.target &&
          element.source == params.target
        ) {
          ok = false;
        }
      }
    });
    let sourceProd = elements.filter((el) => params.source === el.id);
    if (
      sourceProd[0]?.data?.next_prod !== null &&
      sourceProd[0]?.data?.next_prod !== undefined
    ) {
      if (
        sourceProd[0]?.data?.next_prod?.length > 1 &&
        parseInt(sourceProd[0]?.data?.next_prod.length) !== 0
      ) {
        elements.map((element) => {
          let elementData = elements.filter((el) => el.id === element.id);
          if (
            elementData[0] !== null &&
            elementData[0] !== undefined &&
            elementData[0].data !== null &&
            elementData[0].data !== undefined
          ) {
            if (
              elementData[0]?.data?.next_prod !== null &&
              elementData[0]?.data?.next_prod !== undefined
            ) {
              if (elementData[0]?.data?.next_prod?.length > 0) {
                for (let i = 0; i < elementData[0].data.next_prod.length; i++) {
                  if (elementData[0]?.data?.next_prod[i] == params.target) {
                    ok = false;
                  }
                }
              }
            }
          }
        });
      }
    }
    let targetProd = elements.filter((el) => params.target === el.id);
    if (targetProd[0]?.data?.prev_prod) {
      if (targetProd[0]?.data?.prev_prod.length != 0) {
        ok = false;
      }
    }
  }
  if (ok) {
    var id_target;
    var id_source;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i]?.id == params.target) {
        id_target = elements[i]?.data?.id;
        if (id_target != undefined) {
          break;
        }
      }
    }
    for (let i = 0; i < elements.length; i++) {
      if (elements[i]?.id == params.source) {
        id_source = elements[i]?.data?.id;
        if (id_source != undefined) {
          break;
        }
      }
    }
    // Change to ids
    const edges = {
      prev_prod: id_source,
      next_prod: id_target,
    };
    saveEdge(parseInt(id_source), parseInt(id_target), edges, 0, -1);
    elements = addEdge(
      {
        ...params,
        type: "smoothstep",
        style: { strokeWidth: "5.0px" },
        animated: true,
      },
      elements,
    );
  } else {
    localStorage.setItem("source", null);
  }
  return elements;
};

export default connectElements;
