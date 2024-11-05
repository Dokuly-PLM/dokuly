/**
 * @deprecated since assembly bom's moved to backend
 */
export const deleteLineAsm = (bomLine, asm1, asm2) => {
  let bomLineType = "";
  let assembly = asm1;
  let newAssembly = asm1;
  let refDesToRemove = [];
  let partToRemove = [];

  bomLine.bomID.includes("PRT") ? (bomLineType = "PRT") : "";
  bomLine.bomID.includes("ASM") ? (bomLineType = "ASM") : "";
  bomLine.bomID.includes("PCBA") ? (bomLineType = "PCBA") : "";

  switch (bomLineType) {
    case "PRT":
      for (let i = 0; i < assembly.part_used.length; i++) {
        if (parseInt(assembly.part_used[i]) === parseInt(bomLine.id)) {
          refDesToRemove.push(assembly.part_refdes[i]);
          partToRemove.push(assembly.part_used[i]);
        }
      }
      newAssembly.part_refdes = assembly.part_refdes.filter(
        (el) => !refDesToRemove.includes(el),
      );

      newAssembly.part_used = assembly.part_used.filter(
        (el) => !partToRemove.includes(el),
      );

      break;
    case "ASM":
      for (let i = 0; i < assembly.assembly_used.length; i++) {
        if (parseInt(assembly.assembly_used[i]) === parseInt(bomLine.id)) {
          refDesToRemove.push(assembly.assembly_refdes[i]);
          partToRemove.push(assembly.assembly_used[i]);
        }
      }
      newAssembly.assembly_refdes = assembly.assembly_refdes.filter(
        (el) => !refDesToRemove.includes(el),
      );

      newAssembly.assembly_used = assembly.assembly_used.filter(
        (el) => !partToRemove.includes(el),
      );

      break;
    case "PCBA":
      for (let i = 0; i < assembly.assembly_used.length; i++) {
        if (parseInt(assembly.pcba_used[i]) === parseInt(bomLine.id)) {
          refDesToRemove.push(assembly.pcba_refdes[i]);
          partToRemove.push(assembly.pcba_used[i]);
        }
      }
      newAssembly.pcba_refdes = assembly.pcba_refdes.filter(
        (el) => !refDesToRemove.includes(el),
      );

      newAssembly.pcba_used = assembly.pcba_used.filter(
        (el) => !partToRemove.includes(el),
      );

      break;

    default:
      break;
  }

  // Empty arrays can't be sent to the database, thus empty values need to be parsed through

  newAssembly.part_used.length <= 0 ? (newAssembly.part_used = [""]) : "";
  newAssembly.part_refdes.length <= 0 ? (newAssembly.part_refdes = [""]) : "";

  newAssembly.assembly_used.length <= 0
    ? (newAssembly.assembly_used = [""])
    : "";
  newAssembly.assembly_refdes.length <= 0
    ? (newAssembly.assembly_refdes = [""])
    : "";

  newAssembly.pcba_used.length <= 0 ? (newAssembly.pcba_used = [""]) : "";
  newAssembly.pcba_refdes.length <= 0 ? (newAssembly.pcba_refdes = [""]) : "";

  return newAssembly;
};
