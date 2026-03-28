import React from "react";
import { toast } from "react-toastify";

import { addBomItem } from "./functions/queries";
import AddButton from "../../dokuly_components/AddButton";

const BomAddItemButton = ({
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
    <AddButton
      show={!is_locked_bom}
      onClick={addItem}
      className="ml-4 mb-2"
      buttonText="Add item"
      title="Add an item to the BOM. Either a part, sub-assembly or pcba."
      dataToggle="tooltip"
      dataPlacement="top"
    />
  );
};

export default BomAddItemButton;
