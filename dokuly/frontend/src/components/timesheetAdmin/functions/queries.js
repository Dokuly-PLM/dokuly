import React from "react";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

export const fetchTimetrackings = (yearFrom, yearTo) => {
  const promise = axios.get(
    `api/timetracking/get/allByYear/${yearFrom}/${yearTo}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchProjectTasks = (project_id) => {
  const promise = axios.get(
    `api/projects/get/tasks/${project_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchSelectedLogoImage = () => {
  const promise = axios.get(
    "api/files/images/fetchSelectedLogo/",
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchAllTasks = () => {
  const promise = axios.get("api/projects/get/tasksEnhanced/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
