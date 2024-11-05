import React from "react";
import { useNavigate } from "react-router-dom";
import { archivePart } from "./queries";

const ArchivePart = (props) => {
  const partDetailed = props.part;

  const history = useNavigate();

  const archive = (id) => {
    archivePart(id).then(() => {
      history.push("/parts");
    });
    return;
  };

  return (
    <div>
      {/* <!-- Button trigger modal --> */}
      <button
        type="button"
        className="btn btn-bg-transparent"
        data-toggle="modal"
        data-target="#deleteModal"
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/trash.svg"
            alt="icon"
          />
          <span className="btn-text">Archive</span>
        </div>
      </button>
      <div
        className="modal fade"
        id="deleteModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Archive entry?
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to archive part: {partDetailed?.part_number}
              {partDetailed?.revision}, {partDetailed?.display_name}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-danger m-auto"
                data-dismiss="modal"
                onClick={() => archive(partDetailed.id)}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchivePart;
