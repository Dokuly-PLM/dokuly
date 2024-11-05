import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { newDocumentRevision } from "../documentOverview/queries";

/**
 * # Button to revise item.
 */
const NewRevision = (props) => {
  const navigate = useNavigate();

  function createNew() {
    // Push data to the database
    newDocumentRevision(props.document?.id).then((res) => {
      if (res.status === 201) {
        setTimeout(() => {
          navigate(`/documents/${res.data.id}`);
        }, 1000);
      }
    });
  }

  return (
    <div className="container-fluid">
      {props.document?.release_state === "Released" &&
      props.document?.is_latest_revision === true ? (
        <button
          type="button"
          className="btn btn-bg-transparent mt-2 mb-2"
          onClick={() => {
            if (props?.setLoadingDocument) {
              props.setLoadingDocument(true);
            }
            createNew();
          }}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/circle-plus.svg"
              alt="icon"
            />
            <span className="btn-text">New revision</span>
          </div>
        </button>
      ) : (
        ""
      )}
    </div>
  );
};

export default NewRevision;
