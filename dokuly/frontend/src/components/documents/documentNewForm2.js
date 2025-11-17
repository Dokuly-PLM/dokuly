import React, { useState, useEffect } from "react";

import { get_active_customers } from "../customers/funcitons/queries";
import { getActiveProjectByCustomer, fetchProjects } from "../projects/functions/queries";
import { fetchPrefixes, fetchProtectionLevels, fetchOrg } from "../admin/functions/queries";
import { createNewDocument } from "./functions/queries";
import DokulyModal from "../dokuly_components/dokulyModal";

const NewDocumentForm = (props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [active_customers, setActiveCustomers] = useState(null);
  const [selected_customer_id, setSelectedCustomerId] = useState(-1);

  const [projects, setProjects] = useState(null);
  const [selected_project_id, setSelectedProjectId] = useState(-1);

  const [selected_protection_level_id, setSelectedProtectionLevelId] = useState("");
  const [protectionLevels, setProtectionLevels] = useState([]);

  const [selected_prefix_id, setSelectedPrefixId] = useState(-1);
  const [prefixes, setPrefixes] = useState([]);

  const [templatedocuments, setTemplateDocuments] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    fetchPrefixes().then((res) => {
      if (res.status === 200) {
        setPrefixes(res.data);
      }
    });
    fetchProtectionLevels().then((res) => {
      if (res.status === 200) {
        setProtectionLevels(res.data);
        // Set default to first protection level (lowest level)
        if (res.data.length > 0) {
          setSelectedProtectionLevelId(res.data[0].id);
        }
      }
    });
    // Fetch organization settings
    fetchOrg().then((res) => {
      if (res.status === 200) {
        setOrganization(res.data);
      }
    });
  }, []);

  useEffect(() => {
    // Load projects based on customer module setting
    if (organization?.customer_is_enabled === false) {
      // If customer module is disabled, load all active projects
      fetchProjects().then((res) => {
        if (res?.status === 200) {
          setProjects(res.data);
        }
      });
    } else {
      // If customer module is enabled, still load all projects
      fetchProjects().then((res) => {
        if (res?.status === 200) {
          setProjects(res.data);
        }
      });
    }
  }, [organization]);

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
      protection_level: selected_protection_level_id,
      prefix_id: selected_prefix_id,
      template_id: selectedTemplate,
    };

    createNewDocument(data).then((res) => {
      if (res.status === 201) {
        setTitle("");
        setDescription("");
        setSelectedProjectId(-1);
        setSelectedPrefixId(-1);
        setSelectedProtectionLevelId(protectionLevels.length > 0 ? protectionLevels[0].id : "");
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
          <label htmlFor="protection_level">Protection Level *</label>
          <select
            className="form-control"
            name="protection_level"
            value={selected_protection_level_id}
            onChange={(e) => {
              setSelectedProtectionLevelId(e.target.value);
            }}
          >
            <option value="">Choose protection level</option>
            {protectionLevels !== null &&
            protectionLevels !== undefined &&
            protectionLevels.length !== 0 ? (
              protectionLevels.map((level) => {
                return (
                  <option value={level.id} key={level.id}>
                    {level.name}
                  </option>
                );
              })
            ) : (
              <option>No protection levels found!</option>
            )}
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
              selected_prefix_id === -1 || 
              selected_project_id === -1 || 
              selected_protection_level_id === ""
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
