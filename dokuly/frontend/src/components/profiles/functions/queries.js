import axios from "axios";
import React from "react";
import {
  formDataWithToken,
  offlineToken,
  tokenConfig,
} from "../../../configs/auth";

export const getUser = () => {
  const promise = axios.get("api/auth/user", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getUserProfile = () => {
  const promise = axios.get("api/profiles/getUser/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getProfile = (user_id) => {
  const promise = axios.get(`api/profiles/getUser/${user_id}`, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const enable2FATotp = (data) => {
  const promise = axios.post("api/profiles/enable2fa/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const disable2FATotp = (data) => {
  const promise = axios.post("api/profiles/disable2fa/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const verify2FA = (data) => {
  const promise = axios.put("api/profiles/verify2FA/", data, tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const verify2FANoToken = (data) => {
  const promise = axios.put("api/profiles/verify2FA/", data);
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const login2FANonToken = (data) => {
  const promise = axios.put("api/profiles/login2FA/", data, offlineToken());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const enable2FATotpFromLogin = (data) => {
  const promise = axios.put("api/profiles/enable2faLogin/", data);
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

export const getUnreadNotifications = () => {
  const promise = axios.get("api/profiles/get/notifications/", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  return dataPromise;
};

export const markNotificationAsRead = (notificationId) => {
  // Construct the URL with the notification ID
  const url = `api/profiles/notifications/mark-as-viewed/${notificationId}/`;

  // Make a POST request to the URL
  return axios
    .put(url, {}, tokenConfig())
    .then((response) => response.data)
    .catch((error) => {
      console.error("Error marking notification as read:", error);
      throw error;
    });
};

export const markAllNotificationsAsRead = () => {
  const promise = axios.post(
    "api/profiles/notifications/mark-all-as-viewed/",
    {},
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
