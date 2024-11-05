import axios from "axios";

import {
  formDataWithToken,
  tokenConfig,
  tokenConfigFileRequest,
} from "../../../../configs/auth";

import { toast } from "react-toastify";

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
