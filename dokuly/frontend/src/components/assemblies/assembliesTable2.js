import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";
import { getAssembliesLatestRevisions } from "./functions/queries";
import { mapProjectCustomerItems } from "../pcbas/functions/helperFuncitons";

import { dateFormatter } from "../documents/functions/formatters";
import { numberFormatter, thumbnailFormatter } from "./functions/formatters";
import NewAssemblyForm from "./forms/assemblyNewForm";
import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";

export default function AssembliesTable(props) {
  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(true);
  const [assemblies, setAssemblies] = useState([]);
  const [unProcessedAssemblies, setUnProcessedAssemblies] = useState([]);

  const [filtered_items, setFilteredItems] = useState([]);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selected_project_id, setSelectedProjectId] = useState("");
  const [projects, setProjecs] = useState([]);

  useEffect(() => {
    if (
      unProcessedAssemblies?.lenght === 0 ||
      unProcessedAssemblies == null ||
      refresh === true
    ) {
      getAssembliesLatestRevisions()
        .then((res) => {
          if (res.status === 200) {
            setUnProcessedAssemblies(res.data);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("token_created");
            }
          }
        });
    }
    if (customers?.length === 0 || customers == null || refresh === true) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("token_created");
            }
          }
        });
    }
    if (projects?.length === 0 || projects == null || refresh === true) {
      fetchProjects()
        .then((res) => {
          setProjecs(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("token_created");
            }
          }
        });
    }
    setRefresh(false);

    // Updates tab title
    document.title = "Assemblies | Dokuly";
  }, [refresh]);

  useEffect(() => {
    if (props?.refresh === true) {
      setRefresh(true);
    }
  }, [props.refresh]);

  useEffect(() => {
    if (
      unProcessedAssemblies.length !== 0 &&
      projects.length !== 0 &&
      customers.length !== 0
    ) {
      setAssemblies(
        mapProjectCustomerItems(unProcessedAssemblies, projects, customers)
      );
    }
  }, [unProcessedAssemblies, customers, projects]);

  const [show_inactive_customers, setShowInactiveCustomers] = useState(false);
  const [show_inactive_projects, setShowInactiveProjects] = useState(false);

  useEffect(() => {
    let temp_assemblies = assemblies;

    // Customer Filter.
    if (selected_customer_id !== "") {
      temp_assemblies = temp_assemblies.filter((item) => {
        return item.customer_id === parseInt(selected_customer_id);
      });
    }

    // Project Filter.
    if (selected_project_id !== "" && selected_customer_id !== "") {
      temp_assemblies = temp_assemblies.filter((item) => {
        return item.project === parseInt(selected_project_id);
      });
    }
    setFilteredItems(temp_assemblies);
  }, [assemblies, selected_customer_id, selected_project_id]);

  function toggle(value) {
    return !value;
  }

  const handleRowClick = (row) => {
    const selectedItem = filtered_items[row];
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/assemblies/${selectedItem.id}`);
    } else {
      navigate(`/assemblies/${selectedItem.id}`);
    }
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part number",
      formatter: numberFormatter,
    },
    {
      key: "thumbnail",
      header: "",
      includeInCsv: false,
      formatter: thumbnailFormatter,
    },
    {
      key: "display_name",
      header: "Display name",
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
      <NewAssemblyForm setRefresh={props?.setRefresh} />
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
                setSelectedCustomerId(e.target.value);
              }}
            >
              <option value={""}>All</option>
              {customers
                .filter((customer) => {
                  if (!show_inactive_customers) {
                    if (
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
                setSelectedProjectId(e.target.value);
              }}
            >
              <option value={""}>All</option>
              {projects
                .filter((project) => {
                  if (!show_inactive_projects) {
                    if (
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
                  return parseInt(project.customer_id) ===
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
            <label
              className="form-check-label  ml-1"
              htmlFor="flexCheckDefault"
            >
              Show inactive projects
            </label>
          </div>
        </div>

        <div>
          <DokulyTable
            data={filtered_items}
            columns={columns}
            itemsPerPage={100}
            onRowClick={handleRowClick}
            defaultSort={{ columnNumber: 6, order: "desc" }}
          />
        </div>
      </div>
    </div>
  );
}
