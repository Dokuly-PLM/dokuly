import React from "react";
import axios from "axios";
import { formDataWithToken, tokenConfig } from "../../../configs/auth";

export const updateDoc = (id, data) => {
  const promise = axios.put(
    `/api/documents/updateDoc/${id}/`,
    data,
    formDataWithToken()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editErrata = (id, data) => {
  const promise = axios.put(
    `/api/documents/update/errata/${id}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * Archive a single document
 * @param {*} id
 * @returns
 */
export const archiveDocument = (id) => {
  // PUT and POST takes (url, data, config), meaning token config must be the third argument.
  // If not the headers will be sent as data, and authentication will fail.
  const promise = axios.put(
    `/api/documents/put/setArchiveDocument/${id}/`, 0,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * Create a new document
 */
export const createNewDocument = (data) => {
  const promise = axios.post(
    "api/documents/createNewDocument/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Get all non-archived documents.
 * This fetches all revisions of all documents.
 */
export const fetchDocuments = () => {
  const promise = axios.get("api/documents/get/allEnhanced/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * @brief Get a single document
 *
 * @param {*} id Document id
 * @returns Document object
 */
export const getDocument = (id) => {
  const promise = axios.get(
    `api/documents/fetchDocument/${id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getDocumentsByIds = (ids) => {
  const promise = axios.get(
    `api/documents/getDocuments/${ids.join(",")}`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getLatestDocumentRevisions = () => {
  const promise = axios.get(
    "api/documents/get/latestRevisions/",
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
export const getLatestDocumentRevisionsFirst25 = () => {
  const promise = axios.get(
    "api/documents/get/getLatestRevisionsFirst25/",
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Get a list of attached files on a PCBA.
 *
 * @param {*} id
 * @returns a list of files for e.g. a file table.
 */
export const fetchFileList = (id) => {
  const promise = axios.get(
    `api/documents/fetchFileList/${id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * Push a file to the back-end for processing and storage.
 *
 * @param {*} data, contains the 'id' and the 'file' and 'file_type' fields.
 * @returns HTML 200 code.
 */
export const uploadFile = (data) => {
  const promise = axios.post(
    "api/documents/uploadFile/",
    data,
    formDataWithToken()
  );
  const dataPromise = promise.then((res) => res);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

// api/documents/get/revisions/<str:document_number>/<int:project>/

export const getDocumentRevisions = (document_number, project_id) => {
  const promise = axios.get(
    `api/documents/get/revisions/${document_number}/${project_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};


/**
 * get a single Assembly model based on id.
 *
 * @param {*} asm_id
 * @returns the reference list.
 */
 export const getAssembly = (asm_id) => {
  const promise = axios.get(
    `api/assemblies/fetchAssumbly/${asm_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * get a single Part model based on id.
 *
 * @param {*} part_id
 * @returns part item
 */
 export const getPart = (part_id) => {
  const promise = axios.get(`api/parts/get/part/${part_id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};


/**
 * get a single PCBA model based on id.
 *
 * @param {*} pcba_id
 * @returns pcba item
 */
 export const getPcba = (pcba_id) => {
  const promise = axios.get(`api/pcbas/fetchPcba/${pcba_id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};


/**
 * # Get all documents.
 * This function is made to align with the queries built in for the admin page.
 *
 * @returns TODO
 *
 * ## Example
 *
 * ```js
 * // Import the query.
 * import { getAllDocuments } from "../path_to_query";
 *
 * // Define the constant to store the data in.
 * const [documents, setDocuments] = useState([]);
 * // Fetch data using the query.
 * useEffect(() => {
 *   getAllDocuments().then((res) => {
 *     setDocuments(res.data);
 *   });
 * }, []);
 * ```
 */
 export const getAllDocuments = () => {
  const promise = axios.get("api/documents/get/allEnhanced/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};


/**
 * This query takes the reference list model ID as an argument.
 * A part, asm, or pcba will have a foreign key to a reference list.
 *
 * @param {*} reference_list_id
 * @returns the reference list.
 */
export const getReferenceDocuments = (reference_list_id) => {
  const promise = axios.get(
    `api/referenceList/get/references/${reference_list_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * # Add document to reference list.
 * - The data must contain the pcba, part or ams id on the following form: asm_id, pcba_id, part_id.
 * - The ID of the reference document to be added shall be on the form: reference_document_id
 * - An accompanying 'is_specification' [true/false] tag can be added. If this tag is missing, the tag is set to false.
 *
 * The put interface is a bit more extensive than the get interface to ensure that all reference_list entries are atteched to an object (asm, part, pcba etc.).
 *
 * @param {*} data
 * @returns "HTTP_200_OK"
 */
export const addReference = (data) => {
  const promise = axios.put(
    "api/referenceList/put/addReference/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

/**
 * # Remove references from reference list.
 * - The data must contain the pcba, part or ams id on the following form: asm_id, pcba_id, part_id.
 * - The ID of the reference document to be removed shall be on the form: reference_document_ids
 *
 * The put interface is a bit more extensive than the get interface to ensure that all reference_list entries are atteched to an object (asm, part, pcba etc.).
 *
 * @param {*} data
 * @returns "HTTP_200_OK"
 */
export const removeReferences = (data) => {
  const promise = axios.put(
    "api/referenceList/put/removeReferences/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
