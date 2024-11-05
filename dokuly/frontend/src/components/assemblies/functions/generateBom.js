import React from "react";

/**
 * @deprecated since assembly bom's moved to backend
 */
export const loadLocationAndStock = (part, inventory, locations) => {
  let partStock = { part: "", location: "", stock: 0 };

  inventory.map((inventory) => {
    if (inventory.part === part.id) {
      locations.map((location) => {
        if (location.id === inventory.location && partStock.part === "") {
          partStock.part = inventory.part;
          partStock.location =
            location.location_type +
            " " +
            location.location_column +
            location.location_row +
            ": " +
            location.container_type +
            " " +
            location.container_number +
            " - " +
            location.container_column +
            location.container_row;

          partStock.stock += inventory.quantity;
        } else if (
          parseInt(location.id) === parseInt(inventory.location) &&
          parseInt(partStock.part) === parseInt(inventory.part)
        ) {
          partStock.stock += inventory.quantity;
        } // TODO: Create an else if that pushes to array if the parts get a match om a different location
      });
    }
  });

  return partStock;
};

/**
 * @deprecated since assembly bom's moved to backend
 */
export const generateAsmBom = (
  selectedAssembly,
  assemblies,
  parts,
  pcbas,
  inventory,
  locations,
) => {
  let updatedBom = [];

  for (var i = 0; i < selectedAssembly.part_used.length; i++) {
    var bomEntry = {};

    // Check if the part is already in updatedBom to choose if it should push the part or append refdes
    if (
      !updatedBom.some(
        (bomEntry) =>
          bomEntry.id === parseInt(selectedAssembly.part_used[i]) &&
          bomEntry.type === "PRT",
      )
    ) {
      parts.map((part) => {
        if (part.id === parseInt(selectedAssembly.part_used[i])) {
          bomEntry = part;
          bomEntry.refdes = selectedAssembly.part_refdes[i];
          bomEntry.type = "PRT";
          bomEntry.bomID = bomEntry.type + selectedAssembly.part_refdes[i];
          bomEntry.stock = loadLocationAndStock(part, inventory, locations);
          updatedBom.push(bomEntry);
        }
      });
    } else {
      updatedBom.map((bomEntry) => {
        if (bomEntry.id === parseInt(selectedAssembly.part_used[i])) {
          bomEntry.refdes = bomEntry.refdes.concat(
            ", " + selectedAssembly.part_refdes[i],
          );
        }
      });
    }
  }
  // Add assemblies to the BOMlist
  for (var i = 0; i < selectedAssembly.assembly_used.length; i++) {
    let bomEntry;
    if (
      !updatedBom.some(
        (bomEntry) =>
          bomEntry.id === parseInt(selectedAssembly.part_used[i]) &&
          bomEntry.type === "ASM",
      )
    ) {
      assemblies.map((assembly) => {
        if (assembly.id === parseInt(selectedAssembly.assembly_used[i])) {
          bomEntry = assembly;
          bomEntry.refdes = selectedAssembly.assembly_refdes[i];
          bomEntry.type = "ASM";
          bomEntry.stock = { part: "", location: "", stock: "TBD" };
          bomEntry.bomID = bomEntry.type + selectedAssembly.assembly_refdes[i];
          bomEntry.type + selectedAssembly.assembly_refdes[i];
          updatedBom.push(bomEntry);
        }
      });
    } else {
      updatedBom.map((bomEntry) => {
        if (
          bomEntry.id === parseInt(selectedAssembly.assembly_used[i]) &&
          bomEntry.type === "ASM"
        ) {
          bomEntry.refdes = bomEntry.refdes.concat(
            ", " + selectedAssembly.assembly_refdes[i],
          );
        }
      });
    }
  }
  // Add PCBA to the BOMlist
  for (var i = 0; i < selectedAssembly.pcba_used.length; i++) {
    let bomEntry;
    if (
      !updatedBom.some(
        (bomEntry) =>
          bomEntry.id === parseInt(selectedAssembly.pcba_used[i]) &&
          bomEntry.type === "PCBA",
      )
    ) {
      pcbas.map((pcba) => {
        if (pcba.id === parseInt(selectedAssembly.pcba_used[i])) {
          bomEntry = pcba;
          bomEntry.refdes = selectedAssembly.pcba_refdes[i];
          bomEntry.type = "PCBA";
          bomEntry.stock = { part: "", location: "", stock: "TBD" };
          bomEntry.bomID = bomEntry.type + selectedAssembly.pcba_refdes[i];
          bomEntry.type + selectedAssembly.pcba_refdes[i];
          updatedBom.push(bomEntry);
        }
      });
    } else {
      updatedBom.map((bomEntry) => {
        if (
          bomEntry.id === parseInt(selectedAssembly.pcba_used[i]) &&
          bomEntry.type === "PCBA"
        ) {
          bomEntry.refdes = bomEntry.refdes.concat(
            ", " + selectedAssembly.pcba_refdes[i],
          );
        }
      });
    }
  }
  updatedBom.sort((a, b) => a.part_number > b.part_number);
  return updatedBom;
};
