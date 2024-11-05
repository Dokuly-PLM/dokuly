export function partSearch(searchString, parts) {
  let splitSearchString = searchString.replace(/\s/g, "").toLowerCase();
  splitSearchString = splitSearchString.split(",");

  let foundParts = [];
  let partsWithSearchString = [];

  parts.map((part) => {
    part.searchString = part.display_name;
    part.searchString = part.searchString.concat(part.description);
    part.searchString = part.searchString.concat(
      "PRT" + part.part_number.toString(),
    );
    part.searchString = part.searchString.concat(part.customer_name);
    part.searchString = part.searchString.concat(part.project_name);
    part.searchString = part.searchString.concat(part.mpn);
    part.specs != null
      ? (part.searchString = part.searchString.concat(part.specs))
      : "";
    part.searchString = part.searchString.toLowerCase().replace(/\s/g, "");

    partsWithSearchString.push(part);
  });

  // check if the string has all the terms
  if (searchString != "") {
    partsWithSearchString.map((part) => {
      let result = splitSearchString.every((searchTerm) =>
        part.searchString.includes(searchTerm),
      );
      result == true ? foundParts.push(part) : "";
    });
  } else {
    foundParts = partsWithSearchString;
  }

  return foundParts;
}
