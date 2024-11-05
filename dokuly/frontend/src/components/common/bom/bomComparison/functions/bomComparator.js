/*
 * Compare two BOMs and return a list of differences.
 * @param {Array} boms - An array of BOMs to compare
 * @returns {Object} - An object containing the differences between the BOMs
 *
 *  bom_differences = {
 *    "C1": [
 *      {
 *        item: 1,
 *        part_number_with_revision: "PRT1A",
 *        quantity: 1,
 *        dnm: false,
 *        ...
 *      },
 *      {
 *        item: 2,
 *        part_number_with_revision: "PRT1B",
 *        quantity: 1,
 *        dnm: false,
 *        ...
 *      },
 *    ],
 *    "R1": [
 *    ...
 */
export function compareBoms(boms) {
  // Check if boms is an array.
  if (!Array.isArray(boms)) {
    return {};
  }

  // Check if boms is an array of arrays.
  if (!boms.every((bom) => Array.isArray(bom))) {
    return {};
  }

  const differences = {};

  // Iterate through all BOMs compiling a list of all unique designators
  const designators = [];
  boms.forEach((bom) => {
    bom.forEach((bom_item) => {
      if (bom_item.designator && !designators.includes(bom_item.designator)) {
        designators.push(bom_item.designator);
      }
    });
  });

  // Iterate over all designators
  designators.forEach((designator) => {
    differences[designator] = [];

    boms.forEach((bom, index) => {
      const bom_item = bom.find((item) => item.designator === designator);

      if (bom_item) {
        const bom_item_with_all_fields = {
          item: index + 1,
          item_missing: false,
          designator: "",
          full_part_number: "",
          revision: "",
          dnm: false,
          quantity: 1,
          assembly: null,
          part: null,
          pcba: null,
          part_infomation: {},
          ...bom_item,
        };
        differences[designator].push(bom_item_with_all_fields);
      } else {
        const missing_bom_item = {
          item: index + 1,
          item_missing: true,
        };

        differences[designator].push(missing_bom_item);
      }
    });
  });

  // Iterate over differences and store the changes per designator in both the items
  Object.entries(differences).forEach(([designator, items]) => {
    // Safety check to ensure items is an array with expected length
    if (!Array.isArray(items) || items.length !== 2) {
      console.error(
        `Unexpected structure for designator ${designator}:`,
        items,
      );
      return;
    }

    const item1 = items[0];
    const item2 = items[1];

    if (
      (item1.item_missing || item1.dnm === true) &&
      !item2.item_missing &&
      !item2.dnm
    ) {
      item2.change = "part_added";
    } else if (
      !item1.item_missing &&
      !item1.dnm &&
      (item2.item_missing || item2.dnm === true)
    ) {
      item1.change = "part_removed";
    } else if (
      !item1.item_missing &&
      !item2.item_missing &&
      item1.full_part_number === item2.full_part_number &&
      item1.revision !== item2.revision
    ) {
      item1.change = "revision_changed";
      item2.change = "revision_changed";
    } else if (
      !item1.item_missing &&
      !item2.item_missing &&
      item1.full_part_number !== item2.full_part_number
    ) {
      item1.change = "part_changed";
      item2.change = "part_changed";
    } else if (
      !item1.item_missing &&
      !item2.item_missing &&
      item1.full_part_number === item2.full_part_number &&
      item1.revision === item2.revision
    ) {
      delete differences[designator];
    }
  });

  return differences;
}
