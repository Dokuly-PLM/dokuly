import React from "react";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";
import DokulyImage from "../../dokuly_components/dokulyImage";

/**
 * JSX helper function. Returns either a default icon or a 
 * part image, based on the entry's type.
 * @param {JSON} entry - A BOM line entry, e.g. Part / PCBA / ASM entity
 * @param {String=} type - The type of the BOM line entry
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [bomLine, setBomLine] = useState(bom[0])
  return (
      <div>
        {formatBOMImageData(bomLine, "PCBA")}
      </div>
  )
 */
export const formatBOMImageData = (entry, type) => {
  const containerStyle = {
    display: "flex",
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically (if needed)
    maxHeight: "70px", // Ensure the container has a fixed height
    width: "100%", // Use full width of the cell
  };

  if (entry?.thumbnail !== undefined && entry?.thumbnail !== null) {
    return (
      <div style={containerStyle}>
        <DokulyImage
          src={formatCloudImageUri(entry?.thumbnail)}
          alt="Thumbnail"
          style={{
            maxWidth: "70px",
            maxHeight: "70px",
            objectFit: "contain",
            display: "block",
            margin: "auto",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = ""; // set default image to no image
          }}
        />
      </div>
    );
  }

  if (type === "Pcba" || type === "PCBA") {
    if (entry?.pcb_renders?.length > 0) {
      return (
        <DokulyImage
          src={`api/files/download/file/${entry?.pcb_renders[0]}`}
          alt="Thumbnail"
          style={{
            height: "70px",
            maxWidth: "70px",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = ""; // set default image to no image
          }}
        />
      );
    } else {
      return (
        <div style={containerStyle}>
          <img
            src="../../static/icons/pcb.svg"
            alt="PCBA Icon"
            title={"Printed circuit board assembly"}
          />
        </div>
      );
    }
  } else if (type === "Part" || type === "PRT") {
    if (entry.part_type) {
      if (entry?.image_url !== "" && entry?.image_url !== null) {
        return (
          <div style={containerStyle}>
            <img
              className="rounded float-left"
              width="40px"
              height="40px"
              alt="Part Image"
              src={entry.image_url}
              title={entry?.part_type?.description || ""}
            />
          </div>
        );
      } else if (
        entry?.part_type !== undefined &&
        entry?.part_type != null &&
        entry?.part_type.icon_url !== "" &&
        entry?.part_type.icon_url !== null
      ) {
        return (
          <div style={containerStyle}>
            <img
              src={entry.part_type.icon_url}
              alt="icon"
              title={entry.part_type.description || ""}
            />
          </div>
        );
      }
      return (
        // no part type specified (should not be possible).
        ""
      );
    }
  } else {
    return (
      <div style={containerStyle}>
        <img
          src="../../static/icons/assembly.svg"
          alt="Assemvly icon"
          title={"Assembly"}
        />
      </div>
    );
  }
};
