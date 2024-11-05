/**
 * Merges BOM content with detailed BOM items.
 * @param {Array} bomContent Array of BOM content items.
 * @param {Array} parts Array of part details.
 * @param {Array} pcbas Array of PCBA details.
 * @param {Array} assemblies Array of assembly details.
 * @returns {Array} Merged BOM content array.
 */
export const buildBomObject = (
  bomContent,
  parts,
  pcbas,
  assemblies,
  partTypes = []
) => {
  const mergedBom = bomContent.map((item) => {
    // Initialize an empty object for the merged item
    const mergedItem = { ...item };

    // Find and merge part, if part exists
    if (item.part) {
      const part = parts.find((p) => p.id === item.part);
      if (part) {
        part.item_type = "part";
        const { id, ...partDetails } = part;
        Object.assign(mergedItem, partDetails);
      }
    }
    // Find and merge part type, if part type exists
    if (mergedItem.part_type) {
      const partType = partTypes.find((pt) => pt.id === mergedItem.part_type);
      if (partType) {
        //replace the part type id with the part type object
        Object.assign(mergedItem, { part_type: partType });
      }
    }

    // Find and merge PCBA, if pcba exists
    if (item.pcba) {
      const pcba = pcbas.find((p) => p.id === item.pcba);
      if (pcba) {
        pcba.item_type = "pcba";
        const { id, ...pcbaDetails } = pcba;
        Object.assign(mergedItem, pcbaDetails);
      }
    }

    // Find and merge assembly, if assembly exists
    if (item.assembly) {
      const assembly = assemblies.find((a) => a.id === item.assembly);
      if (assembly) {
        assembly.item_type = "assembly";
        const { id, ...assemblyDetails } = assembly;
        Object.assign(mergedItem, assemblyDetails);
      }
    }

    return mergedItem;
  });

  return mergedBom;
};
