import React, { useState, useEffect } from "react";
import { Modal, Form, Col, Row } from "react-bootstrap";
import SubmitButton from "../../../dokuly_components/submitButton";
import { updateLocation, archiveLocation } from "../../functions/queries";
import { toast } from "react-toastify";

const EditLocationForm = ({ location, locationTypes, setRefresh }) => {
  const [selectedLocationType, setSelectedLocationType] = useState("");
  const [row, setRow] = useState("");
  const [col, setCol] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [locationNumber, setLocationNumber] = useState("");
  const [locationName, setLocationName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [autoGenerateName, setAutoGenerateName] = useState(true);

  useEffect(() => {
    locationTypes.find((type) => {
      if (type.id === location.container_type_id) {
        setSelectedLocationType(type);
      }
    });
  }, [locationTypes, location.container_type_id]);

  useEffect(() => {
    setRow(location.location_row);
    setCol(location.location_column);
    setMaxCapacity(location.capacity_full);
    setNotes(location.notes);
    setLocationNumber(location.location_number);
    setLocationName(location.name);
  }, [location]);

  useEffect(() => {
    if (selectedLocationType && autoGenerateName) {
      const columnRow = selectedLocationType.has_row_or_col
        ? ` - ${col}${row}`
        : "";
      setLocationName(
        `${selectedLocationType.display_name} - ${locationNumber}${columnRow}`,
      );
    }
  }, [selectedLocationType, row, col, locationNumber]);

  const submit = () => {
    const data = {
      location_type_id_v2: selectedLocationType.id,
      location_number: locationNumber,
      location_name: locationName,
      row: row,
      col: col,
      max_capacity: maxCapacity,
      notes: notes,
    };

    updateLocation(location.id, data)
      .then((res) => {
        if (res && res.status === 200) {
          // Ensure that res is defined before checking the status
          toast.success("Location updated!");
          setRefresh(true);
        } else {
        }
      })
      .catch((err) => {
        console.error(err); // Check the error object in the console
      });

    setShowModal(false);
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this location?")) {
      return;
    }
    try {
      const response = await archiveLocation(location.id);

      if (response.status === 200) {
        setRefresh(true);

        setShowModal(false);
      } else {
        console.error("Error archiving location type");
      }
    } catch (error) {
      console.error("Error archiving location type:", error);
    }
  };

  const handleLocationTypeSelect = (event) => {
    const selectedTypeId = parseInt(event.target.value);
    const selectedType = locationTypes.find(
      (type) => type.id === selectedTypeId,
    );
    setSelectedLocationType(selectedType);
  };

  const isValidColumn = (value) => {
    const regex = /^[A-Z]{1,2}$/;
    return regex.test(value);
  };

  const isValidRow = (value) => {
    const regex = /^[1-9][0-9]?$/;
    return regex.test(value);
  };

  return (
    <>
      <button
        className="btn btn-sm ml-2"
        onClick={() => {
          setShowModal(true);
        }}
      >
        <img src="../../../static/icons/edit.svg" alt="edit" />{" "}
      </button>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header>
          <Modal.Title>Create inventory location</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "1rem 2rem" }}>
          <Form.Group as={Row}>
            <Form.Label>Location type *</Form.Label>

            <Form.Control
              as="select"
              value={selectedLocationType ? selectedLocationType.id : ""}
              onChange={(e) => handleLocationTypeSelect(e)}
            >
              <option value="">Select a location type</option>
              {locationTypes.map((locationType) => (
                <option key={locationType.id} value={locationType.id}>
                  {locationType.display_name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label>Location number *</Form.Label>

            <Form.Control
              type="text"
              value={locationNumber}
              onChange={(e) => setLocationNumber(e.target.value)}
            />
          </Form.Group>
          {selectedLocationType && selectedLocationType.has_row_or_col ? (
            <>
              <Form.Group as={Row}>
                <Form.Label column sm="6">
                  Column* <small className="text-muted">A-ZZ</small>
                </Form.Label>
                <Form.Label column sm="6">
                  Row* <small className="text-muted">1-99</small>
                </Form.Label>
              </Form.Group>
              <Form.Group as={Row}>
                <Col sm="6">
                  <Form.Control
                    type="text"
                    value={col}
                    onChange={(e) => {
                      const inputValue = e.target.value.toUpperCase();
                      if (isValidColumn(inputValue) || inputValue === "") {
                        setCol(inputValue);
                      }
                    }}
                  />
                </Col>
                <Col sm="6">
                  <Form.Control
                    type="text"
                    value={row}
                    onChange={(e) => {
                      const inputValue = e.target.value.toUpperCase();
                      if (isValidRow(inputValue) || inputValue === "") {
                        setRow(inputValue);
                      }
                    }}
                  />
                </Col>
              </Form.Group>
            </>
          ) : (
            ""
          )}
          <Form.Group as={Row}>
            <Form.Label>Max capacity</Form.Label>

            <Form.Control
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
            />
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label>Notes</Form.Label>

            <Form.Control
              as="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Label>Name</Form.Label>

            <Form.Control
              type="text"
              value={locationName}
              readOnly={autoGenerateName}
              onChange={setLocationName}
            />
          </Form.Group>
          <Form.Group as={Row}>
            <Form.Check
              type="checkbox"
              label="Auto generate name"
              checked={autoGenerateName}
              onChange={(e) => setAutoGenerateName(e.target.checked)}
            />
          </Form.Group>

          <SubmitButton
            onClick={() => submit()}
            className="btn dokuly-bg-primary"
            disabled={
              locationName === "" ||
              selectedLocationType === null ||
              locationNumber === ""
            }
            disabledTooltip={
              "Mandatory fields must be entered. Mandatory fields are marked with *"
            }
          >
            Submit
          </SubmitButton>
          <button
            type="button"
            className="btn btn-bg-transparent mt-2"
            onClick={(e) => handleArchive(e)}
          >
            {" "}
            <img src="../../static/icons/trash.svg" alt="archive" />
            <span className="btn-text">Archive</span>
          </button>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EditLocationForm;
