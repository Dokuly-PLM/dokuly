import axios from "axios";
import { tokenConfig } from "../../../../configs/auth";

/**
 * Fetch all table views for a specific table
 * @param {string} tableName - Name of the table (e.g., 'parts', 'assemblies')
 * @returns {Promise} Axios promise
 */
export const fetchTableViews = (tableName) => {
  const promise = axios.get(
    `/api/table-views/?table_name=${tableName}`,
    tokenConfig()
  );
  return promise;
};

/**
 * Create a new table view
 * @param {Object} viewData - View data object
 * @param {string} viewData.table_name - Name of the table
 * @param {string} viewData.name - User-friendly name for the view
 * @param {Array} viewData.columns - List of column keys
 * @param {Object} viewData.filters - Active filters
 * @param {string} viewData.sorted_column - Key of sorted column
 * @param {string} viewData.sort_order - Sort order ('asc' or 'desc')
 * @param {boolean} viewData.is_shared - Whether view is shared with all users
 * @returns {Promise} Axios promise
 */
export const createTableView = (viewData) => {
  const promise = axios.post(
    "/api/table-views/",
    viewData,
    tokenConfig()
  );
  return promise;
};

/**
 * Update an existing table view
 * @param {number} viewId - ID of the view to update
 * @param {Object} viewData - Updated view data
 * @returns {Promise} Axios promise
 */
export const updateTableView = (viewId, viewData) => {
  const promise = axios.patch(
    `/api/table-views/${viewId}/`,
    viewData,
    tokenConfig()
  );
  return promise;
};

/**
 * Delete a table view
 * @param {number} viewId - ID of the view to delete
 * @returns {Promise} Axios promise
 */
export const deleteTableView = (viewId) => {
  const promise = axios.delete(
    `/api/table-views/${viewId}/`,
    tokenConfig()
  );
  return promise;
};

