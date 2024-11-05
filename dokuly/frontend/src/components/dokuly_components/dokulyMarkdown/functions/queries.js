import React from "react";
import axios from "axios";
import { tokenConfig } from "../../../../configs/auth";

export const addNewNotesTab = (data) => {
  const promise = axios.put(
    "/api/documents/markdownNotesTab/add/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteNotesTab = (pk) => {
  const promise = axios.delete(
    `/api/documents/markdownNotesTab/delete/${pk}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const updateNotesTab = (data, pk) => {
  const promise = axios.put(
    `/api/documents/markdownNotesTab/edit/${pk}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getNotesTabs = (data) => {
  const promise = axios.put(
    "/api/documents/markdownNotesTab/get/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
