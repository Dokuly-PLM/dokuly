export function separateBomItemIDs(bom_items) {
  const pcbaIds = [];
  const assemblyIds = [];
  const partIds = [];

  bom_items.forEach((item) => {
    if (item.pcba) {
      pcbaIds.push(item.pcba);
    }
    if (item.assembly) {
      assemblyIds.push(item.assembly);
    }
    if (item.part) {
      partIds.push(item.part);
    }
  });

  return { pcbaIds, assemblyIds, partIds };
}
