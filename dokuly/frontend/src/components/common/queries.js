import React from "react";
import axios from "axios";

export const getUser = () => {
  const promise = axios.get("/api/auth/user", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const checkOrganizationSubscription = () => {
  const promise = axios.get(
    "/api/checkOrganizationSubscription/",
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getOrganization = () => {
  const promise = axios.get("/api/organizations/get/byUserId/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

// Setup config with token - helper function
export const tokenConfig = () => {
  // Get token from state
  const token = localStorage.getItem("token");

  // Headers
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  // If token, add to header config
  if (token) {
    config.headers["Authorization"] = `Token ${token}`;
  }
  return config;
};

export const getBomIssues = (app, dbObjectId) => {
  const promise = axios.get(
    `/api/issues/getBomIssues/${dbObjectId}/${app}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getRelatedProject = (relatedObjectId, app) => {
  const promise = axios.get(
    `/api/projects/getRelatedProject/${relatedObjectId}/${app}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getAllLots = () => {
  const promise = axios.get(`/api/lots/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getLot = (id) => {
  const promise = axios.get(`/api/lots/${id}`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getLotBomItems = (lotId) => {
  const promise = axios.get(`/api/lots/fetchBom/${lotId}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getLotSerialNumbers = (lotId) => {
  const promise = axios.get(
    `/api/lots/fetchSerialNumbers/${lotId}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getConnectedLotPos = (lotId) => {
  const promise = axios.get(
    `/api/lots/getConnectedPo/${lotId}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
