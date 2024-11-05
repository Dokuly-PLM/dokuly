import React, { useState, useEffect, useContext } from "react";
import {
  getLatestDocumentRevisions,
  //getLatestDocumentRevisionsFirst25,
} from "./functions/queries";
import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";

import {
  mapProjectCustomerToDocs,
  filterOlderRevisions,
} from "./functions/helperFunctions";

import {
  dateFormatter,
  numberFormatter2,
  titleFormatter,
} from "./functions/formatters";

import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";

import NewDocumentForm from "./documentNewForm2";
import { useNavigate } from "react-router";
import { AuthContext } from "../App";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";

export default function DocumentsOverviewTable2() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(true);
  const [unprocessedDocuments, setUnprocessedDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [filtered_documents, setFilteredDocuments] = useState([]);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selected_project_id, setSelectedProjectId] = useState("");
  const [projects, setProjecs] = useState([]);
  const [documentsStatus, setDocumentsStatus] = useState(200);
  const navigate = useNavigate();

  useEffect(() => {
    if (documents === [] || documents == null || refresh === true) {
      refetch_documents();
    }
    if (customers === [] || customers == null || refresh === true) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        });
    }
    if (projects === [] || projects == null || refresh === true) {
      fetchProjects()
        .then((res) => {
          setProjecs(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        });
    }
    setRefresh(false);
    // Updates the tab text
    document.title = "Documents | Dokuly";
  }, [refresh]);

  const [show_inactive_customers, setShowInactiveCustomers] = useState(false);
  const [show_inactive_projects, setShowInactiveProjects] = useState(false);
  const [show_docs_in_inactive_projects, setShowDocumentsInInactiveProjects] =
    useState(false);

  useEffect(() => {
    let temp_docs = documents;

    // Customer Filter.
    if (selected_customer_id !== "") {
      temp_docs = temp_docs.filter((document) => {
        return document?.customer_id === selected_customer_id;
      });
    }

    // Project Filter
    if (selected_project_id !== "" && selected_customer_id !== "") {
      temp_docs = temp_docs.filter((document) => {
        return document?.project === selected_project_id;
      });
    }

    //temp_docs = documents.filter((document) => document.archived === "False");

    // Filter documents in inactive projects.
    if (!show_docs_in_inactive_projects) {
      temp_docs = temp_docs.filter((document) => {
        let documentProject = {};
        projects.map((project) => {
          project.id === document?.project ? (documentProject = project) : "";
        });
        return (
          (document?.project === selected_project_id ||
            selected_project_id === "") &&
          (documentProject.is_active === true ||
            documentProject.is_active == null)
        );
      });
    }

    setFilteredDocuments(temp_docs);
  }, [
    documents,
    selected_customer_id,
    selected_project_id,
    show_docs_in_inactive_projects,
  ]);

  function refetch_documents() {
    getLatestDocumentRevisions()
      .then((res) => {
        if (res.status === 200) {
          setDocumentsStatus(res.status);
          setUnprocessedDocuments(res.data);
        }
      })
      .catch((err) => {
        if (err?.response) {
          if (err?.response?.status === 401) {
            setIsAuthenticated(false);
          }
        }
      });
  }

  useEffect(() => {
    if (
      unprocessedDocuments.length !== 0 &&
      projects.length !== 0 &&
      customers.length !== 0
    ) {
      setDocuments(
        mapProjectCustomerToDocs(unprocessedDocuments, projects, customers)
      );
    }
  }, [unprocessedDocuments, projects, customers]);

  function toggle(value) {
    return !value;
  }

  const rowEvents = {
    onClick: (rowIndex, row) => {
      if (event.ctrlKey || event.metaKey) {
        window.open(`/#/documents/${row.id}`);
      } else {
        window.location.href = `/#/documents/${row.id}`;
      }
    },
  };

  const columns = [
    {
      key: "full_doc_number",
      header: "Document number",
      formatter: numberFormatter2,
    },
    {
      key: "title",
      header: "Title ",
      formatter: titleFormatter,
    },
    {
      key: "tags",
      header: "Tags",
      maxWidth: "140px",
      searchValue: (row) => {
        const tags = row?.tags ?? [];
        return tags?.length > 0 ? tags.map((tag) => tag.name).join(" ") : "";
      },
      formatter: (row) => {
        return <DokulyTags tags={row?.tags ?? []} readOnly={true} />;
      },
      csvFormatter: (row) => (row?.tags ? row.tags : ""),
      defaultShowColumn: true,
    },
    {
      key: "project_name",
      header: "Project",
    },
    {
      key: "release_state",
      header: "State",
      formatter: releaseStateFormatter,
    },
    {
      key: "last_updated",
      header: "Last modified",
      formatter: dateFormatter,
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NewDocumentForm setRefresh={setRefresh} documents={documents} />
      <div className="card rounded p-3">
        <div className="row">
          <div className="input-group p-3">
            <div className="input-group-prepend">
              <label className="input-group-text">Customer:&nbsp;</label>
            </div>
            <select
              className="custom-select flex-grow-1"
              name="selected_customer_id"
              value={selected_customer_id}
              onChange={(e) => {
                setSelectedCustomerId(parseInt(e.target.value));
              }}
            >
              <option value={""}>All</option>
              {customers
                .filter((customer) => {
                  if (!show_inactive_customers) {
                    if (
                      customer?.is_active === "true" ||
                      customer?.is_active === true ||
                      customer?.is_active === null
                    ) {
                      return customer;
                    } else {
                      return "";
                    }
                  } else return customer;
                })
                .sort(function (a, b) {
                  if (a.customer_id < b.customer_id) {
                    return -1;
                  } else {
                    return 1;
                  }
                })
                .map((customer) => {
                  return (
                    <option key={customer.id} value={customer.id}>
                      {customer.customer_id} - {customer.name}
                    </option>
                  );
                })}
            </select>
          </div>
          <div className="form-check mb-3 ml-4">
            <input
              className="dokuly-checkbox"
              name="show_inactive_customers"
              type="checkbox"
              onChange={() => {
                setShowInactiveCustomers(toggle);
              }}
              checked={show_inactive_customers}
            />
            <label className="form-check-label ml-1" htmlFor="flexCheckDefault">
              Show inactive customers
            </label>
          </div>
        </div>
        <div className="row">
          <div className="input-group p-3">
            <div className="input-group-prepend">
              <label className="input-group-text">Project:&nbsp;</label>
            </div>
            <select
              className="custom-select flex-grow-1"
              name="selected_project_id"
              value={selected_project_id}
              onChange={(e) => {
                setSelectedProjectId(parseInt(e.target.value));
              }}
            >
              <option value={""}>All</option>
              {projects
                .filter((project) => {
                  if (!show_inactive_projects) {
                    if (
                      project?.is_active === "true" ||
                      project?.is_active === true ||
                      project?.is_active === null
                    ) {
                      return project;
                    } else {
                      return "";
                    }
                  } else return project;
                })
                .map((project) => {
                  return parseInt(project.customer) ===
                    parseInt(selected_customer_id) ||
                    selected_customer_id === "" ? (
                    <option key={project.id} value={project.id}>
                      {project.full_number} -&nbsp;
                      {project.title}
                    </option>
                  ) : (
                    ""
                  );
                })}
            </select>
          </div>
          <div className="form-check mb-3 ml-4">
            <input
              className="dokuly-checkbox"
              name="show_inactive_projects"
              type="checkbox"
              onChange={() => {
                setShowInactiveProjects(toggle);
              }}
              checked={show_inactive_projects}
            />
            <label className="form-check-label ml-1" htmlFor="flexCheckDefault">
              Show inactive projects
            </label>
          </div>
        </div>
        <div className="row ml-2">
          <div className="form-check mb-3">
            <input
              className="dokuly-checkbox"
              name="show_docs_in_inactive_projects"
              type="checkbox"
              onChange={() => {
                setShowDocumentsInInactiveProjects(toggle);
              }}
              checked={show_docs_in_inactive_projects}
            />
            <label className="form-check-label ml-1" htmlFor="flexCheckDefault">
              Show documents in inactive projects
            </label>
          </div>
        </div>
        {/*redirect ? <Navigate push to={`/documents/${redirectID}`} /> : null*/}
        <div className="m-2">
          {documentsStatus !== 200 ? (
            <div className="m-2">
              <h5>
                {documentsStatus === 204 && "No current documents saved."}
              </h5>
            </div>
          ) : (
            <DokulyTable
              data={filtered_documents}
              columns={columns}
              showCsvDownload={true}
              showPagination={true}
              showSearch={true}
              itemsPerPage={25}
              onRowClick={rowEvents.onClick}
              defaultSort={{ columnNumber: 5, order: "desc" }}
            />
          )}
        </div>{" "}
      </div>
    </div>
  );
}
