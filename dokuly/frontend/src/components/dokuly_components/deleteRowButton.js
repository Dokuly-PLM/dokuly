import React from "react";

const DeleteRowButton = ({ row, setRefresh, handleDelete, style = {} }) => {
  return (
    <button
      type="button"
      className="btn btn-bg-transparent"
      onClick={handleDelete}
      style={style}
    >
      <img
        className="icon-dark"
        src="../../static/icons/trash.svg"
        alt="trash"
      />
    </button>
  );
};

export default DeleteRowButton;
