import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import {
  updateLocationType,
  archiveLocationType,
} from "../../functions/queries";
import SubmitButton from "../../../dokuly_components/submitButton";
import DeleteButton from "../../../dokuly_components/deleteButton";
import { toast } from "react-toastify";

const EditContainerForm = ({ rowData, closeModal, setRefresh }) => {
  const [displayName, setDisplayName] = useState(rowData.display_name);
  const [description, setDescription] = useState(rowData.description);
  const [hasColumnsRows, setHasColumnsRows] = useState(rowData.has_row_or_col);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare the data to be sent in the request
      let tempRowCol = 0;
      if (hasColumnsRows) {
        tempRowCol = 1;
      }

      const data = {
        display_name: displayName,
        description: description,
        has_row_or_col: tempRowCol,
      };

      // Call the external updateLocationType function
      const response = await updateLocationType(rowData.id, data);

      if (response.status === 200) {
        // Handle the successful response here
        setRefresh(true);
        toast.success("Location updated!");

        closeModal(); // Close the modal after submitting the form
      } else {
        // Handle any non-200 status codes here
        console.error("Error updating location type");
      }
    } catch (error) {
      console.error("Error updating location type:", error);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this location type?")) {
      return;
    }
    try {
      const response = await archiveLocationType(rowData.id);

      if (response.status === 200) {
        setRefresh(true);

        closeModal();
      } else {
        console.error("Error archiving location type");
      }
    } catch (error) {
      console.error("Error archiving location type:", error);
    }
  };

  return (
    <>
      <Form.Group controlId="formDisplayName">
        <Form.Label>Display Name</Form.Label>
        <Form.Control
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Form.Group>

      <Form.Group controlId="formDescription">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Form.Group>
      <div style={{ display: "flex", alignItems: "center" }}>
        <SubmitButton
          onClick={(e) => handleSubmit(e)}
          className="btn dokuly-bg-primary mt-2"
          disabled={displayName === ""}
          disabledTooltip={
            "Mandatory fields must be entered. Mandatory fields are marked with *"
          }
        >
          Submit
        </SubmitButton>
        <DeleteButton onDelete={(e) => handleArchive(e)} />
      </div>
    </>
  );
};

export default EditContainerForm;
