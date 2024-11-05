import React, { useState, useEffect } from "react";
import {
  get_active_customers,
  fetchCustomer,
} from "../../customers/funcitons/queries";

import { newProject } from "../../admin/functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";

const NewProjectForm = (props) => {
  const [project_name, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [active_customers, setActiveCustomers] = useState([]);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
    setShowModal(true);
  };

  function onSubmit() {
    if (selected_customer_id === "") {
      return;
    }

    setShowModal(false);

    const data = {
      title: project_name,
      description: description,
      is_active: true,
      customer: parseInt(selected_customer_id),
    };

    newProject(data).then((res) => {
      if ((res.data = 201)) {
        if (props.setRefresh !== undefined) {
          props?.setRefresh(true);
        }
      }
    });
  }

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={openModal}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New project</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="New project"
      >
        <div className="form-group">
          <label>Project name</label>
          <input
            className="form-control"
            type="text"
            name="project_name"
            onChange={(e) => {
              if (e.target.value.length > 100) {
                alert("Max length 100");
                return;
              }
              setProjectName(e.target.value);
            }}
            value={project_name}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-control"
            type="text"
            name="description"
            onChange={(e) => {
              if (e.target.value.length > 1000) {
                alert("Max length 1000");
                return;
              }
              setDescription(e.target.value);
            }}
            value={description}
          />
        </div>

        <div className="form-group">
          <label>Customer</label>
          <select
            className="form-control"
            name="customer"
            type="number"
            value={selected_customer_id}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">Choose customer</option>
            {active_customers == null
              ? ""
              : active_customers
                  .sort((a, b) => (a.customer_id > b.customer_id ? 1 : -1))
                  .map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
          </select>
        </div>

        <div className="form-group">
          <button
            type="submit"
            className="btn dokuly-bg-primary"
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </DokulyModal>
    </div>
  );
};

export default NewProjectForm;
