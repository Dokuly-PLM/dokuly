import React, { useState, useEffect } from "react";
import { useSpring, animated, config } from "react-spring";
import {
  loadingSpinner,
  loadingSpinnerCustomMargin,
} from "../../admin/functions/helperFunctions";
import { Link, Navigate, NavLink } from "react-router-dom";
import { getRevisions } from "./queries";

const DocumentRevisionList = (props) => {
  const [document, setDocument] = useState(
    props.document !== null && props.document !== undefined
      ? props.document
      : {},
  );
  const [revision, setRevision] = useState("");
  const [documentRevisionList, setDocumentRevisionList] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStates = (props) => {
    setDocument(props?.document);
    setRevision(props?.document?.revision);
  };

  useEffect(() => {
    loadStates(props);
    if (
      props.document?.revision !== document?.revision ||
      documentRevisionList == null
    ) {
      getRevisions(props?.document?.id)
        .then((res) => {
          setDocumentRevisionList(res.data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [props, refresh]);

  if (loading) {
    return <div>{loadingSpinnerCustomMargin(0.5, 0, 0, 1)}</div>;
  }

  if (documentRevisionList?.length === 1) {
    return <div></div>; // No dropdown needed
  }

  return (
    <div className="dropdown">
      <a className="ml-2">-</a>
      <a className="ml-2">{revision}</a>
      <button
        className="btn btn-sm ml-2 dropdown-toggle"
        type="button"
        id="dropdownMenuButton"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      ></button>
      <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
        {documentRevisionList !== undefined &&
          documentRevisionList !== null &&
          documentRevisionList.length !== 0 &&
          documentRevisionList
            .sort(function (a, b) {
              if (a.revision > b.revision) {
                return 1;
              } else if (a.revision < b.revision) {
                return -1;
              } else {
                return 0;
              }
            })
            .map((document) => {
              return (
                <a
                  key={document.id}
                  onClick={() => {
                    const data = {
                      data: document,
                      newDocument: true,
                    };
                    props.liftState(data);
                  }}
                  className="dropdown-item"
                >
                  {document.revision}
                </a>
              );
            })}
      </div>
    </div>
  );
};

export default DocumentRevisionList;
