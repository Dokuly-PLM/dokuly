import React from "react";
import { toast } from "react-toastify";

import { addBomItem } from "./functions/queries";

const AddItemButton = ({
  bom_id,
  is_locked_bom,
  setRefreshBom,
  onItemAdded,
}) => {
  function addItem() {
    if (bom_id === undefined) return;

    addBomItem(bom_id).then(
      (res) => {
        if (onItemAdded) {
          onItemAdded(res.id);
        } else {
          setRefreshBom(true);
        }
      },
      (err) => {
        // Check if err.response exists before accessing err.response.status
        const status = err.response ? err.response.status : "unknown";
        toast.error(
          `Got an error adding item, check connection. Status: ${status}`,
        );
      },
    );
  }

  return (
    !is_locked_bom && (
      <button
        type="button"
        className="btn dokuly-bg-transparent ml-4 mb-2"
        data-toggle="tooltip"
        data-placement="top"
        title="Add an item to the BOM. Either a parrt, sub-assembly or pcba."
        //disabled={} // TODO: Implement logic for disabling the button
        onClick={() => addItem()}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">Add item</span>
        </div>
      </button>
    )
  );
};

export default AddItemButton;
