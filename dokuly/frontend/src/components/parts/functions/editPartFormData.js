export const editPartFormData = (
  id,
  part_number,
  part_type,
  release_state,
  price_qty,
  price,
  internal,
  description,
  display_name,
  farnell_number,
  git_link,
  revision,
  mpn,
  datasheet,
  specs,
  sellers,
  supplier_stock,
  production_status,
  image_url,
  rohs_status_code,
  distributor,
  pcb_length,
  pcb_width,
  manufacturer,
  part_file1,
  part_file2,
  part_file3,
  part_file4,
  part_file5,
  created_by,
  checked,
  part_files,
  unit
) => {
  part_file1 = part_files[0];
  part_file2 = part_files[1];
  part_file3 = part_files[2];
  part_file4 = part_files[3];
  part_file5 = part_files[4];

  const data = new FormData();
  data.append("id", id);
  data.append("part_number", part_number);
  data.append("part_type", part_type);
  data.append("release_state", release_state);
  data.append("price_qty", price_qty);
  data.append("price", price);
  data.append("internal", internal);
  data.append("created_by", created_by.id);
  data.append("description", description);
  data.append("display_name", display_name);
  data.append("farnell_number", farnell_number);
  data.append("git_link", git_link);
  data.append("revision", revision);
  data.append("mpn", mpn);
  data.append("datasheet", datasheet);
  data.append("specs", specs);
  data.append("sellers", sellers);
  data.append("supplier_stock", supplier_stock);
  data.append("production_status", production_status);
  data.append("image_url", image_url);
  data.append("rohs_status_code", rohs_status_code);
  data.append("distributor", distributor);
  data.append("pcb_length", pcb_length);
  data.append("pcb_width", pcb_width);
  data.append("manufacturer", manufacturer);
  data.append("unit", unit);
  part_file1 !== undefined && part_file1 !== "" && part_file1 !== null
    ? data.append("part_file1", part_file1)
    : checked
    ? data.append("part_file1", "")
    : "";
  part_file2 !== undefined && part_file2 !== "" && part_file2 !== null
    ? data.append("part_file2", part_file2)
    : checked
    ? data.append("part_file2", "")
    : "";
  part_file3 !== undefined && part_file3 !== "" && part_file3 !== null
    ? data.append("part_file3", part_file3)
    : checked
    ? data.append("part_file3", "")
    : "";
  part_file4 !== undefined && part_file4 !== "" && part_file4 !== null
    ? data.append("part_file4", part_file4)
    : checked
    ? data.append("part_file4", "")
    : "";
  part_file5 !== undefined && part_file5 !== "" && part_file5 !== null
    ? data.append("part_file5", part_file5)
    : checked
    ? data.append("part_file5", "")
    : "";

  return data;
};
