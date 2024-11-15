import axios from "axios";
import { tokenConfig } from "../../../configs/auth";
import { toast } from "react-toastify";

export const createNewProduction = (data) => {
  const promise = axios.post(
    "/api/productions/createNewProduction/",
    data,
    tokenConfig()
  );
  return toast.promise(promise, {
    pending: "Creating new production...",
    success: "New production created! 🎉",
    error: "Error creating new production.",
  });
};

export const searchProductionItems = (query) => {
  const promise = axios.put(
    "/api/productions/searchProductionItems/",
    { query }, // Send the search query in the request body
    tokenConfig()
  );
  return promise;
};

export const getSingleProducedItem = (id) => {
  const promise = axios.get(`/api/production/${id}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProducedItemTestData = (full_part_number, serial_number) => {
  const promise = axios.get(
    `/api/production/test-data/get/${full_part_number}/${serial_number}/`,
    tokenConfig()
  );
  return promise;
};

export const createNewProductionLot = (data) => {
  const promise = axios.post("/api/lots/create/", data, tokenConfig());
  return toast.promise(promise, {
    pending: "Creating new production lot...",
    success: "New production lot created!",
    error: "Error creating new production lot.",
  });
};

export const editLot = (lotId, data) => {
  const promise = axios.put(`/api/lots/${lotId}/`, data, tokenConfig());
  return toast.promise(promise, {
    pending: "Updating lot...",
    success: "Lot updated successfully.",
    error: "Error updating lot.",
  });
};

export const editSerialNumber = (serialNumberId, data) => {
  const promise = axios.put(
    `/api/lots/serialNumbers/update/${serialNumberId}/`,
    data,
    tokenConfig()
  );
  return toast.promise(promise, {
    pending: "Updating serial number...",
    success: "Serial number updated successfully.",
    error: "Error updating serial number.",
  });
};

export const deleteLot = (lotId) => {
  const promise = axios.delete(`/api/lots/delete/${lotId}/`, tokenConfig());
  return toast.promise(promise, {
    pending: "Deleting lot...",
    success: "Lot deleted successfully.",
    error: "Error deleting lot.",
  });
};

export const getProducedItemMeasurements = (identifier, serial_number) => {
  return axios.get(`/api/production/test-data/get/${identifier}/${serial_number}/`, tokenConfig());
};