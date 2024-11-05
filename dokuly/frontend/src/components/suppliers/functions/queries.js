import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

export const createSupplier = (data) => {
  const promise = axios.post("api/supplier/create/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getSuppliers = () => {
  const promise = axios.get("api/supplier/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getSupplier = (supplierId) => {
  const promise = axios.get(`api/supplier/get/${supplierId}/`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const updateSupplier = (supplierId, data) => {
  const promise = axios.put(
    `api/supplier/update/${supplierId}/`,
    data,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteSupplier = (supplierId) => {
  const promise = axios.delete(
    `api/supplier/delete/${supplierId}/`,
    tokenConfig(),
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
