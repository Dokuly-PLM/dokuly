import React, { useState, useEffect } from "react";

import { get_active_customers } from "../customers/funcitons/queries";
import { getActiveProjectByCustomer } from "../projects/functions/queries";
import { fetchPrefixes } from "../admin/functions/queries";
import { createNewDocument } from "./functions/queries";
import DokulyModal from "../dokuly_components/dokulyModal";

const NewDocumentForm = (props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [active_customers, setActiveCustomers] = useState(null);
  const [selected_customer_id, setSelectedCustomerId] = useState(-1);

  const [projects, setProjects] = useState(null);
  const [selected_project_id, setSelectedProjectId] = useState(-1);

  const [internal_doc, setInternalDoc] = useState(true);

  const [selected_prefix_id, setSelectedPrefixId] = useState(-1);
  const [prefixes, setPrefixes] = useState([]);

  const [templatedocuments, setTemplateDocuments] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPrefixes().then((res) => {
      if (res.status === 200) {
        setPrefixes(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (
      selected_customer_id !== null &&
      selected_customer_id !== undefined &&
      selected_customer_id !== -1
    ) {
      getActiveProjectByCustomer(selected_customer_id).then((res) => {
        if (res !== undefined) {
          setProjects(res.data);
        }
      });
    }
  }, [selected_customer_id]);

  const launchNewDocumentForm = () => {
    setShowModal(true);
    let tempTemplateDocuments = props?.documents.filter((document) => {
      if (document.full_doc_number.includes("TMP")) {
        return document;
      }
    });
    setTemplateDocuments(tempTemplateDocuments);
    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
  };

  function onSubmit() {
    const data = {
      title: title,
      description: description,
      project: selected_project_id,
      internal: internal_doc,
      prefix_id: selected_prefix_id,
      template_id: selectedTemplate,
    };

    createNewDocument(data).then((res) => {
      if (res.status === 201) {
        setTitle("");
        setDescription("");
        setSelectedProjectId(-1);
        setSelectedPrefixId(-1);
        setInternalDoc(true);
        setSelectedTemplate(null);
        props?.setRefresh(true);
        setShowModal(false);
      }
    });
  }

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={launchNewDocumentForm}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">New document</span>
        </div>
      </button>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Create new document"
      >
        <div className="form-group">
          <label>Title</label>
          <input
            className="form-control"
            type="text"
            name="title"
            onChange={(e) => {
              if (e.target.value.length > 1000) {
                alert("Max length 1000");
                return;
              }
              setTitle(e.target.value);
            }}
            value={title}
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
          <label>Customer *</label>
          <select
            className="form-control"
            name="customer"
            type="number"
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">Choose customer</option>
            {active_customers == null
              ? ""
              : active_customers
                  .sort((a, b) => (a.customer_id > b.customer_id ? 1 : -1))
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
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Choose project</option>
            {projects == null || projects === undefined
              ? ""
              : projects
                  .sort((a, b) =>
                    a.project_number > b.project_number ? 1 : -1,
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
          <label htmlFor="project">Document protection level</label>
          <select
            className="form-control"
            name="protection"
            type="boolean"
            value={internal_doc}
            onChange={(e) => {
              if (e.target.value === "true") {
                setInternalDoc(true);
              } else {
                setInternalDoc(false);
              }
            }}
          >
            <option value={"true"}>Company protected</option>
            <option value={"false"}>Externally shareable</option>
          </select>
        </div>

        <div className="form-group">
          <label>Document type *</label>
          <select
            className="form-control"
            name="document_type"
            value={selected_prefix_id}
            onChange={(e) => {
              setSelectedPrefixId(e.target.value);
            }}
          >
            <option value="">Choose document type</option>
            {prefixes !== null &&
            prefixes !== undefined &&
            prefixes.length !== 0 ? (
              prefixes.map((prefix, index) => {
                return (
                  <option value={prefix.id} key={prefix.id}>
                    {prefix.prefix}
                    {" - "}
                    {prefix.display_name}
                  </option>
                );
              })
            ) : (
              <option>No Document types found!</option>
            )}
          </select>
        </div>
        <div className="form-group">
          {templatedocuments !== null &&
          templatedocuments !== undefined &&
          templatedocuments.length !== 0 ? (
            <div>
              <label>Template</label>
              <select
                className="form-control"
                name="document_type"
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                }}
              >
                <option value="">Select a template</option>
                {templatedocuments.map((document) => {
                  return (
                    <option value={document.id} key={document.id}>
                      {document.full_doc_number} - {document.title}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <span>
              No templates found! To create a template, go to the admin page and
              add a new document type with the prefix "TMP" All documents
              created with this prefix will be listed here, and a copy of the
              source file will be made to the new document
            </span>
          )}
        </div>

        <div className="form-group">
          <button
            className="btn dokuly-bg-primary"
            onClick={onSubmit}
            disabled={
              selected_prefix_id === -1 || selected_project_id === -1
                ? true
                : false
            }
          >
            Submit
          </button>
        </div>
      </DokulyModal>
    </div>
  );
};

export default NewDocumentForm;
