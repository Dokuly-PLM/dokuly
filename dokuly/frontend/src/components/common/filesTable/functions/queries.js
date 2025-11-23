import axios from "axios";

import {
  formDataWithToken,
  tokenConfig,
  tokenConfigFileRequest,
} from "../../../../configs/auth";

import { toast } from "react-toastify";
import { get_files } from "../../../files/functions/queries";

export const connectFileToObject = (
  app_str,
  po_id,
  file_id,
  data,
  useProcessingToast = false
) => {
  const url = `api/${app_str}/add_file/${po_id}/${file_id}/`;
  const promise = axios.put(url, data, tokenConfig());
  if (useProcessingToast) {
    return toast.promise(promise, {
      pending: "Processing file...",
      success: "File processed successfully",
      error: "An error occurred",
    });
  }
  return promise
    .then((response) => response.data)
    .catch((error) => error.response || error);
};

export const getFile = (fileUri) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("You are not logged in.");
    return;
  }
  return axios
    .get(fileUri, {
      responseType: "blob",
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Token ${token}`,
      },
    })
    .then((response) => response.data);
};

/**
 * Get files for a specific entity (part, assembly, pcba, document) by ID
 * Uses the same method as the files table - get file IDs from entity, then fetch file details
 * @param {string} app - Entity type: "parts", "assemblies", "pcbas", "documents"
 * @param {number} entityId - ID of the entity
 * @returns {Promise} Promise resolving to file list
 */
export const getFilesForEntity = async (app, entityId) => {
  try {
    // For parts, get the part data which includes the files ManyToManyField (array of file IDs)
    if (app === "parts") {
      const partResponse = await axios.get(`api/v1/parts/${entityId}/`, tokenConfig());
      if (partResponse.data?.files && Array.isArray(partResponse.data.files) && partResponse.data.files.length > 0) {
        // Use the same method as FilesTable - get_files with file_ids
        const filesResponse = await get_files({ file_ids: partResponse.data.files });
        if (filesResponse.data && Array.isArray(filesResponse.data)) {
          // Format to match what FileSelector expects (similar to fetchFileList format)
          return filesResponse.data
            .filter((file) => !file.archived)
            .map((file, index) => ({
              row_number: String(index + 1),
              file_id: file.id,
              id: file.id,
              title: file.display_name || file.file_name || `File ${file.id}`,
              display_name: file.display_name,
              file_name: file.file_name || "",
              type: "Generic",
              uri: file.uri || `api/files/download/file/${file.id}/`,
              view_uri: `api/files/view/${file.id}/`,
              is_archived: file.archived || false,
            }));
        }
      }
    }
    
    // Fallback to fetchFileList for other entity types or if files field is empty
    const url = `api/${app}/fetchFileList/${entityId}/`;
    const response = await axios.get(url, tokenConfig());
    if (response.status === 200) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching files for entity:", error);
    toast.error("Failed to fetch files for revision.");
    return [];
  }
};
