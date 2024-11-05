import React from "react";

import { clearBom } from "./functions/queries";

export const ClearBomButton = ({ bom_id, is_locked_bom, setRefreshBom }) => {
  function clearBomItems() {
    if (!confirm("Are you sure you want to clear the BOM?")) {
      return;
    }

    if (bom_id === undefined) {
      return;
    }

    clearBom(bom_id).then((res) => {
      if (res.status === 200) {
        if (setRefreshBom !== undefined) {
          setRefreshBom(true);
        }
      }
    });
  }

  return (
    <React.Fragment>
      {is_locked_bom === true ? (
        ""
      ) : (
        <button
          type="button"
          className="btn btn-bg-transparent ml-4 mb-2"
          onClick={() => clearBomItems()}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/trash.svg"
              alt="icon"
            />
            <span className="btn-text">Clear BOM</span>
          </div>
        </button>
      )}
    </React.Fragment>
  );
};
