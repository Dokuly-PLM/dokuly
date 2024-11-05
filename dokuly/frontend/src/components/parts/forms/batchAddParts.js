import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getTestUser } from "../../projects/functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";
import BatchAddPartsForm from "./batchAddPartsForm";

const BatchAddParts = (props) => {
  const [refresh, setRefresh] = useState(false);
  const [show, setShow] = useState(false);

  const onHide = () => {
    setShow(false);
  };

  const launchForm = () => {
    setShow(true);
  };

  useEffect(() => {
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh]);

  return (
    <div>
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={() => {
          launchForm();
        }}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/code.svg"
            alt="icon"
          />
          <span className="btn-text">Batch add parts</span>
        </div>
      </button>
      <DokulyModal title={"Batch Add Parts"} show={show} onHide={onHide}>
        <BatchAddPartsForm onHide={onHide} />
      </DokulyModal>
    </div>
  );
};

export default BatchAddParts;
