import React from "react";

import { clearOrderItems } from "../functions/queries";

export const ClearOrderItemsButton = ({ po_id, readOnly, setRefresh }) => {
  
    function clearBomItemsTable() {
    if (!confirm("Are you sure you want to clear the order items list?")) {
      return;
    }

    if (po_id === undefined) {
      return;
    }

    clearOrderItems(po_id).then((res) => {
      if (res.status === 200) {
        if (setRefresh !== undefined) {
            setRefresh(true);
        }
      }
    });
  }

  return (
    <React.Fragment>
      {readOnly === true ? (
        ""
      ) : (
        <button
          type="button"
          className="btn btn-bg-transparent"
          onClick={() => clearBomItemsTable()}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/trash.svg"
              alt="icon"
            />
            <span className="btn-text">Clear order items</span>
          </div>
        </button>
      )}
    </React.Fragment>
  );
};
