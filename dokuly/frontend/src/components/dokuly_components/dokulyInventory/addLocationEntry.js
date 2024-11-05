import React from "react";
import AddButton from "../AddButton";

const AddLocationEntry = ({ className, addLocationEntry }) => {
  return (
    <AddButton
      buttonText={"Add location"}
      onClick={addLocationEntry}
      className={`ml-4 ${className}`}
    />
  );
};

export default AddLocationEntry;
