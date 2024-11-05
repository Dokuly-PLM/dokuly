import React, { useState } from "react";
import { newPartRevision } from "./functions/queries";
import { useNavigate } from "react-router-dom";

/**
 * Component for revising a ASM entity.
 * @param {any} props - Any data passed to the component
 * @returns {<HTMLDivElement>} - The Revision Card Function Component.
 */
export const PartNewRevision = (props) => {
  const navigate = useNavigate();

  return (
    <React.Fragment>
      {props.part?.is_latest_revision === true &&
      props.part?.release_state === "Released" ? (
        <div>
          <button
            className={"btn btn-bg-transparent "}
            data-toggle="tooltip"
            data-placement="top"
            title={"Create new revision."}
            onClick={() => {
              newPartRevision(props.part.id).then((res) => {
                if (res.status === 200) {
                  // Navigate to new part.
                  navigate(`/parts/${res.data.id}`);
                }
              });
            }}
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
    </React.Fragment>
  );
};

export default PartNewRevision;
