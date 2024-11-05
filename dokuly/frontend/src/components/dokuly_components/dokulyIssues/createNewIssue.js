import React from "react";
import AddButton from "../AddButton";

const CreateNewIssue = ({ className, addNewIssue }) => {
  return (
    <AddButton
      buttonText={"Create New Issue"}
      onClick={addNewIssue}
      className={`ml-4 ${className}`}
    />
  );
};

export default CreateNewIssue;
