import React from "react";

const SidebarIcon = ({
  app = "parts",
  propsFilter = "",
  width = 30,
  style = {},
  className = "",
}) => {
  let src = "";
  let alt = "";
  let filter = "";

  switch (app) {
    case "timeReport":
      src = "../../../../static/icons/chart-bar.svg";
      filter =
        "invert(44%) sepia(31%) saturate(936%) hue-rotate(157deg) brightness(93%) contrast(83%)";
      alt = "chart";
      break;
    case "administration":
      src = "../../../../static/icons/database.svg";
      alt = "database";
      break;
    case "timesheet":
      src = "../../../../static/icons/clock.svg";
      filter =
        "invert(44%) sepia(31%) saturate(936%) hue-rotate(157deg) brightness(93%) contrast(83%)";
      alt = "clock";
      break;
    case "customers":
      src = "../../../../static/icons/friends.svg";
      filter =
        "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)";
      alt = "people";
      break;
    case "projects":
      src = "../../../../static/icons/briefcase.svg";
      filter =
        "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)";
      alt = "briefcase";
      break;
    case "requirements":
      src = "../../../../static/icons/clipboard-check.svg";
      filter =
        "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)";
      alt = "clipboard";
      break;
    case "eco":
      src = "../../../../static/icons/clipboard-list.svg";
      filter =
        "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)";
      alt = "eco";
      break;
    case "documents":
      src = "../../../../static/icons/file.svg";
      filter =
        "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)";
      alt = "file";
      break;
    case "parts":
      src = "../../../../static/icons/puzzle.svg";
      filter =
        "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)";
      alt = "jigsaw-piece";
      break;
    case "assemblies":
      src = "../../../../static/icons/assembly.svg";
      filter =
        "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)";
      alt = "assembly";
      break;
    case "pcbas":
      src = "../../../../static/icons/pcb.svg";
      filter =
        "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)";
      alt = "PCB";
      break;
    case "suppliers":
      src = "../../../../static/icons/factory.svg";
      filter =
        "invert(25%) sepia(48%) saturate(4078%) hue-rotate(289deg) brightness(91%) contrast(93%)";
      alt = "factory";
      break;
    case "procurement":
      src = "../../../../static/icons/shopping-cart.svg";
      filter =
        "invert(25%) sepia(48%) saturate(4078%) hue-rotate(289deg) brightness(91%) contrast(93%)";
      alt = "shopping-cart";
      break;
    case "production":
      src = "../../../../static/icons/box.svg";
      filter =
        "invert(25%) sepia(48%) saturate(4078%) hue-rotate(289deg) brightness(91%) contrast(93%)";
      alt = "boxes";
      break;
    default:
      src = "../../../../static/icons/default-icon.svg"; // Fallback icon
      alt = "icon";
      break;
  }

  const finalFilter = propsFilter || filter;

  if (app === "" || !app) {
    return <></>;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      className={className}
      style={{
        filter: finalFilter,
        ...style,
      }}
    />
  );
};

export default SidebarIcon;
