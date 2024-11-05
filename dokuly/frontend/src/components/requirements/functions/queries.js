import axios from "axios";
import {
  formDataWithToken,
  tokenConfig,
  tokenConfigFileRequest,
} from "../../../configs/auth";
import { toast } from "react-toastify";

export const getRequirementSet = (id) => {
  const promise = axios.get(
    `api/requirements/get/requirementSet/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editRequirementSet = (id, data) => {
  const promise = axios.put(
    `api/requirements/edit/requirementSet/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteRequirementsSet = (id) => {
  const promise = axios.delete(
    `api/requirements/delete/requirementSet/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getRequirementSets = () => {
  const promise = axios.get(
    "api/requirements/get/requirementSets/",
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const createRequirementSet = (data) => {
  const promise = axios.post(
    "api/requirements/create/requirementSet/",
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const createRequirement = (set_id) => {
  const data = {};
  const promise = axios.post(
    `api/requirements/create/requirement/${set_id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const createSubRequirement = (parent_id, requirement_set_id) => {
  const data = { requirement_set: requirement_set_id };
  const promise = axios.post(
    `api/requirements/create/subRequirement/${parent_id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editRequirement = (id, data) => {
  const promise = axios.put(
    `api/requirements/edit/requirement/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteRequirement = (id) => {
  const promise = axios.delete(
    `api/requirements/delete/requirement/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getTopRequirementsBySet = (id) => {
  const promise = axios.get(
    `api/requirements/get/topRequirementsBySet/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getRequirementsBySet = (id) => {
  const promise = axios.get(
    `api/requirements/get/requirementsBySet/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getRequirement = (id) => {
  const promise = axios.get(
    `api/requirements/get/requirement/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getRequirementsByParent = (id) => {
  const promise = axios.get(
    `api/requirements/get/requirementsByParent/${id}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
