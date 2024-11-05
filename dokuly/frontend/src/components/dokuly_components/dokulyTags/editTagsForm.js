import React, { useState } from "react";
import DokulyModal from "../dokulyModal";
import { Col, Row } from "react-bootstrap";
import DokulyFormSection from "../dokulyForm/dokulyFormSection";
import ColorPicker from "../dokulyForm/colorPicker";
import CancelButton from "../cancelButton";
import EditButton from "../editButton";
import { Tag } from "./dokulyTags";
import DeleteButton from "../deleteButton";
import { deleteProjectTag, updateProjectTag } from "./functions/queries";
import { toast } from "react-toastify";
import SubmitButton from "../submitButton";
import QuestionToolTip from "../questionToolTip";

const EditTagsForm = ({
  show,
  onHide,
  projectTags = [],
  project,
  refetchParentTags = () => {},
}) => {
  // State to track the tag being edited
  const [editingTag, setEditingTag] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [newTagColor, setNewTagColor] = useState("#155216");

  // Handler to start editing a tag
  const handleEditTag = (tag) => {
    setEditingTag(tag.id);
    setInputValue(tag.name);
    setNewTagColor(tag.color);
  };

  // Handler to save the changes
  const handleSaveTag = () => {
    const data = {
      name: inputValue,
      color: newTagColor,
    };
    if (!data.name) {
      toast.error("Tag name cannot be empty");
      return;
    }
    // Logic to save the edited tag
    updateProjectTag(data, editingTag).then((res) => {
      if (res.status === 200) {
        refetchParentTags();
      } else {
        toast.error("Failed to update tag");
      }
    });
    // Clear the editing state after saving
    setEditingTag(null);
    setInputValue("");
    setNewTagColor("#155216");
  };

  // Handler to delete a tag
  const handleDeleteTag = (tag) => {
    if (!confirm(`Are you sure you want to remove the "${tag.name}" tag?`)) {
      return;
    }
    // Logic to delete the tag
    deleteProjectTag(tag.id).then((res) => {
      if (res.status === 200) {
        refetchParentTags();
      } else {
        toast.error("Failed to delete tag");
      }
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSaveTag();
    }
  };

  // Handler to cancel editing
  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  // Handler to update the input value
  const handleInputChange = (text) => {
    setInputValue(text);
  };

  return (
    <DokulyModal
      show={show}
      onHide={onHide}
      title={
        project?.id !== 0 && project ? (
          `Edit project tags: ${
            project?.project_number ? `${project?.project_number} -` : ""
          }  ${project?.title}`
        ) : (
          <Row className="mx-2">
            <span className="mx-2">Edit generic tags</span>
            <QuestionToolTip
              placement="right"
              optionalHelpText={
                "These are tags with no project.\nThey are shared with all items that does not have a project connected."
              }
            />
          </Row>
        )
      }
      size="lg"
    >
      {projectTags.length !== 0 ? (
        projectTags.map((tag) => (
          <Row
            key={tag.id}
            className="align-items-center justify-content-start mb-2"
          >
            {editingTag === tag.id ? (
              <>
                <div className="mx-2" />
                <DokulyFormSection
                  label="Tag Name"
                  value={inputValue}
                  onChange={handleInputChange}
                  id="tagName"
                  className="mx-2"
                  onKeyDown={onKeyDown}
                />
                <ColorPicker
                  style={{ width: "75px" }}
                  label="Color"
                  value={newTagColor}
                  onChange={setNewTagColor}
                  id="newTagColor"
                />
                <SubmitButton
                  className="ml-3"
                  style={{ marginTop: "2rem" }}
                  onClick={handleSaveTag} // Save the changes
                >
                  Submit
                </SubmitButton>
                <CancelButton
                  className="btn btn-bg-transparent"
                  onClick={handleCancelEdit}
                  style={{ marginTop: "2rem" }}
                  useDefaultStyles={false}
                >
                  <span className="btn-text">Cancel</span>
                </CancelButton>
              </>
            ) : (
              // If not editing, show tag details with an edit button
              <>
                <Col className="col-6 justify-content-start align-items-center">
                  <div style={{ width: "fit-content" }}>
                    <Tag
                      key={tag.name}
                      tag={tag}
                      onRemove={() => {}}
                      style={{
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </Col>
                <Col className="col-3" />
                <Col className="col-3">
                  <Row className="justify-content-end align-items-center">
                    <EditButton
                      buttonText="Edit"
                      onClick={() => handleEditTag(tag)} // Edit the tag
                    />
                    <DeleteButton
                      className="ml-2"
                      onDelete={() => handleDeleteTag(tag)} // Delete the tag
                      buttonText="Delete"
                    />
                  </Row>
                </Col>
              </>
            )}
          </Row>
        ))
      ) : (
        <div className="m-2">No project tags found</div>
      )}
    </DokulyModal>
  );
};

export default EditTagsForm;
