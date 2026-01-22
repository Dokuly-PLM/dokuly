const alphanumericSort = (a, b) => {
  const regex = /(\d+|\D+)/g;
  const aParts = (a || "").match(regex) || [];
  const bParts = (b || "").match(regex) || [];

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    if (!aParts[i]) {
      return -1;
    }
    if (!bParts[i]) {
      return 1;
    }

    const aPart = aParts[i];
    const bPart = bParts[i];

    if (aPart !== bPart) {
      const aIsNumber = !isNaN(aPart);
      const bIsNumber = !isNaN(bPart);

      if (aIsNumber && bIsNumber) {
        return Number(aPart) - Number(bPart);
      }
      return aPart.localeCompare(bPart);
    }
  }
  return 0;
};

const sortData = (data, column, order) => {
  if (!column) return data;

  return data.sort((a, b) => {
    // Always prioritize starred items (if is_starred property exists)
    const aIsStarred = a.is_starred === true;
    const bIsStarred = b.is_starred === true;
    
    if (aIsStarred && !bIsStarred) return -1; // a comes first
    if (!aIsStarred && bIsStarred) return 1;  // b comes first
    
    // If both are starred or both are not starred, apply normal sorting
    // If column has a custom sortFunction, use it
    if (column.sortFunction && typeof column.sortFunction === 'function') {
      return column.sortFunction(a, b, order);
    }

    // Otherwise use default alphanumeric sort
    const aValue = a[column.key];
    const bValue = b[column.key];

    if (aValue == null || bValue == null) return 0;
    if (aValue == undefined || bValue == undefined) return 0;

    const comparison = alphanumericSort(aValue.toString(), bValue.toString());

    return order === "asc" ? comparison : -comparison;
  });
};

export default sortData;
