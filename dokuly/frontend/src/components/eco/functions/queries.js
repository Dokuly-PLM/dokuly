import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

/**
 * Create a new ECO.
 * @param {Object} data - The ECO data
 * @returns {Promise} The new ECO
 */
export const createEco = (data) => {
  const promise = axios.post("/api/eco/create/", data, tokenConfig());
  return promise;
};

/**
 * Get a single ECO by ID.
 * @param {number} id - The ECO ID
 * @returns {Promise} The ECO data
 */
export const getEco = (id) => {
  const promise = axios.get(`/api/eco/get/${id}/`, tokenConfig());
  return promise;
};

/**
 * Get all ECOs.
 * @returns {Promise} Array of ECOs
 */
export const getAllEcos = () => {
  const promise = axios.get("/api/eco/get/", tokenConfig());
  return promise;
};

/**
 * Edit an existing ECO.
 * @param {number} id - The ECO ID
 * @param {Object} data - The updated ECO data
 * @returns {Promise} The updated ECO
 */
export const editEco = (id, data) => {
  const promise = axios.put(`/api/eco/edit/${id}/`, data, tokenConfig());
  return promise;
};

/**
 * Delete an ECO.
 * @param {number} id - The ECO ID
 * @returns {Promise} Deletion result
 */
export const deleteEco = (id) => {
  const promise = axios.delete(`/api/eco/delete/${id}/`, tokenConfig());
  return promise;
};

// ============== Affected Items ==============

/**
 * Get all affected items for an ECO.
 * @param {number} ecoId - The ECO ID
 * @returns {Promise} Array of affected items
 */
export const getAffectedItems = (ecoId) => {
  const promise = axios.get(`/api/eco/${ecoId}/affectedItems/`, tokenConfig());
  return promise;
};

/**
 * Add a new affected item to an ECO.
 * @param {number} ecoId - The ECO ID
 * @returns {Promise} The new affected item
 */
export const addAffectedItem = (ecoId) => {
  const promise = axios.post(`/api/eco/${ecoId}/affectedItems/add/`, {}, tokenConfig());
  return promise;
};

/**
 * Edit an affected item.
 * @param {number} id - The affected item ID
 * @param {Object} data - The updated data (part_id, pcba_id, assembly_id, document_id, comment)
 * @returns {Promise} The updated affected item
 */
export const editAffectedItem = (id, data) => {
  const promise = axios.put(`/api/eco/affectedItems/${id}/edit/`, data, tokenConfig());
  return promise;
};

/**
 * Delete an affected item.
 * @param {number} id - The affected item ID
 * @returns {Promise} Deletion result
 */
export const deleteAffectedItem = (id) => {
  const promise = axios.delete(`/api/eco/affectedItems/${id}/delete/`, tokenConfig());
  return promise;
};

/**
 * Get all ECOs that reference a specific item.
 * @param {string} app - The app type ('parts', 'pcbas', 'assemblies', 'documents')
 * @param {number} itemId - The item ID
 * @returns {Promise} Array of ECOs with basic info
 */
export const getEcosForItem = (app, itemId) => {
  const promise = axios.get(`/api/eco/forItem/${app}/${itemId}/`, tokenConfig());
  return promise;
};
