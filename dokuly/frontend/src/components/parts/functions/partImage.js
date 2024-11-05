import React from "react";

export const partImage = (part) => {
  let imageCheck = false;
  if (
    part.image_url !== null &&
    part.image_url !== undefined &&
    part.image_url !== ""
  ) {
    if (
      part.image_url.includes(".jpg") ||
      part.image_url.includes(".jpeg") ||
      part.image_url.includes(".png") ||
      part.image_url.includes(".svg") ||
      part.image_url.includes(".eps")
    ) {
      imageCheck = true;
    }
  }
  switch (part.part_type) {
    case "Electrical":
      if (!imageCheck) {
        return (
          <img
            // width="15px"
            // className="icon-tabler"

            src="../../static/icons/component.svg"
            alt="icon"
          />
        );
      }
      return part.image_url === "" || part.image_url === null ? (
        <img
          // width="15px"
          // className="icon-tabler"

          src="../../static/icons/component.svg"
          alt="icon"
        />
      ) : (
        <img
          className="rounded float-left"
          width="40px"
          height="40px"
          src={part.image_url}
        ></img>
      );

    case "Tool":
      return (
        <img
          // width="15px"
          // className="icon-tabler"

          src="../../static/icons/tool.svg"
          alt="icon"
        />
      );
    case "Mechanical":
      return (
        <img
          // width="15px"
          // className="icon-tabler"

          src="../../static/icons/nut.svg"
          alt="icon"
        />
      );
    case "Software":
      return (
        <img
          // width="15px"
          // className="icon-tabler"

          src="../../static/icons/code.svg"
          alt="icon"
        />
      );
    case "PCB":
      return (
        <img
          // width="15px"
          // className="icon-tabler"

          src="../../static/icons/pcb.svg"
          alt="icon"
        />
      );
    default:
      break;
  }
};
