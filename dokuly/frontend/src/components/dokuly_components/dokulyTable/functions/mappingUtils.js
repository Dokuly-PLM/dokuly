import React from "react";

/**
 * Builds mappings for objects and their parent-child relationships.
 *
 * @param {Array} data - The data to build mappings from.
 * @param {String} idKey - The key used to identify each object.
 * @param {String} parentIdKey - The key used to identify the parent object.
 * @returns {Object} An object containing the `objectMap` and `parentMap`.
 *    - objectMap: A map where each object is indexed by its ID.
 *    - parentMap: A map where each parent ID points to an array of child objects.
 */
export function buildMappings(data, idKey, parentIdKey) {
  const objectMap = {};
  const parentMap = {};

  // Build objectMap and parentMap
  data.forEach((object) => {
    const objectId = object[idKey];
    objectMap[objectId] = object;

    const parentId = object[parentIdKey];
    if (parentId) {
      if (!parentMap[parentId]) {
        parentMap[parentId] = [];
      }
      parentMap[parentId].push(object);
    }
  });

  // Mark rows that have a sub object
  data.forEach((object) => {
    object.hasSubObject = !!parentMap[object[idKey]];
  });

  return { objectMap, parentMap };
}

/**
 * Builds a hierarchical tree structure from flat data.
 *
 * @param {Array} data - The data to convert into a tree structure.
 * @param {String} idKey - The key used to identify each object.
 * @param {String} parentIdKey - The key used to identify the parent object.
 * @returns {Array} The tree structure as an array of root objects, where each object may have a `children` array.
 */
export const buildTreeStructure = (data, idKey, parentIdKey) => {
  const objectMap = {};

  // Initialize objectMap with each object and an empty children array
  data.forEach((object) => {
    objectMap[object[idKey]] = { ...object, children: [] };
  });

  const tree = [];

  data.forEach((object) => {
    const parentId = object[parentIdKey];
    if (parentId && objectMap[parentId]) {
      // Add the object to its parent's children array
      objectMap[parentId].children.push(objectMap[object[idKey]]);
    } else {
      // If no parent, it's a root node
      tree.push(objectMap[object[idKey]]);
    }
  });

  return tree;
};

/**
 * Adds a `children` array to each object, linking them to their respective parent tasks.
 *
 * @param {Array} data - The data to modify by adding `children` arrays to objects.
 * @param {String} idKey - The key used to identify each object.
 * @param {String} parentIdKey - The key used to identify the parent object.
 * @returns {Array} The modified data, where each object has an added `children` array.
 */
export const addChildrenArrayToTasks = (data, idKey, parentIdKey) => {
  const objectMap = {};

  // Initialize objectMap with each object and an empty children array
  data.forEach((object) => {
    object.children = []; // Initialize children array
    objectMap[object[idKey]] = object;
  });

  data.forEach((object) => {
    const parentTask = object[parentIdKey];
    if (parentTask) {
      // If parentTask is an object, get its ID
      const parentId = parentTask[idKey] || parentTask;
      if (objectMap[parentId]) {
        objectMap[parentId].children.push(object);
      }
    }
  });

  return data;
};

/**
 * Finds all leaf nodes (nodes without children) in a hierarchical structure.
 *
 * @param {Array} data - The data to search for leaf nodes.
 * @param {String} idKey - The key used to identify each object.
 * @param {String} parentIdKey - The key used to identify the parent object.
 * @returns {Array} An array of leaf nodes (nodes that don't have children).
 */
export const findLeafNodes = (data, idKey, parentIdKey) => {
  const parentIds = new Set(
    data.map((node) => node[parentIdKey]).filter(Boolean)
  );
  const leafNodes = data.filter((node) => !parentIds.has(node[idKey]));
  return leafNodes;
};

export const checkAllChildrenProp = (
  object,
  propKey,
  includeParent = false
) => {
  // If the object has no children, it's a leaf node
  if (!object?.children || !object.children.length) {
    // Return the value of propKey for leaf nodes
    return !!object[propKey];
  }

  // Recursively check all descendants
  const descendantsCheck = object.children.every((child) =>
    checkAllChildrenProp(child, propKey, includeParent)
  );

  if (includeParent) {
    // Include parent's own propKey in the check
    return !!object[propKey] && descendantsCheck;
  } else {
    // Only check descendants
    return descendantsCheck;
  }
};
