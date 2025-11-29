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
