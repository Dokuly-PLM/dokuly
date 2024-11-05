import React from "react";
import { getMpn } from "./helperFunctions";
import { formatBOMImageData } from "./formatBOMImageData";

function not_latest_rev_warning(item) {
  return item?.is_latest_revision === false ? (
    <span>
      <img
        src="../../../static/icons/alert-circle.svg"
        className="ml-2"
        style={{
          filter:
            "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
        }}
        alt="alert"
        data-toggle="tooltip"
        data-placement="top"
        title="A newer revision of this assembly exists!"
        height="40px"
        width="40px"
      />
    </span>
  ) : (
    ""
  );
}

export const bomThumbnailFormatter = (row) => {
  if (row?.deleted) {
    return <span />;
  }
  if (row.pcba) {
    return (
      <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
        {formatBOMImageData(row, "PCBA")}
      </span>
    );
  } else if (row.assembly) {
    return (
      <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
        {formatBOMImageData(row, "ASM")}
      </span>
    );
  } else {
    return (
      <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
        {formatBOMImageData(row, "PRT")}
      </span>
    );
  }
};

export const partNumberFortmatter = (cell, row) => {
  if (row?.deleted) {
    return (
      <span>
        <a>{row.type}</a>
      </span>
    );
  }
  if (row?.full_part_number) {
    return row?.full_part_number + row?.revision;
  }
  if (row.type === "PCBA" || row.type === "Pcba") {
    return (
      <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
        <a style={{ marginRight: "0.3rem" }}>
          {`${row?.type}${row?.part_number}${row?.revision}`}
        </a>
        {not_latest_rev_warning(row)}
      </span>
    );
  } else if (row.type == "ASM" || row.type == "Assembly") {
    return (
      <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
        <a
          style={{ marginRight: "0.3rem" }}
        >{`ASM${row?.part_number}${row?.revision}`}</a>
        {not_latest_rev_warning(row)}
      </span>
    );
  } else {
    return (
      <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
        <a
          style={{ marginRight: "0.3rem" }}
        >{`PRT${row?.part_number}${row?.revision}`}</a>
        {not_latest_rev_warning(row)}
      </span>
    );
  }
};

export const stockFormatter = (cell, row) => {
  switch (row?.type) {
    case "PCBA":
      return row?.stock?.stock;
    case "ASM":
      return row?.stock?.stock;
    case "PRT":
      if (
        row?.stock.stock.length !== 0 &&
        row?.stock.stock !== "TBD" &&
        row?.stock.stock !== "Refresh Data" &&
        row?.stock.stock !== "Submit Your Changes!"
      ) {
        let stockSum = 0;
        return (
          <div>
            {row?.stock.stock.map((stock, index) => {
              stockSum += stock;
            })}
            Current Stock: {stockSum}
          </div>
        );
      }
      return row?.stock?.stock;
  }
};

export const refdesFormatter = (cell, row) => {
  if (row?.refdes) {
    return row?.refdes;
  }
  return "F/N Undef.";
};
export const unitFormatter = (cell, row) => {
  if (row?.type === "PRT" || row?.type === "Part") {
    if (row?.unit) {
      return (
        <a style={{ marginTop: "0.5rem", textAlign: "center" }}>{row?.unit}</a>
      );
    }
    return <a style={{ marginTop: "0.5rem", textAlign: "center" }}>{"pcs"}</a>;
  }
  return <a style={{ marginTop: "0.5rem", textAlign: "center" }}>{"pcs"}</a>;
};

export const nameFormatter = (cell, row) => {
  if (row) {
    if (row?.deleted) {
      return `${row.type} deleted`;
    }
    if (row?.display_name) {
      return (
        <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
          <a>{row.display_name}</a>
        </span>
      );
    }
    return (
      <span data-toggle="tooltip" data-placement="top" title={getMpn(row)}>
        <a>{"No Name"}</a>
      </span>
    );
  }
  return <a>{"Row not defined!"}</a>;
};
