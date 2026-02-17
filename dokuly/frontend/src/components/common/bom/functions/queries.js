import axios from "axios";
import { tokenConfig } from "../../../../configs/auth";

export const getBom = (bom_id, app) => {
  const promise = axios.get(
    `api/assembly_bom/${app}/${bom_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getBomItemsById = (id, app) => {
  const promise = axios.get(
    `api/assembly_bom/getItems/${app}/${id}/`,
    tokenConfig()
  );

  return promise.then((res) => res.data);
};

export const getBomWithLinkedParts = (id, app) => {
  const promise = axios.get(
    `api/assembly_bom/getItemsWithLinkedParts/${app}/${id}/`,
    tokenConfig(),
  );
  return promise.then((res) => res.data);
};

export const getLinkedParts = (assembly_ids, part_ids, pcba_ids) => {
  const assemblyIdStr =
    assembly_ids && assembly_ids.length > 0 ? assembly_ids.join(",") : "-1";
  const partIdStr = part_ids && part_ids.length > 0 ? part_ids.join(",") : "-1";
  const pcbaIdStr = pcba_ids && pcba_ids.length > 0 ? pcba_ids.join(",") : "-1";

  // Construct the URL with IDs
  const url = `api/parts/getLinkedParts/${assemblyIdStr}/${partIdStr}/${pcbaIdStr}/`;

  // Make the request
  const promise = axios.get(url, tokenConfig());

  // Return the promise resolving with response data
  return promise.then((res) => res.data);
};

export const editBomItem = (itemId, updatedData) => {
  // Construct the URL for the edit_bom_item view
  const url = `/api/assembly_bom/editItem/${itemId}/`;
  // Make the PUT request
  const promise = axios.put(url, updatedData, tokenConfig());

  // Return the promise resolving with response data
  return promise.then((res) => res.data);
};

export const removeBomItem = (item_id) => {
  // Construct the URL for the remove_bom_item view
  const url = `/api/assembly_bom/removeItem/${item_id}/`;

  // Make the DELETE request
  const promise = axios.delete(url, tokenConfig());

  // Return the promise resolving with response data
  return promise.then((res) => res.data);
};

/**
 * Method to clear BOM.
 *
 * @param {*} bom_id
 * @returns
 */
export const clearBom = (bom_id) => {
  const url = `/api/assembly_bom/${bom_id}/clearBom/`;

  const promise = axios.put(url, {}, tokenConfig());
  return promise.then((res) => res);
};

export const addBomItem = (bom_id) => {
  const url = `/api/assembly_bom/${bom_id}/addItem/`;

  const promise = axios.put(url, {}, tokenConfig());

  // Return the promise resolving with response data
  return promise.then((res) => res.data);
};

export const matchBomItemsWithParts = (bomId) => {
  const url = `/api/assembly_bom/${bomId}/matchItemsWithParts/`;

  return axios
    .put(url, {}, tokenConfig())
    .then((res) => res.data)
    .catch((error) => {
      throw error;
    });
};

export const addBomItemWithValues = (
  bom_id,
  temporary_mpn,
  designator,
  quantity,
  is_mounted
) => {
  const data = {
    temporary_mpn: temporary_mpn,
    designator: designator,
    quantity: quantity,
    is_mounted: is_mounted,
  };

  const url = `/api/assembly_bom/${bom_id}/addItemWithContents/`;

  return axios
    .put(url, data, tokenConfig())
    .then((res) => res.data)
    .catch((error) => {
      toast.error("Error in addBomItemWithValues:", error);
    });
};

/**
 * Common method to get revisoins.
 *
 * @param {*} app
 * @param {*} id
 * @returns
 */
export const getRevisions = (app, id) => {
  const url = `api/${app}/get/revisions/${id}/`;

  const promise = axios.get(url, tokenConfig());

  // Return the promise resolving with response data
  return promise.then((res) => res.data);
};

export const getBomCost = (bom_id, app, quantity) => {
  const promise = axios.get(
    `api/assembly_bom/get/bomCost/${app}/${bom_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};
