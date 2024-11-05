import React, { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { formatCloudImageUri } from "./productionHelpers";
import DokulyImage from "../../dokuly_components/dokulyImage";

export const numberFormatter = (row) => {
  if (row) {
    return `${row?.full_part_number}${row?.revision}`;
  }
  return row?.full_part_number;
};

export const refDesFormatter = (row) => {
  try {
    const refDesStr = row.refdes.replace(/\s+/g, "");
    const ref_des_array = refDesStr.split(",");
    const sortet_list = ref_des_array.sort();

    let formated_array = [];
    let letters = "";
    let start_number = 0;
    let end_number = 0;
    for (const value of sortet_list) {
      const split_item = value.match(/([a-zA-Z$]+)(\d+)/); // Updated regular expression

      if (!split_item || split_item[2] == null) {
        formated_array.push(value); // Use the original value if it doesn't match the regex
      } else if (letters === "") {
        letters = split_item[1];
        start_number = parseInt(split_item[2]);
        end_number = parseInt(split_item[2]);
      } else if (
        letters === split_item[1] &&
        end_number + 1 === parseInt(split_item[2])
      ) {
        end_number = end_number + 1;
      } else {
        if (start_number !== end_number) {
          formated_array.push(
            `${letters}${start_number}-${letters}${end_number}`
          );
        } else {
          formated_array.push(`${letters}${start_number}`);
        }
        letters = split_item[1];
        start_number = parseInt(split_item[2]);
        end_number = parseInt(split_item[2]);
      }
    }
    if (start_number !== 0) {
      if (start_number !== end_number) {
        formated_array.push(
          `${letters}${start_number}-${letters}${end_number}`
        );
      } else {
        formated_array.push(`${letters}${start_number}`);
      }
    }
    formated_array.sort((a, b) => {
      const regex = /([a-zA-Z$]+)(\d+)/; // Updated regular expression
      const matchA = a.match(regex);
      const matchB = b.match(regex);

      // If either value doesn't match the regex, use the original value for sorting
      if (!matchA || !matchB) {
        return a.localeCompare(b);
      }

      const [_, lettersA, numberA] = matchA;
      const [__, lettersB, numberB] = matchB;
      if (lettersA !== lettersB) {
        return lettersA.localeCompare(lettersB);
      }
      return parseInt(numberA) - parseInt(numberB);
    });
    return formated_array.join(", ");
  } catch (error) {
    // console.error("Error in refDesFormatter:", error);
    return row.refdes; // Return the original value in case of an error
  }
};

export function ThumbnailFormatterComponent({ row }) {
  const [rotate, setRotate] = useState(false);
  const thumbnailUrl = row?.thumbnail
    ? formatCloudImageUri(row?.thumbnail)
    : row?.image_url
    ? row?.image_url
    : `api/files/download/file/${row?.pcb_renders?.[0]}`;

  let containerStyle = {
    display: "flex",
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically
    width: "100px",
    height: "70px",
    overflow: "hidden",
  };

  let imageStyle = rotate
    ? {
        maxWidth: "70px",
        maxHeight: "100px",
        transform: "rotate(90deg)",
        transformOrigin: "center center",
      }
    : {
        maxWidth: "100px",
        maxHeight: "70px",
      };

  const handleImageLoad = (e) => {
    const img = e.target;
    // console.log(
    //   `Image loaded: naturalWidth=${img.naturalWidth}, naturalHeight=${img.naturalHeight}`,
    // );
    if (img.naturalHeight > img.naturalWidth) {
      setRotate(true);
    } else {
      setRotate(false);
    }
  };

  const handleError = (e) => {
    e.target.onerror = null;
    e.target.src = ""; // set default image to no image
  };

  if (!thumbnailUrl) {
    return <div />;
  }

  let defaultSrc = "../../../../static/icons/pcb.svg";
  if (row?.full_doc_number) {
    defaultSrc = "../../../../static/icons/file-text.svg";
  }
  if (row?.part_type) {
    defaultSrc = "../../../../static/icons/puzzle.svg";
  }

  if (thumbnailUrl === "api/files/download/file/undefined") {
    imageStyle = {
      width: "50px",
      height: "50px",
    };
    containerStyle = {
      display: "flex",
      justifyContent: "center", // Center horizontally
      alignItems: "center", // Center vertically
      overflow: "hidden",
    };
  }

  return (
    <div style={containerStyle}>
      <DokulyImage
        src={thumbnailUrl}
        defaultSrc={defaultSrc}
        alt="Thumbnail"
        style={imageStyle}
        onLoad={handleImageLoad}
        onError={handleError}
      />
    </div>
  );
}

export const partNumberFormatter = (cell, row) => {
  if (row?.suggestions) {
    if (row?.suggestions.length !== 0) {
      return (
        <span>
          <img
            alt="Suggestions found"
            data-toggle="tooltip"
            data-placement="right"
            title="Suggestions found"
            src="../../../../static/icons/alert-circle.svg"
            style={{
              filter:
                "invert(81%) sepia(36%) saturate(4745%) hue-rotate(93deg) brightness(106%) contrast(101%)",
            }}
            className="ml-1 mr-2"
            width="30px"
            height="30px"
          />
          No connected part for mpn
        </span>
      );
    }
  }
  if (row?.part_id !== -1) {
    return (
      <Row className="align-items-center">
        <Col className="col-auto col-sm-auto col-md-auto col-lg-auto col-xl-auto align-items-center">
          {imageFormatter(cell, row)}
        </Col>
        <Col className="col-auto col-sm-auto col-md-auto col-lg-auto col-xl-auto align-items-center">
          <h6 className="mt-2">
            {row?.part?.full_part_number + row?.part?.revision}
          </h6>
        </Col>
      </Row>
    );
  }
  return (
    <span>
      <img
        alt="Missing connected part"
        data-toggle="tooltip"
        data-placement="right"
        title="Missing connected part"
        src="../../../../static/icons/alert-circle.svg"
        style={{
          filter:
            "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
        }}
        className="ml-1 mr-2"
        width="30px"
        height="30px"
      />
      No connected part for mpn
    </span>
  );
};
