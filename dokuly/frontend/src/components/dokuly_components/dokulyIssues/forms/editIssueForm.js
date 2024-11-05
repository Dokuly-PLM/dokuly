import React from "react";
import DokulyModal from "../../dokulyModal";
import { Form, Row } from "react-bootstrap";
import { criticalityValues } from "../functions/criticalityValues";
import SubmitButton from "../../submitButton";
import DeleteButton from "../../deleteButton";

const EditIssueForm = ({
  title,
  setTitle,
  criticality,
  setCriticality,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const criticalityOptions = criticalityValues.map((value) => (
    <option key={value.value} value={value.value}>
      {value.value}
    </option>
  ));

  const backgroundColor =
    criticality === "Critical"
      ? "red"
      : criticality === "High"
      ? "#f6c208ff"
      : "#54a4daff";

  return (
    <DokulyModal show={isOpen} onHide={onClose} title="Edit Issue">
      <Form.Group>
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Criticality</Form.Label>
        <Form.Control
          style={{ border: `2px solid ${backgroundColor}` }}
          as="select"
          value={criticality}
          onChange={(e) => setCriticality(e.target.value)}
        >
          {criticalityOptions}
        </Form.Control>
      </Form.Group>
      <Row className="m-2 mt-4">
        <SubmitButton
          onClick={() => {
            onSubmit(null);
          }}
          type="submit"
        >
          Submit
        </SubmitButton>
        <DeleteButton buttonText="Delete" />
      </Row>
    </DokulyModal>
  );
};

export default EditIssueForm;
