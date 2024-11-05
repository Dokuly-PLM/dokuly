import axios from "axios";
import { tokenConfig } from "../../../configs/auth";
import { toast } from "react-toastify";

export const getPurchaseOrders = () => {
  const promise = axios.get("api/purchasing/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getPurchaseOrder = (purchase_order_id) => {
  const promise = axios.get(
    `api/purchasing/get/${purchase_order_id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const createPurchaseOrder = (data) => {
  const promise = axios.post("api/purchasing/create/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
export const updatePurchaseOrder = (data) => {
  const promise = axios.put(
    `api/purchasing/update/${data.id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deletePurchaseOrder = (id) => {
  const promise = axios.delete(`api/purchasing/delete/${id}/`, tokenConfig());
  return promise.then((res) => res);
};

// PoItem queries

export const getPoItemsByPoId = (po_id) => {
  const promise = axios.get(
    `api/purchase_order/getItems/${po_id}/`,
    tokenConfig()
  );
  return promise.then((res) => res.data);
};

export const editPoItem = (itemId, updatedData) => {
  const url = `/api/purchase_order/editItem/${itemId}/`;
  const promise = axios.put(url, updatedData, tokenConfig());
  return promise.then((res) => res.data);
};

export const removePoItem = (item_id) => {
  const url = `/api/purchase_order/removeItem/${item_id}/`;
  const promise = axios.delete(url, tokenConfig());
  return promise.then((res) => res.data);
};

export const addPoItem = (poId) => {
  const url = `/api/purchase_order/${poId}/addItem/`;
  const promise = axios.put(url, {}, tokenConfig());
  return promise.then((res) => res.data);
};

export const addPoItemWithContents = (
  poId,
  quantity,
  price,
  temporary_mpn,
  temporary_manufacturer
) => {
  const data = {
    quantity: quantity,
    price: price,
    temporary_mpn: temporary_mpn,
    temporary_manufacturer: temporary_manufacturer,
  };
  const url = `/api/purchase_order/${poId}/addItemWithContents/`;
  return axios
    .put(url, data, tokenConfig())
    .then((res) => res.data)
    .catch((error) => {
      toast.error("Error in addPoItemWithContents:", error);
    });
};

export const matchPoItemsWithParts = (poId) => {
  const url = `/api/purchase_order/${poId}/matchPoItemsWithParts/`;
  return axios
    .put(url, {}, tokenConfig())
    .then((res) => res.data)
    .catch((error) => {
      throw error;
    });
};

export const markItemAsReceived = (itemId) => {
  const url = `/api/purchase_order/markItemAsReceived/${itemId}/`;
  const promise = axios.put(url, {}, tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  return dataPromise;
};
