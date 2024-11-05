import React, { useEffect } from "react";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { Form } from "react-bootstrap";
import SubmitButton from "../../dokuly_components/submitButton";

const CreateSerialNumbersForm = ({
  showModal,
  onHideModal,
  onSubmit,
  setLatestSerialNumber,
  setSelectedItem,
  selectedItem,
  setSerialNumberPrefix,
  setSerialNumberOffset,
  latestSerialNumber,
  serialNumberOffset,
  serialNumberPrefix,
  assemblyDate,
  setAssemblyDate,
  quantity,
  setQuantity,
  description,
  setDescription,
}) => {
  useEffect(() => {
    if (selectedItem) {
      setLatestSerialNumber(selectedItem.serial_number_counter);
    } else {
      setLatestSerialNumber(0);
    }
  }, [selectedItem]);

  return (
    <DokulyModal
      show={showModal}
      onHide={onHideModal}
      title="Create serial number(s)"
    >
      <Form.Group>
        <Form.Label>Assembly date *</Form.Label>
        <Form.Control
          type="date"
          onChange={(e) => setAssemblyDate(e.target.value)}
          className="dokuly-form-input"
          value={assemblyDate}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Quantity *</Form.Label>
        <Form.Control
          type="text"
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || /^\d*$/.test(value)) {
              setQuantity(value);
            }
            if (value === "0") {
              setQuantity("1");
            }
          }}
          className="dokuly-form-input"
          value={quantity}
        />
      </Form.Group>
      {latestSerialNumber === 0 && (
        <Form.Group>
          <Form.Label>Prefix</Form.Label>
          <Form.Control
            type="text"
            onChange={(e) => setSerialNumberPrefix(e.target.value)}
            className="dokuly-form-input"
            value={serialNumberPrefix}
          />
        </Form.Group>
      )}
      {latestSerialNumber === 0 && (
        <Form.Group>
          <Form.Label>Offset</Form.Label>
          <Form.Control
            type="number"
            onChange={(e) => setSerialNumberOffset(e.target.value)}
            className="dokuly-form-input"
            value={serialNumberOffset}
          />
        </Form.Group>
      )}
      <Form.Group>
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          type="text"
          onChange={(e) => setDescription(e.target.value)}
          className="dokuly-form-input"
          value={description}
        />
      </Form.Group>
      <Form.Group className="mt-2">
        <SubmitButton
          onClick={onSubmit}
          disabled={
            !assemblyDate ||
            Number.parseInt(quantity, 10) <= 0 ||
            !Number.isInteger(Number.parseInt(quantity, 10)) ||
            !selectedItem
          }
          className="btn dokuly-bg-primary mt-2"
          disabledTooltip={
            "Mandatory fields must be entered. Mandatory fields are marked with *"
          }
        >
          Submit
        </SubmitButton>
      </Form.Group>
    </DokulyModal>
  );
};

export default CreateSerialNumbersForm;
