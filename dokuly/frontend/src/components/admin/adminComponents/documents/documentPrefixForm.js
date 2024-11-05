import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { newPrefix, editPrefix } from "../../functions/queries";
import { toast } from "react-toastify";
import DeleteButton from "../../../dokuly_components/deleteButton";

const DocumentPrefixForm = ({ show, onHide, setRefresh, prefixSelected }) => {
  const [display_name, setDisplayName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [description, setDescription] = useState("");
  const [part_doc, setPartDoc] = useState(true);
  const [project_doc, setProjectDoc] = useState(true);

  const resetStates = () => {
    setDisplayName("");
    setPrefix("");
    setDescription("");
    setPartDoc(true);
    setProjectDoc(true);
  };

  const archivePrefix = () => {
    if (!confirm("Are you sure you want to delete this prefix?")) return;

    if (prefixSelected) {
      editPrefix(prefixSelected.id, { archive: true }).then((res) => {
        if (res.status === 200) {
          toast.success("Prefix deleted successfully");
          resetStates();
          onHide(); // Hide modal
          setRefresh(true); // Refresh the page
        } else {
          toast.error("Error when deleting, check inputs and connection");
        }
      });
    }
  };

  const submit = () => {
    if (!display_name || !prefix) {
      toast.error("Enter a name and prefix");
      return;
    }

    const data = {
      display_name,
      prefix,
      description,
      part_doc,
      project_doc,
    };

    if (prefixSelected) {
      data.id = prefixSelected.id;
      editPrefix(data.id, data).then((res) => {
        if (res.status === 200) {
          toast.success("Prefix updated successfully");
          resetStates();
          onHide(); // Hide modal
          setRefresh(true); // Refresh the page
        } else {
          toast.error("Error when saving, check inputs and connection");
        }
      });
    } else {
      newPrefix(data).then((res) => {
        if (res.status === 200) {
          toast.success("Prefix added successfully");
          resetStates();
          onHide(); // Hide modal
          setRefresh(true); // Refresh the page
        } else {
          toast.error("Error when saving, check inputs and connection");
        }
      });
    }
  };

  useEffect(() => {
    if (prefixSelected) {
      setDisplayName(prefixSelected.display_name);
      setPrefix(prefixSelected.prefix);
      setDescription(prefixSelected.description);
      setPartDoc(prefixSelected.part_doc);
      setProjectDoc(prefixSelected.project_doc);
    }
  }, [prefixSelected]);

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header>
        <Modal.Title>Document Prefix Form</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="formDisplayName">
            <Form.Label>Display name*</Form.Label>
            <Form.Control
              type="text"
              value={display_name}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="formPrefix">
            <Form.Label>Prefix*</Form.Label>
            <Form.Control
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
          <Row className="mt-2">
            <Col>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Button className="dokuly-btn-primary" onClick={submit}>
                  Submit
                </Button>
                <DeleteButton onDelete={archivePrefix} />
              </div>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default DocumentPrefixForm;
