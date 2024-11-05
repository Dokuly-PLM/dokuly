import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { tokenConfig } from "../../../../configs/auth";

export const createIssue = (data) => {
  const promise = axios.post("api/issues/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getIssues = (objectId, app) => {
  const promise = axios.get(`api/issues/${objectId}/${app}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editIssue = (id, data) => {
  const promise = axios.put(`api/issues/${id}/`, data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteIssue = (id) => {
  const promise = axios.delete(`api/issues/delete/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getIssue = (id) => {
  const promise = axios.get(`api/issues/${id}`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const closeIssue = (id, data) => {
  const promise = axios.put(`api/issues/close/${id}/`, data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const reopenIssue = (id, data) => {
  const promise = axios.put(`api/issues/reopen/${id}/`, data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
