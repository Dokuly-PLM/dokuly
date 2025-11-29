import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

/**
 * Fetch "For You" homepage data including unreleased items and open issues
 * @returns {Promise} Promise that resolves to the response data
 */
export const getForYouData = () => {
  const promise = axios.get("api/homepage/for-you/", tokenConfig());
  const dataPromise = promise.then((res) => res);
  return dataPromise;
};

