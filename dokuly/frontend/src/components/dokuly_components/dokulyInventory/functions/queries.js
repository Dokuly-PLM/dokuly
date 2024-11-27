import React from "react";
import axios from "axios";
import { tokenConfig } from "../../../../configs/auth";

export const getLocationEntires = (dbObjectId, app) => {
  const promise = axios.get(
    `/api/location-entries/${dbObjectId}/${app}`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const addNewLocationEntry = (data) => {
  const promise = axios.post("/api/location-entires/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const addInventoryEntry = async (data) => {
  const promise = axios.post(
    "/api/location-entries/add_inventory_entry/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const updateLocationEntry = (data) => {
  const promise = axios.put(
    `/api/location-entries/updateLocation/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const adjustStock = (data) => {
  const promise = axios.post(
    "/api/location-entries/adjustStock/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const deleteLocationEntry = (id) => {
  const promise = axios.delete(
    `/api/location-entries/delete/${id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const updateMinimumStockLevel = (data) => {
  const promise = axios.put(
    "/api/location-entries/updateMinimumStockLevel/",
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getStockHistory = (dbObjectId, app, fromDate, toDate) => {
  const promise = axios.get(
    `/api/location-entries/stockHistory/${dbObjectId}/${app}/${fromDate}/${toDate}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getStockOnOrder = (dbObjectId, app) => {
  const promise = axios.get(
    `/api/location-entires/onOrderStock/${dbObjectId}/${app}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getStockForecast = (dbObjectId, app, toDate) => {
  const promise = axios.get(
    `/api/location-entries/stockForecast/${dbObjectId}/${app}/${toDate}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
