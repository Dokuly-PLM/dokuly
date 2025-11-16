import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { newDocumentRevision } from "../documentOverview/queries";
import RevisionTypeModal from "../../dokuly_components/revisionTypeModal";

/**
 * # Button to revise item.
 */
const NewRevision = (props) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleCreateRevision = (revisionType) => {
    if (props?.setLoadingDocument) {
      props.setLoadingDocument(true);
    }
    
    // Pass the selected revision type to the API
    newDocumentRevision(props.document?.id, revisionType)
      .then((res) => {
        if (res.status === 201 && res.data) {
          // Close modal first
          setShowModal(false);
          setTimeout(() => {
            navigate(`/documents/${res.data.id}`);
          }, 1000);
        }
      })
      .catch((error) => {
        console.error('Error creating revision:', error);
        // Close modal even on error
        setShowModal(false);
        if (props?.setLoadingDocument) {
          props.setLoadingDocument(false);
        }
      });
  };

  return (
    <div className="container-fluid">
      {props.document?.release_state === "Released" &&
      props.document?.is_latest_revision === true ? (
        <button
          type="button"
          className="btn btn-bg-transparent mt-2 mb-2"
          onClick={() => {
            setShowModal(true);
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
      
      <RevisionTypeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={handleCreateRevision}
        currentRevision={props.document?.formatted_revision}
        organization={props.document?.organization}
      />
    </div>
  );
};

export default NewRevision;