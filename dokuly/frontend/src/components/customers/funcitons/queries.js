import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

export const create_customer = (data) => {
  const promise = axios.post(
    "/api/customers/post/newCustomer/",
    data,
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
 * Get all active customers.
 */
export const get_active_customers = () => {
  const promise = axios.get(
    "/api/customers/get/activeCustomers/",
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
 * Get a single customer.
 */
export const fetchCustomer = (customer_id) => {
  const promise = axios.get(
    `/api/customers/get/${customer_id}/`,
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
 * Get all customers.
 */
export const fetchCustomers = () => {
  const promise = axios.get("/api/customers/get/all/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

/**
 * Get all customers.
 */
export const fetchUnarchivedCustomers = () => {
  const promise = axios.get("/api/customers/get/unarchived/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};
