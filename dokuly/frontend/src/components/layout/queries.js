import React from "react";
import axios from "axios";
import { tokenConfig } from "../../configs/auth";

export const getUser = () => {
  const promise = axios.get("api/profiles/getUser/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};
