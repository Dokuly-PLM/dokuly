import React from "react";

/**
 * Checks if the provided value is null or undefined.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - True if the value is null or undefined, otherwise false.
 */
export const isNull = (value) => {
  if (value === null || value === undefined) {
    return true;
  }
  return false;
};
