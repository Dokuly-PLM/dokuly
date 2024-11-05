import React, { useState } from "react";
import EditTagsForm from "./editTagsForm";
import EditButton from "../editButton";

const EditTags = ({
  projectTags, // Array of project tags
  project, // Project object containing id
  fetchAndCacheTags, // Function to fetch and cache tags
  readOnly = false, // Boolean flag for read-only mode
  setRefresh = () => {}, // Callback to refresh the state
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleRefresh = () => {
    fetchAndCacheTags();
    setRefresh(true);
  };

  return (
    <div>
      {!readOnly && (
        <>
          <EditButton
            buttonText="Edit tags"
            onClick={() => {
              fetchAndCacheTags();
              setShowModal(true);
            }}
          />
          <EditTagsForm
            show={showModal}
            onHide={() => setShowModal(false)}
            projectTags={projectTags}
            project={project}
            refetchParentTags={handleRefresh}
          />
        </>
      )}
    </div>
  );
};

export default EditTags;
