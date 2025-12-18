import axios from "axios";
import { formDataWithToken, tokenConfig } from "../../../configs/auth";
import { toast } from "react-toastify";

/**
 * Get a list of attached files by request data.
 * Its basically a GET request, but as the data is passed through `data` a PUT request is used.
 *
 * @param {*} data must contain 'file_ids' a list of file ids.
 * @returns a list of files for e.g. a file table.
 */
export const get_files = (data) => {
  const promise = axios.put("api/files/get/files/", data, tokenConfig());
  return promise;
};

/**
 * Push a file to the back-end for processing and storage.
 *
 * @param {*} data, contains the 'id' and the 'file' and 'file_type' fields.
 * @returns HTML 200 code.
 */
export const uploadFile = (id, data) => {
  const promise = axios
    .post(`api/files/upload/file/${id}/`, data, formDataWithToken())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });
  return toast.promise(promise, {
    pending: "Uploading file...",
    success: "File uploaded successfully",
    error: "An error occurred",
  });
};

/**
 * Push a file to the back-end for processing and storage.
 * This query also creates a new file object in the database.
 * @param {JSON} data - The query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 */
export const uploadFileCreateNewFileEntity = (data) => {
  const promise = axios
    .post("api/files/post/upload_with_new_row/", data, formDataWithToken())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });
  return toast.promise(promise, {
    pending: "Uploading file...",
    success: "File uploaded successfully",
    error: "An error occurred",
  });
};

/**
 * Push multiple files to the back-end for processing and storage.
 * This query also creates new file objects in the database.
 * @param {FormData} data - The query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 */
export const uploadFilesCreateNewFilesEntities = (data) => {
  const promise = axios
    .post(
      "api/files/post/upload_multiple_with_new_rows/",
      data,
      formDataWithToken(),
    )
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred during multi-upload");
      throw err;
    });
  return toast.promise(promise, {
    pending: "Uploading files...",
    success: "Files uploaded successfully",
    error: "An error occurred",
  });
};

/**
 * Connects the uploaded file with the assembly.
 * @param {Number} fileId - A file entity's id number.
 * @param {JSON} data - The query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 */
export const connectFileWithAsm = (fileId, data) => {
  const promise = axios.put(
    `api/assemblies/files/connectFileToAsm/${fileId}/`,
    data,
    tokenConfig(),
  );
  return promise;
};

/**
 * Connects the uploaded file with the part.
 * @param {Number} fileId - A file entity's id number.
 * @param {JSON} data - The query payload.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie,
 */
export const connectFileWithPart = (fileId, data) => {
  const promise = axios.put(
    `api/parts/files/connectFileToPart/${fileId}/`,
    data,
    tokenConfig(),
  );
  return promise;
};

export const connectFileWithPcba = (pcbaId, fileId) => {
  const promise = axios.put(
    `api/pcbas/connectFileToPcba/${pcbaId}/${fileId}/`,
    tokenConfig(),
  );
  return promise;
};

export const archiveFile = (id) => {
  const promise = axios
    .put(`api/files/archive/${id}/`, {}, tokenConfig())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });

  return toast.promise(promise, {
    pending: "Archiving file...",
    success: "File archived successfully",
    error: "An error occurred",
  });
};

export const deleteFile = (id) => {
  const promise = axios
    .delete(`api/files/delete/${id}/`, tokenConfig())
    .then((res) => res)
    .catch((err) => {
      toast.error("An error occurred");
      throw err;
    });

  return toast.promise(promise, {
    pending: "Deleting file...",
    success: "File deleted successfully",
    error: "An error occurred",
  });
};
