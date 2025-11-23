import axios from "axios";
import { tokenConfig } from "../../../configs/auth";
import { toast } from "react-toastify";

export const editReleaseState = (id, app, releaseState) => {
  const data = { app: app, id: id, release_state: releaseState };
  const promise = axios.put(
    "api/items/edit/releaseState/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getParts = () => {
  const promise = axios.get("api/parts/get/unarchived/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getPartTypes = () => {
  const promise = axios.get("api/parts/get/partTypes/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editPartType = (id, data) => {
  const promise = axios.put(
    `api/parts/put/partType/${id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const newPartType = (data) => {
  const promise = axios.post("api/parts/post/partType/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deletePartType = (id) => {
  const emptyData = {};
  const promise = axios.post(
    `api/parts/delete/partType/${id}/`,
    emptyData,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editPart = (id, data) => {
  const promise = axios.put(`api/parts/editPart/${id}/`, data, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editPartInformation = (partId, data) => {
  const promise = axios.put(
    `/api/parts/put/partInformation/${partId}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error !== null) {
    return error;
  }
  return dataPromise;
};

export const fetchPart = (id) => {
  const promise = axios.get(`api/parts/singlePart/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getOnOrder = (part_id) => {
  const promise = axios.get(`api/parts/onOrder/${part_id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getUnarchivedParts = () => {
  const promise = axios.get("api/parts/get/unarchived/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getPartsLatestRevisions = () => {
  const promise = axios.get("api/parts/get/latestRevisions/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getPartsTable = () => {
  const promise = axios.get("api/parts/get/parts_table/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const archivePart = (id) => {
  const promise = axios.put(`api/parts/archivePart/${id}/`, {}, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const newPart = (data) => {
  const toastPromise = axios
    .post("api/parts/createNewPart/", data, tokenConfig())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });
  return toast.promise(toastPromise, {
    pending: "Sending data to server...",
    error: "An error occurred",
  });
};

export const newPartRevision = (id, revisionType = 'major') => {
  const promise = axios.post(`api/parts/newRevision/${id}/`, { revision_type: revisionType }, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editPartErrata = (id, part) => {
  const promise = axios.put(`api/parts/put/errata/${id}/`, part, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editPartRevisionNotes = (id, part) => {
  const promise = axios.put(
    `api/parts/editPartRevisionNotes/${id}/`,
    part,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchAltParts = (ids) => {
  const promise = axios.get(`api/parts/alt/${ids}/`, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const addNewAlternativePart = (parentId, part) => {
  const promise = axios.put(
    `api/parts/alternative/add/${parentId.toString()}/${part.toString()}/`, // Add a trailing slash at the end
    {},
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const removeAlternativePart = (parentId, partID) => {
  const promise = axios.delete(
    `api/parts/alternative/remove/${parentId.toString()}/${partID.toString()}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const addInventory = (inventory) => {
  const promise = axios.post("api/inventory/addInv/", inventory, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchStock = (partId) => {
  const promise = axios.get(
    `api/inventory/fetchStock/${partId}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchLocations = () => {
  const promise = axios.get("api/locations/fetch/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchOwners = () => {
  const promise = axios.get("api/customers/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchOwner = (id) => {
  const promise = axios.get(`api/customers/owner/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editFullPart = (id, part) => {
  const promise = axios.put(`/api/parts/${id}/`, part, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const clearPartSellers = (id) => {
  const promise = axios.put(`/api/parts/update/sellers/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const findUsedInPCBA = (id) => {
  const promise = axios.get(`api/parts/get/usedIdPcba/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * Get a list of attached files on a part.
 *
 * @param {*} id
 * @returns a list of files for e.g. a file table.
 */
export const fetchFileList = (id) => {
  const promise = axios.get(`api/parts/fetchFileList/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getCurrencyConversions = () => {
  const promise = axios.get(
    "api/currency/get/conversion_rates/",
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getOrganizationCurrency = () => {
  const promise = axios.get(
    "api/currency/get/organization_currency/",
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const convertThreeMFToGltf = (file_id) => {
  const promise = axios.get(
    `api/parts/get/convert_threemf_to_gltf_view/${file_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  return dataPromise;
};


export const updateThumbnail = (id, imageId) => {
  const toastPromise = axios
    .put(`api/parts/put/update_thumbnail/${id}/${imageId}/`, {}, tokenConfig())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred while updating the thumbnail");
      throw err;
    });
  return toast.promise(toastPromise, {
    pending: "Updating thumbnail...",
    success: "Thumbnail updated successfully",
    error: "Failed to update thumbnail",
  });
};

export const searchPartsByMpn = (mpn) => {
  const promise = axios.put(
    "api/parts/search_by_mpn/",
    { mpn },
    tokenConfig()
  );
  return promise;
};

export const searchNexarParts = (mpn, limit = 10) => {
  const promise = axios.post(
    "api/parts/nexar/search/",
    { mpn, limit },
    tokenConfig()
  );
  return promise;
};

export const checkNexarConfig = () => {
  const promise = axios.get(
    "api/parts/nexar/check_config/",
    tokenConfig()
  );
  return promise;
};

export const createPricesFromNexar = (partId, sellersData) => {
  const promise = axios.post(
    "api/parts/nexar/create_prices/",
    { part_id: partId, sellers: sellersData },
    tokenConfig()
  );
  return promise;
};

export const searchDigikeyParts = (keyword, limit = 10) => {
  const promise = axios.post(
    "api/parts/digikey/search/",
    { keyword, limit },
    tokenConfig()
  );
  return promise;
};

export const getDigikeyProductDetails = (digikeyPartNumber) => {
  const promise = axios.post(
    "api/parts/digikey/product_details/",
    { digikey_part_number: digikeyPartNumber },
    tokenConfig()
  );
  return promise;
};

export const checkDigikeyConfig = () => {
  const promise = axios.get("api/parts/digikey/check_config/", tokenConfig());
  return promise;
};

export const testDigikeyConnection = (testKeyword = "resistor") => {
  const promise = axios.post(
    "api/parts/digikey/test_connection/",
    { test_keyword: testKeyword },
    tokenConfig()
  );
  return promise;
};
