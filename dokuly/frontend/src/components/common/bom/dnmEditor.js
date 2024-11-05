import React, { useState, useEffect } from "react";
import { editBomItem } from "./functions/queries";
import { toast } from "react-toastify";

const DnmEditor = ({ row, is_locked_bom, setRefreshBom }) => {
  // Inverted logic for UI: "Do Not Mount" is the opposite of "is_mounted"
  const [dnm, setDnm] = useState(!row.is_mounted);

  useEffect(() => {
    // Update DNM based on the row's current is_mounted status whenever the row changes
    setDnm(!row.is_mounted);
  }, [row.is_mounted]);

  const handleDnmChange = () => {
    // Invert the DNM status and prepare data for the backend update
    const newDnmStatus = !dnm;
    setDnm(newDnmStatus);

    const data = { is_mounted: !newDnmStatus }; // Convert UI logic to backend logic

    editBomItem(row.id, data)
      .then(() => {
        toast.success("Item updated");
        setRefreshBom(true);
      })
      .catch((error) => {
        // Revert UI change if the backend update fails
        setDnm(dnm); // Revert to original state
        toast.error("Error updating item:", error);
      });
  };

  return (
    <div className="d-flex align-items-center" style={{ minWidth: "100px" }}>
      {is_locked_bom ? (
        <input
          className="dokuly-checkbox"
          type="checkbox"
          checked={dnm}
          disabled
          style={{ marginLeft: "10px" }}
        />
      ) : (
        <input
          className="dokuly-checkbox"
          type="checkbox"
          checked={dnm}
          onChange={handleDnmChange}
          style={{ marginLeft: "10px" }}
        />
      )}
    </div>
  );
};

export default DnmEditor;
