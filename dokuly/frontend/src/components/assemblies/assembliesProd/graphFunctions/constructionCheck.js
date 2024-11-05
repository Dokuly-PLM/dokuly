import React from "react";
import loadNodes from "./loadNodes";

export const constructionCheck = (asm, construction, nodesForBlueprint) => {
  // Find nodes ids, find node elements and elementData, restructure construction connections so we can compare them to the blueprint connections
  let elements = loadNodes(nodesForBlueprint, [], 1, asm.id);
  let blueprintCons = [];
  elements.map((element) => {
    if (element.source || element.target) {
      blueprintCons.push(element);
    }
  });
  let constructionCons = [];
  let prev_prod_ids = [];
  let next_prod_ids = [];
  let next_pcba_ids = [];
  let prev_pcba_ids = [];
  construction.map((prodNode) => {
    if (prodNode.source || prodNode.target) {
      constructionCons.push(prodNode);
    }
    if (constructionCons.length != blueprintCons.length) {
      localStorage.setItem("conCheck", 0);
      return;
    }
    if (prodNode != null && prodNode.data != undefined) {
      if (
        prodNode.data.next_prod != null &&
        prodNode.data.next_prod != undefined
      ) {
        prodNode.data.next_prod.map((next) => {
          next_prod_ids.push(next);
        });
      }
      if (
        prodNode.data.prev_prod != null &&
        prodNode.data.prev_prod != undefined
      ) {
        prodNode.data.prev_prod.map((prev) => {
          prev_prod_ids.push(prev);
        });
      }
    }
  });

  elements.map((pcbaNode) => {
    if (pcbaNode != null && pcbaNode.data != undefined) {
      if (
        pcbaNode.data.next_pcba != null &&
        pcbaNode.data.next_pcba != undefined
      ) {
        pcbaNode.data.next_pcba.map((next) => {
          next_pcba_ids.push(next);
        });
      }
      if (
        pcbaNode.data.prev_pcba != null &&
        pcbaNode.data.prev_pcba != undefined
      ) {
        pcbaNode.data.prev_pcba.map((prev) => {
          prev_pcba_ids.push(prev);
        });
      }
    }
  });

  let prevElements = [];
  let nextElements = [];

  prev_prod_ids.map((prev_id) => {
    let elementData = construction.filter(
      (el) => parseInt(el?.data?.id) === parseInt(prev_id),
    );
    prevElements.push(elementData);
  });

  next_prod_ids.map((next_id) => {
    let elementData = construction.filter(
      (el) => parseInt(el?.data?.id) === parseInt(next_id),
    );
    nextElements.push(elementData);
  });

  let conChecks = [];

  constructionCons.map((connection) => {
    let nextData = null;
    if (
      Object.prototype.toString.call(connection.target) === "[object Array]"
    ) {
      nextData = [];
      connection.target.map((target) => {
        let element = construction.filter(
          (el) => parseInt(el?.data?.id) === parseInt(target),
        );
        nextData.push(element);
      });
    } else {
      nextData = construction.filter(
        (el) => parseInt(el?.data?.id) === parseInt(connection.target),
      );
    }
    let prevData = null;
    if (
      Object.prototype.toString.call(connection.source) === "[object Array]"
    ) {
      prevData = [];
      connection.source.map((source) => {
        let element = construction.filter(
          (el) => parseInt(el?.data?.id) === parseInt(source),
        );
        prevData.push(element);
      });
    } else {
      prevData = construction.filter(
        (el) => parseInt(el?.data?.id) === parseInt(connection.source),
      );
    }
    if (prevData?.length > 1) {
      prevData.map((prev) => {
        const newCon = {
          source: prev?.data?.pcba_part_number,
          target: nextData[0]?.data?.pcba_part_number,
        };
        conChecks.push(newCon);
      });
    }
    if (prevData[0] != null && nextData[0] != null) {
      const newCon = {
        source: prevData[0]?.data.pcba_part_number,
        target: nextData[0]?.data.pcba_part_number,
        id: connection.id,
      };
      conChecks.push(newCon);
    }
  });
  let flag = true;
  if (conChecks.length != 0) {
    blueprintCons.map((connection, index) => {
      if (
        parseInt(connection.source) !== parseInt(conChecks[index].source) &&
        parseInt(connection.target) !== parseInt(conChecks[index].target)
      ) {
        flag = false;
      }
    });
  } else {
    flag = false;
  }
  if (flag) {
    return true;
  } else {
    return false;
  }
};
