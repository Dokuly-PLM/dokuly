import React from "react";
import { removeBomItem } from "./functions/queries";
import { toast } from "react-toastify";

const DeleteItemButton = ({ row, setRefreshBom }) => {
  const handleDelete = (e) => {
    e.preventDefault();

    if (!confirm("Are you sure you want to delete?")) {
      return;
    }

    removeBomItem(row.id)
      .then(() => {
        toast.success("Item successfully deleted.");
        setRefreshBom(true);
      })
      .catch((error) => {
        toast.error("Error deleting item: " + error.message);
        // Error handling logic
      });
  };

  return (
    <button className="btn btn-bg-transparent" onClick={handleDelete}>
      <img
        className="icon-dark"
        src="../../static/icons/trash.svg"
        alt="trash"
      />
    </button>
  );
};

export default DeleteItemButton;
