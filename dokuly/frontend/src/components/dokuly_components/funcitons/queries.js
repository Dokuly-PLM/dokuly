import axios from "axios";
import {
  formDataWithToken,
  tokenConfig,
  tokenConfigFileRequest,
} from "../../../configs/auth";

export const searchPartsGlobal = (query) => {
  const promise = axios.put(
    "api/global_part_search/", // Update the endpoint to match the correct URL pattern
    { query }, // Send the search query in the request body
    tokenConfig()
  );
  return promise;
};

export const getImage = (imageId, version = "compressed") => {
  const promise = axios.get(`api/files/image/${imageId}/${version}/`, {
    ...tokenConfig(),
    responseType: "blob", // Ensures the response is treated as a Blob
  });
  return promise;
};

export const createPOFromBom = (data) => {
  const promise = axios.post(
    "api/purchasing/createFromBOM/",
    data,
    tokenConfig()
  );
  return promise;
};
