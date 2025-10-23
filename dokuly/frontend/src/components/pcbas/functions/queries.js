import axios from "axios";
import {
  formDataWithToken,
  tokenConfig,
  tokenConfigFileRequest,
} from "../../../configs/auth";
import { toast } from "react-toastify";

export const fetchSinglePcba = (id) => {
  const promise = axios.get(`api/pcbas/fetch/pcba/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchPcbas = () => {
  const promise = axios.get("api/pcbas/fetch/pcbas/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchNewestPcbaRevisions = () => {
  const promise = axios.get("api/pcbas/get/latestRevisions/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const updatePcbLayers = (id, pcb_layers) => {
  const data = { pcb_layers };
  const promise = axios.put(
    `api/pcbas/put/pcbLayers/${id}/`,
    data,
    tokenConfig(),
  );
  return toast.promise(promise, {
    pending: "Updating PCB layers...",
    success: "Update complete",
    error: "Failed to update PCBA",
  });
};

/**
 * Edit PCBA.
 * @param {*} data, contains the 'pcba_id' and the 'csv_file' fields.
 * @returns HTML 200 code.
 */
export const editPcba = (id, data) => {
  const promise = axios
    .put(`api/pcbas/edit/${id}/`, data, tokenConfig())
    .then((res) => res)
    .catch((err) => {
      let errorMsg = "";
      if (err?.response?.data) {
        errorMsg = err?.response?.data;
      } else if (err?.message) {
        errorMsg = err?.message;
      }
      toast.error(`An error occurred when updating the PCBA ${errorMsg}`);
    });
  return toast.promise(promise, {
    pending: "Attempting update...",
    success: "Update complete",
    error: "Failed to update PCBA",
  });
};

export const createNewPcba = (data) => {
  const promise = axios.post("api/pcbas/createNewPcba/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const createNewRevision = (id, revisionType = 'major') => {
  const promise = axios.put(`api/pcbas/newRevision/${id}/`, { revision_type: revisionType }, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const archivePcba = (id) => {
  const promise = axios.put(`api/pcbas/archive/${id}/`, {}, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const handleFileQuery = (files) => {
  // TODO fix missing type control.
  if (typeof files == Number) {
    const deletePromise = axios.put(
      "api/pcbas/handleFiles",
      files,
      tokenConfig(),
    );
    const deleteData = deletePromise.then((res) => res.data);
    const deleteError = deletePromise.catch((err) => err);
    if (deleteError != null) {
      return deleteError;
    }
    return deleteData;
  }
  const promise = axios.put("api/pcbas/handleFiles/", files, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const autoFetchMissingParts = (data) => {
  const promise = axios
    .put("api/pcbas/bulkSearchComponentVault/", data, tokenConfig())
    .then((res) => res)
    .catch((err) => err);
  return toast.promise(promise, {
    pending: "Finding possible matches for MPNs in BOM...",
    success: "Query complete",
    error: "Error finding matches, try again later.",
  });
};

/**
 * Push a pcba file to the back-end for processing and storage.
 *
 * @param {*} data, contains the 'pcba_id' and the 'pcba_file' and 'file_type' fields.
 * @returns HTML 200 code.
 */
export const uploadPcbaFile = (data) => {
  const promise = axios.post(
    "api/pcbas/uploadPcbaFile/",
    data,
    tokenConfigFileRequest(),
  );
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const getRevisions = (id) => {
  const promise = axios.get(`api/pcbas/get/revisions/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const renderSvg = (id) => {
  const promise = axios.get(`api/pcbas/renderSvg/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editPcbaRevisionNotes = (id, notes) => {
  const promise = axios.put(
    `api/pcbas/update/revisionNotes/${id}/`,
    notes,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editPcbaCommentsNextRev = (id, notes) => {
  const promise = axios.put(
    `api/pcbas/update/commentsNextRev/${id}/`,
    notes,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchLastPcba = () => {
  const promise = axios.get("api/pcbas/get/last/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const saveProdFile = (data) => {
  const promise = axios.post("api/files/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const fetchFilesQ = (objectId, objectType) => {
  const promise = axios.get(
    `api/files/get/byId/${objectId}/${objectType}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const createProdFileConnection = (prodId, data) => {
  const promise = axios.put(
    `api/files/put/production/${prodId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const clearEditHistoryProd = (prodId) => {
  const promise = axios.put(
    `api/production/clear/editHistory/${prodId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const editSoftwareInfo = (prodId, fileId, data) => {
  const promise = axios.put(
    `api/production/edit/softwareInfo/${prodId}/${fileId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Get a list of attached files on a PCBA.
 *
 * @param {*} pcbaId
 * @returns a list of files for e.g. a file table.
 */
export const fetchFileList = (pcbaId) => {
  const promise = axios.get(
    `api/pcbas/fetchFileList/${pcbaId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Fetches a file as an attachment.
 *
 * @param {Number} fileId - A row's id in the file table.
 * @returns a file attachment.
 */
export const fetchSingleFile = (fileId) => {
  const promise = axios.get(
    `api/files/download/file/${fileId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Uploads a file to the server.
 * This query also creates a new file row in database.
 * @param {JSON} data - A row's id in the file table.
 * @returns a file entity.
 */
export const uploadFile = (data) => {
  const promise = axios.post(
    "api/files/post/upload_with_new_row/",
    data,
    formDataWithToken(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const removeGerberFile = (pcbaId) => {
  const promise = axios.delete(`api/pcbas/gerber/${pcbaId}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
