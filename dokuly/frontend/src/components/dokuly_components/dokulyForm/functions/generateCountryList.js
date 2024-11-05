import React from "react";
import { getName, getCodes } from "country-list";

export const generateCountryList = () => {
  // Get all country codes
  const codes = getCodes();
  // Map each code to an object with the code and its corresponding name
  return codes.map((code) => {
    return {
      value: code,
      label: `${getName(code)} (${code})`,
    };
  });
};
