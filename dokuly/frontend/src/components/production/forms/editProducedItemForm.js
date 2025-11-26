import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { editSerialNumber, deleteSerialNumber } from "../functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import DeleteButton from "../../dokuly_components/deleteButton";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { Form } from "react-bootstrap";
import moment from "moment";

const EditProducedItemForm = ({ producedItem, setRefresh }) => {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [state, setState] = useState("");
  const [comment, setComment] = useState("");
  const [assemblyDate, setAssemblyDate] = useState("");

  useEffect(() => {
    if (producedItem) {
      setState(producedItem.state || "");
      setComment(producedItem.comment || "");
      if (producedItem.assembly_date) {
        setAssemblyDate(moment(producedItem.assembly_date).format("YYYY-MM-DD"));
      } else {
        setAssemblyDate("");
      }
    }
  }, [producedItem]);

  const launchForm = () => {
    setShowModal(true);
  };

  const onSubmit = () => {
    const data = {
      state: state,
      comment: comment,
      assembly_date: assemblyDate || null,
    };

    editSerialNumber(producedItem.id, data).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
        toast.success("Produced item updated");
        setShowModal(false);
      } else {
        toast.error("Error updating produced item.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this produced item?")) {
      return;
    }

    deleteSerialNumber(producedItem.id).then((res) => {
      if (res.status === 200) {
        setShowModal(false);
        // Navigate back to production list or lot page
        if (producedItem?.lot?.id) {
          navigate(`/production/lot/${producedItem.lot.id}`);
        } else {
          navigate("/production");
        }
      }
    });
  };

  return (
    <React.Fragment>
      <button
        type="button"
        className="btn btn-bg-transparent"
        onClick={() => launchForm()}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/edit.svg"
            alt="icon"
          />
          <span className="btn-text">Edit</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Edit Produced Item"
      >
        <div className="form-group">
          <Form.Group className="mb-3">
            <Form.Label>Assembly Date</Form.Label>
            <Form.Control
              type="date"
              value={assemblyDate}
              onChange={(e) => setAssemblyDate(e.target.value)}
              className="dokuly-form-input"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>State</Form.Label>
            <Form.Control
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Enter state"
              className="dokuly-form-input"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Comment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={comment}
              onChange={(e) => {
                if (e.target.value.length > 800) {
                  toast.info("Max length 800 characters");
                  return;
                }
                setComment(e.target.value);
              }}
              placeholder="Enter comment"
              className="dokuly-form-input"
            />
            <Form.Text className="text-muted">
              {comment.length}/800 characters
            </Form.Text>
          </Form.Group>

          <div className="form-group mt-3 d-flex align-items-center">
            <SubmitButton
              type="submit"
              onClick={onSubmit}
            >
              Submit
            </SubmitButton>

            <DeleteButton onDelete={handleDelete} />
          </div>
        </div>
      </DokulyModal>
    </React.Fragment>
  );
};

export default EditProducedItemForm;
