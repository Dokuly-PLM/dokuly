import React, { useState } from "react";
import { create_customer } from "../funcitons/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";
import { Row } from "react-bootstrap";
import SidebarIcon from "../../dokuly_components/dokulyIcons/sidebarIcon";

/**
 * # Button with form to create a new customer.
 */
const CustomerNewForm = (props) => {
  const [customer_name, setCustomerName] = useState("");
  const [contact_name, setContactName] = useState("");
  const [contact_email, setContactEmail] = useState("");
  const [contact_phone_number, setContactPhoneNumber] = useState("");
  const [showModal, setShowModal] = useState(false);

  function clearFields() {
    setCustomerName("");
    setContactName("");
    setContactEmail("");
    setContactPhoneNumber("");
  }

  const newCustomerForm = () => {
    setShowModal(true);
  };

  function onSubmit() {
    let data = {
      name: customer_name,
      contact_name: contact_name,
      contact_email: contact_email,
      contact_phone_number: contact_phone_number,
    };

    // Push data to the database
    create_customer(data).then((res) => {
      if (res.status === 201) {
        props?.setRefresh(true);
        clearFields();
      }
    });

    setShowModal(false);
  }

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={newCustomerForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New customer</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={
          <Row className="mx-1">
            <span className="mx-2">Create new customer</span>
            <SidebarIcon app="customers" width={25} />
          </Row>
        }
      >
        <div className="form-group">
          <label>Customer name *</label>
          <input
            className="form-control"
            type="text"
            name="customer_name"
            onChange={(e) => {
              if (e.target.value.length > 50) {
                alert("Max length 50");
                return;
              }
              setCustomerName(e.target.value);
            }}
            value={customer_name}
          />
        </div>

        <div className="form-group">
          <label>Contact name</label>
          <input
            className="form-control"
            type="text"
            name="contact_name"
            onChange={(e) => {
              if (e.target.value.length > 50) {
                alert("Max length 50");
                return;
              }
              setContactName(e.target.value);
            }}
            value={contact_name}
          />
        </div>

        <div className="form-group">
          <label>Contact email</label>
          <input
            className="form-control"
            type="email"
            name="contact_email"
            onChange={(e) => {
              if (e.target.value.length > 75) {
                alert("Max length 75");
                return;
              }
              setContactEmail(e.target.value);
            }}
            value={contact_email}
          />
        </div>

        <div className="form-group">
          <label>Contact phone number</label>
          <input
            className="form-control"
            type="text"
            name="contact_phone_number"
            onChange={(e) => {
              if (e.target.value.length > 20) {
                alert("Max length 20");
                return;
              }
              setContactPhoneNumber(e.target.value);
            }}
            value={contact_phone_number}
          />
        </div>

        <div className="form-group">
          <button
            className="btn dokuly-bg-primary"
            onClick={onSubmit}
            disabled={customer_name === ""}
          >
            Submit
          </button>
        </div>
      </DokulyModal>
    </div>
  );
};

export default CustomerNewForm;
