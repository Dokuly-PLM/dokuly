import React, { useState, useEffect } from "react";
import { editCustomer } from "../../admin/functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";
import SidebarIcon from "../../dokuly_components/dokulyIcons/sidebarIcon";
import { Row } from "react-bootstrap";

/**
 * # Button with form to edit customers.
 */
const EditCustomerForm = (props) => {
  const [is_active, setIsActive] = useState(false);
  const [customer_name, setCustomerName] = useState("");
  const [contact_name, setContactName] = useState("");
  const [contact_email, setContactEmail] = useState("");
  const [contact_phone_number, setContactPhoneNumber] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (props.edit_customer !== -1) {
      launchEditCustomerForm();
    }
  }, [props.edit_customer]);

  const launchEditCustomerForm = () => {
    if (props.customer !== undefined) {
      setCustomerName(props.customer?.name);
      setIsActive(props.customer?.is_active);
      setContactName(props.customer?.contact_name);
      setContactEmail(props.customer?.contact_email);
      setContactPhoneNumber(props.customer?.contact_phone_number);
      setShowModal(true);
    }
  };

  function onSubmit() {
    const data = {
      name: customer_name,
      is_active: is_active,
      contact_name: contact_name,
      contact_email: contact_email,
      contact_phone_number: contact_phone_number,
    };

    // Push data to the database
    editCustomer(props.customer?.id, data).then((res) => {
      if (res.status === 200) {
        props?.setRefreshParent(true);
      }
    });

    setShowModal(false);
  }

  function archiveCustomer() {
    if (!confirm("Are you sure you want to archive this customer?")) {
      return;
    }
    const data = {
      is_archived: true,
    };

    // Push data to the database
    editCustomer(props.customer?.id, data).then((res) => {
      if (res.status === 200) {
        if (props.setRefreshParent !== undefined) {
          props.setRefreshParent(true);
        }
      }
    });

    setShowModal(false);
  }

  return (
    <React.Fragment>
      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={
          <Row className="mx-1">
            <span className="mx-2">Edit customer</span>
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

        <div>
          <div className="form-group">
            <label htmlFor="is_active">
              <input
                type="checkbox"
                name="is_active"
                checked={is_active}
                onChange={() => setIsActive(!is_active)}
              />{" "}
              Active Customer
            </label>
          </div>
        </div>

        <div className="form-group">
          <button
            type="button"
            className="btn dokuly-bg-primary"
            disabled={customer_name === ""}
            onClick={onSubmit}
          >
            Submit
          </button>

          <button
            className={"btn btn-bg-transparent ml-2"}
            data-placement="top"
            title={"archive_customer"}
            onClick={archiveCustomer}
            type="button"
          >
            <div className="row">
              <img
                className="icon-dark"
                src="../../static/icons/trash.svg"
                alt="Archive Icon"
              />
              <span className="btn-text">Archive</span>
            </div>
          </button>
        </div>
      </DokulyModal>
    </React.Fragment>
  );
};

export default EditCustomerForm;
