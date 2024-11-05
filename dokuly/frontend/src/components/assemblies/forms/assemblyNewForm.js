import React, { useState, useEffect } from "react";
import { createNewAssembly } from "../functions/queries";
import { get_active_customers } from "../../customers/funcitons/queries";
import { getActiveProjectByCustomer } from "../../projects/functions/queries";
import { propTypes } from "react-bootstrap/esm/Image";
import SubmitButton from "../../dokuly_components/submitButton";
import { toast } from "react-toastify";
import ExternalPartNumberFormGroup from "../../common/forms/externalPartNumberFormGroup";

/**
 * # Button with form to create a new assembly.
 */
const NewAssemblyForm = (props) => {
  const [display_name, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [created_assembly, setCreatedAssembly] = useState(null);
  const [active_customers, setActiveCustomers] = useState(null);
  const [selected_customer_id, setSelectedCustomerId] = useState(-1);

  const [projects, setProjects] = useState(null);
  const [selected_project_id, setSelectedProjectId] = useState(-1);

  const [externalPartNumber, setExternalPartNumber] = useState("");

  useEffect(() => {
    if (
      selected_customer_id !== null &&
      selected_customer_id !== undefined &&
      selected_customer_id !== -1
    ) {
      getActiveProjectByCustomer(selected_customer_id).then((res) => {
        if (res.status === 200) {
          setProjects(res.data);
        }
      });
    }
  }, [selected_customer_id]);

  const launchNewAssemblyForm = () => {
    $("#addModal").modal("show");

    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
  };

  function onSubmit() {
    $("#addModal").modal("hide");

    const data = {
      // Fields used by the view.
      display_name: display_name,
      description: description,
      project: parseInt(selected_project_id),
      external_part_number: externalPartNumber,
    };

    // Push data to the database
    createNewAssembly(data)
      .then((res) => {
        if (res.status === 201) {
          toast.success("Assembly created!");
        }
        setCreatedAssembly(res.data);
        props?.setRefresh(true);
      })
      .catch((err) => {
        toast.error(`Error creating ASM, status ${err.response.status}`);
      });
  }

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={() => launchNewAssemblyForm()}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="plus"
          />
          <span className="btn-text">New assembly</span>
        </div>
      </button>

      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        id="addModal"
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create new assembly</h5>

              <small className="form-text text-muted pl-3">
                * Mandatory fields
              </small>

              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* Form inputs below */}

            <div className="modal-body">
              <div className="form-group">
                <label>Display name *</label>
                <input
                  className="form-control"
                  type="text"
                  name="display_name"
                  onChange={(e) => {
                    if (e.target.value.length > 100) {
                      alert("Max length 50");
                      return;
                    }
                    setDisplayName(e.target.value);
                  }}
                  value={display_name}
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

              <ExternalPartNumberFormGroup
                externalPartNumber={externalPartNumber}
                setExternalPartNumber={setExternalPartNumber}
              />

              <div className="form-group">
                <label>Customer *</label>
                <select
                  className="form-control"
                  name="customer"
                  type="number"
                  //value={selected_customer_name}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">Choose customer</option>
                  {active_customers == null
                    ? ""
                    : active_customers
                        .sort((a, b) =>
                          a.customer_id > b.customer_id ? 1 : -1
                        )
                        .map((customer) => {
                          return (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          );
                        })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="project">Project *</label>
                <select
                  className="form-control"
                  name="project"
                  type="number"
                  //value={this.state.projecat}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Choose project</option>
                  {projects == null || projects === undefined
                    ? ""
                    : projects
                        .sort((a, b) =>
                          a.project_number > b.project_number ? 1 : -1
                        )
                        .map((project) => {
                          return (
                            <option key={project.id} value={project.id}>
                              {project.title}
                            </option>
                          );
                        })}
                </select>
              </div>

              <div className="form-group">
                <SubmitButton
                  onClick={() => {
                    onSubmit();
                  }}
                  disabled={selected_project_id === -1 || display_name === ""}
                  type={"submit"}
                  className="btn dokuly-bg-primary "
                  disabledTooltip={
                    "Mandatory fields must be entered. Mandatory fields are marked with *"
                  }
                >
                  Submit
                </SubmitButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAssemblyForm;
