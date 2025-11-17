import React from "react";
import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

export const getNextAvailableProjectNumber = () => {
  const promise = axios.get(
    "api/projects/get/nextAvailableProjectNumber/",
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const checkProjectNumberExists = (projectNumber) => {
  const promise = axios.post(
    "api/projects/post/checkProjectNumberExists/",
    { full_project_number: projectNumber },
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProjectName = (id) => {
  const promise = axios.get(
    `api/projects/get/projectName/${id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchProjects = () => {
  const promise = axios.get("api/projects/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProject = (project_id) => {
  const promise = axios.get(`api/projects/get/${project_id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProjectWithCustomer = (project_id) => {
  const promise = axios.get(
    `api/projects/withCustomer/get/${project_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProjectByCustomer = (customerId) => {
  const promise = axios.get(
    `api/projects/get/ProjectsByCustomer/${customerId}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getActiveProjectByCustomer = (customerId) => {
  const promise = axios.get(
    `api/projects/get/activeProjectsByCustomer/${customerId}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * Get all unarchived tasks.
 */
export const getTasks = () => {
  const promise = axios.get("api/projects/get/tasks/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getActiveProjectTasks = (id) => {
  const promise = axios.get(
    `api/projects/get/activeTasks/${id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProjectTasks = (id) => {
  const promise = axios.get(`api/projects/get/tasks/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const newProjectTask = (project_id, data) => {
  const promise = axios.put(
    `api/projects/create/task/${project_id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editProjectTask = (task_id, data) => {
  const promise = axios.put(
    `api/projects/put/task/${task_id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchGantt = (projectId) => {
  const promise = axios.get(
    `api/projects/gantt/get/${projectId}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const createGantt = (data) => {
  const promise = axios.post("api/projects/gantt/create/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getTestUser = () => {
  const promise = axios.get("api/organizations/get/testUser/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editGantt = (gantt_id, data) => {
  const promise = axios.put(
    `api/projects/gantt/put/${gantt_id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchProjectTags = (project_id) => {
  const promise = axios.get(
    `api/projects/get/tags/${project_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const addSubtask = (data) => {
  const promise = axios.put(`api/projects/addSubtask/`, data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const removeSubtask = (data) => {
  const promise = axios.put(`api/projects/removeSubtask/`, data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

//___________________________________________________________________
// Project access
export const addUserToProject = (project_id, user_id) => {
  const promise = axios.put(
    `api/projects/${project_id}/add_user/${user_id}/`,
    null,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const removeUserFromProject = (project_id, user_id) => {
  const promise = axios.put(
    `api/projects/${project_id}/remove_user/${user_id}/`,
    null,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProjectUsers = (project_id) => {
  const promise = axios.get(
    `api/projects/${project_id}/get_users/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

//___________________________________________________________________

//___________________________________________________________________
// Tasks
export const addTaskAssignee = (data) => {
  const promise = axios.put(
    `api/projects/addTaskAssignee/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const removeTaskAssignee = (data) => {
  const promise = axios.put(
    `api/projects/removeTaskAssignee/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getTaskAssignees = (task_id) => {
  const promise = axios.get(
    `api/projects/getTaskAssignees/${task_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
//___________________________________________________________________
