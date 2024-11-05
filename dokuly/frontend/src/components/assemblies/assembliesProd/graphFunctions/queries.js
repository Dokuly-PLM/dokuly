import React from "react";
import axios from "axios";
import { tokenConfig } from "../../../../configs/auth";

export const fetchNodes = (id) => {
  const promise = axios.get(`api/production/nodes/${id}`, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const removeEdge = (source, target) => {
  const promise = axios.put(
    `api/production/removeEdge/${source}/${target}`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const saveEdge = (idSource, idTarget, edges, flag, asmId) => {
  // Flag: 0 for prod, 1 for pcba. AsmId will be -1 for prod graphs, using serialId as connector for relation in prod
  const promise =
    flag == 0
      ? axios.put(
          `api/production/addEdge/${idSource}/${idTarget}/`,
          edges,
          tokenConfig(),
        )
      : flag == 1 &&
        axios.put(
          `api/pcbas/saveEdge/${idSource}/${idTarget}/${asmId}/`,
          edges,
          tokenConfig(),
        );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const addIdToAddedNode = (nodeId, value) => {
  const promise = axios.put(
    `api/production/addSerialId/${nodeId}/${value}`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const removeNode = (nodeId, flag) => {
  const promise = axios.put(
    `api/production/removeNode/${nodeId}/${flag}`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchNodesForblueprint = (nodeIds) => {
  const promise = axios.get(
    `api/pcbas/fetchNodesBlueprint/${nodeIds.toString()}`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const saveBlueprint = (asmId) => {
  const promise = axios.put(`api/assemblies/saveBlueprint/${asmId}`);
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};
