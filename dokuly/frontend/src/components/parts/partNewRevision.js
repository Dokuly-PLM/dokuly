import React, { useState } from "react";
import { newPartRevision } from "./functions/queries";
import { useNavigate } from "react-router-dom";
import RevisionTypeModal from "../dokuly_components/revisionTypeModal";

/**
 * Component for revising a ASM entity.
 * @param {any} props - Any data passed to the component
 * @returns {<HTMLDivElement>} - The Revision Card Function Component.
 */
export const PartNewRevision = (props) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleCreateRevision = (revisionType) => {
    // Pass the selected revision type to the API
    newPartRevision(props.part.id, revisionType).then((res) => {
      if (res.status === 200) {
        // Close modal first
        setShowModal(false);
        // Navigate to new part.
        navigate(`/parts/${res.data.id}`);
      }
    }).catch((error) => {
      console.error('Error creating revision:', error);
      // Close modal even on error
      setShowModal(false);
    });
  };

  return (
    <React.Fragment>
      {props.part?.release_state === "Released" ? (
        <div>
          <button
            className={"btn btn-bg-transparent "}
            data-toggle="tooltip"
            data-placement="top"
            title={"Create new revision."}
            onClick={() => setShowModal(true)}
          >
            <div className="row">
              <img
                className="icon-dark"
                src="../../static/icons/circle-plus.svg"
                alt="New Revision Icon"
              />
              <span className="btn-text">Revision</span>
            </div>
          </button>
        </div>
      ) : (
        ""
      )}
      
      <RevisionTypeModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={handleCreateRevision}
        currentRevision={props.part?.formatted_revision}
        organization={props.part?.organization}
      />
    </React.Fragment>
  );
};

export default PartNewRevision;
