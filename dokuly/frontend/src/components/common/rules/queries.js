import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

/**
 * Check if an assembly meets release rules requirements
 * @param {number} assemblyId - Assembly ID
 * @param {number} projectId - Project ID (optional)
 * @return {Promise<AxiosResponse<any>>}
 */
export const checkAssemblyRules = (assemblyId, projectId = null) => {
  const url = projectId 
    ? `api/rules/check/assembly/${assemblyId}/?project_id=${projectId}`
    : `api/rules/check/assembly/${assemblyId}/`;
  const promise = axios.get(url, tokenConfig());
  return promise.then((res) => res);
};

/**
 * Check if a PCBA meets release rules requirements
 * @param {number} pcbaId - PCBA ID
 * @param {number} projectId - Project ID (optional)
 * @return {Promise<AxiosResponse<any>>}
 */
export const checkPcbaRules = (pcbaId, projectId = null) => {
  const url = projectId 
    ? `api/rules/check/pcba/${pcbaId}/?project_id=${projectId}`
    : `api/rules/check/pcba/${pcbaId}/`;
  const promise = axios.get(url, tokenConfig());
  return promise.then((res) => res);
};

/**
 * Check if a part meets release rules requirements
 * @param {number} partId - Part ID
 * @param {number} projectId - Project ID (optional)
 * @return {Promise<AxiosResponse<any>>}
 */
export const checkPartRules = (partId, projectId = null) => {
  const url = projectId 
    ? `api/rules/check/part/${partId}/?project_id=${projectId}`
    : `api/rules/check/part/${partId}/`;
  const promise = axios.get(url, tokenConfig());
  return promise.then((res) => res);
};

/**
 * Check if a document meets release rules requirements
 * @param {number} documentId - Document ID
 * @param {number} projectId - Project ID (optional)
 * @return {Promise<AxiosResponse<any>>}
 */
export const checkDocumentRules = (documentId, projectId = null) => {
  const url = projectId 
    ? `api/rules/check/document/${documentId}/?project_id=${projectId}`
    : `api/rules/check/document/${documentId}/`;
  const promise = axios.get(url, tokenConfig());
  return promise.then((res) => res);
};

/**
 * Check if an ECO meets release rules requirements
 * @param {number} ecoId - ECO ID
 * @param {number} projectId - Project ID (optional)
 * @return {Promise<AxiosResponse<any>>}
 */
export const checkEcoRules = (ecoId, projectId = null) => {
  const url = projectId 
    ? `api/rules/check/eco/${ecoId}/?project_id=${projectId}`
    : `api/rules/check/eco/${ecoId}/`;
  const promise = axios.get(url, tokenConfig());
  return promise.then((res) => res);
};
