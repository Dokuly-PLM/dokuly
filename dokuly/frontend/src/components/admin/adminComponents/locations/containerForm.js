import React, { useState, useEffect } from "react";
import { createLocationType } from "../../functions/queries";
import SubmitButton from "../../../dokuly_components/submitButton";
import { Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";

const ContainerForm = (props) => {
  const [open, setOpen] = useState(false);
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [hasColumnsRows, setHasColumnsRows] = useState(false);

  const submit = () => {
    if (display_name === "") {
      toast.error("Enter a display name!");
    }

    // Convert hasColumnsRows to 1 or 0 to fit the database
    let tempRowCol = 0;
    if (hasColumnsRows) {
      tempRowCol = 1;
    }

    const data = {
      display_name: display_name,
      description: description,
      has_row_or_col: tempRowCol,
    };
    createLocationType(data)
      .then((res) => {
        if (res.status === 201) {
          toast.success("Location type created!");
          const data = {
            types: res.data,
            newData: true,
          };
          props.setRefresh(true);
          setOpen(false);
        }
      })
      .catch((err) => {
        setOpen(false);
        toast.error("Error saving to db, check connection.");
      });
  };

  return (
    <>
      <button
        className="btn btn-sm ml-2"
        onClick={() => {
          setOpen(true);
        }}
      >
        <img src="../../../static/icons/plus.svg" alt="plus" />{" "}
        <span className="btn-text"> Add type</span>
      </button>

      <Modal show={open} onHide={() => setOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add location type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>Display name*</label>
            <input
              className="form-control"
              type="text"
              name="name"
              onChange={(e) => setDisplayName(e.target.value)}
              value={display_name}
            />
          </div>
          <Form.Group>
            <Form.Check
              type="checkbox"
              id="hasColumnsRows"
              label="Has columns and rows"
              checked={hasColumnsRows}
              onChange={(e) => setHasColumnsRows(e.target.checked)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <SubmitButton
            onClick={() => submit()}
            className="btn dokuly-bg-primary"
            disabled={display_name === ""}
            disabledTooltip={
              "Mandatory fields must be entered. Mandatory fields are marked with *"
            }
          >
            Submit
          </SubmitButton>
          <button
            className="btn btn-bg-transparent btn-sm ml-2"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ContainerForm;
