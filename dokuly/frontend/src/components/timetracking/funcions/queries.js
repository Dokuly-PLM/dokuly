import React from "react";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";
import { toast } from "react-toastify";

export const getTimeRecord = (id) => {
  const promise = axios.get(
    `api/timetracking/get/timeRecord/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * Reruns time records by user.
 */
export const getEmplyeeTimeRecords = () => {
  const promise = axios.get(
    "api/timetracking/get/timeRecordByUser/",
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getTaskTime = (project_id) => {
  const promise = axios.get(
    `api/timetracking/get/timeByProjectTasks/${project_id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 *
 * @param {*} data must contain the 'year' kwarg
 * @returns
 */
export const getEmployeeTimeRecordsByYear = (year) => {
  const promise = axios.get(
    `api/timetracking/get/timeRecordByUser/${year}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 *
 * @param {*} data must contain the 'isoWeek' kwarg
 * @returns
 */
export const getEmployeeTimeRecordsByWeek = (isoWeek) => {
  const promise = axios.get(
    `api/timetracking/get/timeRecordByUserByWeek/${isoWeek}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const setEmployeeTimeRecord = (data) => {
  const promise = axios.put(
    "api/timetracking/put/timeRecord/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const deleteTimeRecord = (id) => {
  const promise = axios.put(`api/timetracking/delete/${id}/`, {}, tokenConfig());
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const newCloneRecord = (id, data) => {
  const promise = axios.put(
    `api/timetracking/put/newCloneRecord/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchLastTimetracking = () => {
  const promise = axios
    .get("api/timetracking/get/lastEntry/", tokenConfig())
    .then((res) => res)
    .catch((err) => err);
  return toast.promise(promise, {
    pending: "Loading timetrack...",
    error: "Error fetching timetrack",
  });
};
