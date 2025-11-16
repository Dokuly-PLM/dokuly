import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Tab,
  Tabs,
  Modal,
  Button,
  Form,
  FormGroup,
  Col,
  Container,
  Row,
} from "react-bootstrap";

import SubmitButton from "../../dokuly_components/submitButton";
import GlobalPartSelection from "../../dokuly_components/globalPartSelector/globalPartSelection";
import { createNewProductionLot } from "../functions/queries";

export const modelToAppName = {
  Part: "parts",
  PCBA: "pcbas",
  Assembly: "assemblies",
};

const NewProductionForm = (props) => {
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [assemblyDate, setAssemblyDate] = useState(
    new Date().toISOString().substr(0, 10)
  );
  const [state, setState] = useState("");
  const [comment, setComment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [app, setApp] = useState("");

  // State variables for selected part, PCBA, and assembly
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedPcba, setSelectedPcba] = useState(null);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [latestSerialNumber, setLatestSerialNumber] = useState(0);
  const [serialNumberPrefix, setSerialNumberPrefix] = useState("");
  const [serialNumberOffset, setSerialNumberOffset] = useState(0);

  const launchNewItemForm = () => {
    setShowModal(true);
    setSelectedItem(null);
    setQuantity(1);
    setAssemblyDate(new Date().toISOString().substr(0, 10));
    setComment("");
    setSerialNumberPrefix("");
    setSerialNumberOffset(0);
  };

  const onCloseModal = () => {
    setShowModal(false);
  };

  const onSubmit = () => {
    // Check if at least one of the selections is made
    if (!selectedItem) {
      toast.error("Please select a part, PCBA, or assembly.");
      return;
    }

    const data = {
      quantity: Number.parseInt(quantity, 10),
      assembly_date: assemblyDate,
      title: title,
      object_id: selectedItem.id,
      app: app,
    };

    if (selectedItem.item_type === "PCBA") {
      data.pcba = selectedItem.id;
    } else if (selectedItem.item_type === "Part") {
      data.part = selectedItem.id;
    } else if (selectedItem.item_type === "Assembly") {
      data.assembly = selectedItem.id;
    }

    createNewProductionLot(data)
      .then((res) => {})
      .catch((err) => {})
      .finally(() => {
        onCloseModal();
        props.setRefresh(true);
      });
  };

  const setSelectedPartItem = (part) => {
    setSelectedItem(part);
    setTitle(part?.display_name);
    setApp(modelToAppName[part?.item_type]);
  };

  return (
    <Container fluid>
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={launchNewItemForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New production lot</span>
        </div>
      </button>

      <Modal
        show={showModal}
        onHide={onCloseModal}
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <Modal.Title>New production lot</Modal.Title>
          <small className="form-text text-muted pl-3">
            * Mandatory fields
          </small>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={(e) => e.preventDefault()}>
            <FormGroup>
              <GlobalPartSelection setSelectedItem={setSelectedPartItem} />
            </FormGroup>
            {selectedItem ? (
              <FormGroup>
                <Form.Label>Selected item</Form.Label>
                <Form.Control
                  type="text"
                  className="dokuly-form-input"
                  value={`${selectedItem.full_part_number} - ${selectedItem.display_name}`}
                  disabled
                />
              </FormGroup>
            ) : (
              <FormGroup>
                <Form.Label>Selected item</Form.Label>
                <Form.Control
                  type="text"
                  className="dokuly-form-input"
                  value="Please select a part, PCBA, or assembly."
                  disabled
                />
              </FormGroup>
            )}

            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                onChange={(e) => setTitle(e.target.value)}
                className="dokuly-form-input"
                value={title}
              />
            </Form.Group>

            <FormGroup>
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
            </FormGroup>

            <FormGroup>
              <Form.Label>Assembly date *</Form.Label>
              <Form.Control
                type="date"
                onChange={(e) => setAssemblyDate(e.target.value)}
                className="dokuly-form-input"
                value={assemblyDate}
              />
            </FormGroup>

            <FormGroup className="mt-2">
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
            </FormGroup>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default NewProductionForm;
