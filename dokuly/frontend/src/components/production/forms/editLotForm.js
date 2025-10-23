import React from "react";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { Form, Row } from "react-bootstrap";
import SubmitButton from "../../dokuly_components/submitButton";
import DeleteButton from "../../dokuly_components/deleteButton";
import GlobalPartSelection from "../../dokuly_components/globalPartSelector/globalPartSelection";

const EditLotForm = ({
  title,
  quantity,
  lotNumber,
  plannedProductionDate,
  setTitle,
  setQuantity,
  setPlannedProductionDate,
  setLotNumber,
  selectedItem,
  setSelectedPartItem,
  showModal,
  setShowModal,
  onSubmit,
  onDelete,
}) => {
  return (
    <DokulyModal
      title="Edit lot"
      onHide={() => setShowModal(false)}
      show={showModal}
    >
      <Form.Group>
        <GlobalPartSelection setSelectedItem={setSelectedPartItem} />
      </Form.Group>
      {selectedItem ? (
        <Form.Group>
          <Form.Label>Selected item</Form.Label>
          <Form.Control
            type="text"
            className="dokuly-form-input"
            value={`${(() => {
              const useNumberRevisions = selectedItem?.organization?.use_number_revisions || false;
              if (useNumberRevisions) {
                // For number revisions, full_part_number already includes the revision with underscore
                return selectedItem.full_part_number;
              }
              // For letter revisions, append the revision to the base part number
              return `${selectedItem.full_part_number}${selectedItem.revision}`;
            })()} - ${selectedItem.display_name}`}
            disabled
          />
        </Form.Group>
      ) : (
        <Form.Group>
          <Form.Label>Selected item</Form.Label>
          <Form.Control
            type="text"
            className="dokuly-form-input"
            value="Please select a part, PCBA, or assembly."
            disabled
          />
        </Form.Group>
      )}
      <Form.Group>
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          placeholder="Enter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Quantity</Form.Label>
        <Form.Control
          type="number"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Assembly date</Form.Label>
        <Form.Control
          type="date"
          onChange={(e) => setPlannedProductionDate(e.target.value)}
          className="dokuly-form-input"
          value={plannedProductionDate}
        />
      </Form.Group>
      <Row className="m-2 mt-3">
        <SubmitButton onClick={() => onSubmit(null)} className={"mr-2"}>
          Submit
        </SubmitButton>
        <DeleteButton buttonText="Delete" onDelete={onDelete} />
      </Row>
    </DokulyModal>
  );
};

export default EditLotForm;
