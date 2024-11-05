import React from "react";

/**
 * CSS helper function. 
 * Used to set user colors based on the user's role.
 * @param {Array} arr - The data you want to filter.
 * @return {Array} A filtered array.
 *
 * @example
  let part1 = {revision: "B", part_number:1}
  let part2 = {revision: "A", part_number:2}
  let arr = [part1, part2]
  let newArr = filterRevisions(arr)
  // newArr now contains only part1
 */
export const filterRevisions = (arr) => {
  if (arr.length === 0 || arr === undefined || arr == null) {
    return [];
  }
  let newArr = [];
  let sorted = arr.sort((a, b) => (a.revision < b.revision ? 1 : -1));
  let filtered = sorted.filter(
    (obj) =>
      obj.archived == null ||
      obj.archived == 0 ||
      obj.archived == "False" ||
      obj.archived == false
  );
  filtered.map((obj) => {
    if (newArr.some((e) => e.part_number === obj.part_number)) {
    } else {
      newArr.push(obj);
    }
  });
  return newArr;
};

export const getMpn = (row) => {
  if (row?.type === "PCBA" || row?.type === "Pcba") {
    if (row?.mpn !== null && row?.mpn !== undefined) {
      if (
        ((row?.mpn.includes("[") || row?.mpn.includes("]")) &&
          !row?.mpn.includes("PCBA")) ||
        typeof row?.mpn == "object"
      ) {
        return "PCBA" + row?.part_number + "-" + row?.revision;
      }
    }
  }
  if (row?.type === "ASM") {
    return "ASM" + row?.part_number + "-" + row?.revision;
  }
  return row?.mpn;
};
