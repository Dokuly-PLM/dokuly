import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  newProtectionLevel,
  editProtectionLevel,
} from "../../functions/queries";

const ProtectionLevelForm = (props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (props.protectionLevelSelected) {
      setName(props.protectionLevelSelected.name || "");
      setDescription(props.protectionLevelSelected.description || "");
      setLevel(props.protectionLevelSelected.level || 0);
    } else {
      resetForm();
    }
  }, [props.protectionLevelSelected]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setLevel(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim(),
      level: parseInt(level, 10),
    };

    if (props.protectionLevelSelected) {
      // Edit existing protection level
      editProtectionLevel(props.protectionLevelSelected.id, data)
        .then((res) => {
          if (res.status === 200) {
            toast.success("Protection level updated");
            props.setRefresh(true);
            props.onHide();
            resetForm();
          }
        })
        .catch((error) => {
          toast.error(
            error.response?.data || "Error updating protection level"
          );
        });
    } else {
      // Create new protection level
      newProtectionLevel(data)
        .then((res) => {
          if (res.status === 200) {
            toast.success("Protection level created");
            props.setRefresh(true);
            props.onHide();
            resetForm();
          }
        })
        .catch((error) => {
          toast.error(
            error.response?.data || "Error creating protection level"
          );
        });
    }
  };

  const handleClose = () => {
    resetForm();
    props.onHide();
  };

  return (
    <Modal show={props.show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {props.protectionLevelSelected
            ? "Edit Protection Level"
            : "New Protection Level"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter protection level name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Examples: Internal, Confidential, Public, Customer Releasable
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {description.length}/500 characters
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Level *</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter numeric level for sorting"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Numeric value used to sort protection levels in increasing order (e.g., 0=Public, 1=Internal, 2=Confidential)
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          {props.protectionLevelSelected ? "Save Changes" : "Create"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProtectionLevelForm;
