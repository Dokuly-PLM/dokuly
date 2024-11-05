import React, { useState, useEffect, useContext } from "react";

import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";
import { fetchNewestPcbaRevisions } from "./functions/queries";

import { dateFormatter } from "../documents/functions/formatters";
import {
  numberFormatter,
  ThumbnailFormatterComponent,
} from "./functions/formatters";
import { useNavigate } from "react-router";
import { AuthContext } from "../App";
import NewPcbaForm from "./forms/pcbaNewForm";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { releaseStateFormatter } from "../dokuly_components/formatters/releaseStateFormatter";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";

export default function PcbaTable(props) {
  const [refresh, setRefresh] = useState(true);
  const [pcbas, setPcbas] = useState([]);
  const [filtered_items, setFilteredItems] = useState([]);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selected_project_id, setSelectedProjectId] = useState("");
  const [projects, setProjecs] = useState([]);
  const navigate = useNavigate();

  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // Check if there is data in local storage

    const cachedPcbas = localStorage.getItem("pcbas");
    if (cachedPcbas) {
      try {
        setPcbas(JSON.parse(cachedPcbas));
      } catch (e) {
        localStorage.removeItem("pcbas");
      }
    }
    // check local storage for cached customers
    const cachedCustomers = localStorage.getItem("customers");
    if (cachedCustomers) {
      try {
        setCustomers(JSON.parse(cachedCustomers));
      } catch (e) {
        localStorage.removeItem("customers");
      }
    }
    // check local storage for cached projects
    const cachedProjects = localStorage.getItem("projects");
    if (cachedProjects) {
      try {
        setProjecs(JSON.parse(cachedProjects));
      } catch (e) {
        localStorage.removeItem("projects");
      }
    }

    if (pcbas === [] || pcbas == null || props?.refresh === true) {
      fetchNewestPcbaRevisions()
        .then((res) => {
          if (res.status === 200) {
            setPcbas(res.data);
            localStorage.setItem("pcbas", JSON.stringify(res.data));
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
    if (customers === [] || customers == null || props?.refresh === true) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
          localStorage.setItem("customers", JSON.stringify(res.data));
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        });
    }
    if (projects === [] || projects == null || props?.refresh === true) {
      fetchProjects()
        .then((res) => {
          setProjecs(res.data);
          localStorage.setItem("projects", JSON.stringify(res.data));
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

    // Updates tab title
    document.title = "PCBA | Dokuly";
  }, [props.refresh]);

  const [show_inactive_customers, setShowInactiveCustomers] = useState(false);
  const [show_inactive_projects, setShowInactiveProjects] = useState(false);
  const [show_items_in_inactive_projects, setShowItemsInInactiveProjects] =
    useState(false);

  useEffect(() => {
    const tempPcbas = [];

    // Creates a new sorted array
    const sortedPcbas = [...pcbas].sort((a, b) =>
      a.revision < b.revision ? 1 : -1
    );

    // Populate tempPcbas with the latest revision of each PCBA
    sortedPcbas.forEach((pcba) => {
      if (!tempPcbas.some((e) => e.part_number === pcba.part_number)) {
        tempPcbas.push(pcba);
      }
    });

    let filteredPcbas = [...tempPcbas]; // Start with a copy of the sorted array

    // Customer Filter
    if (selected_customer_id) {
      filteredPcbas = filteredPcbas.filter(
        (item) => item?.project?.customer?.id === parseInt(selected_customer_id)
      );
    }

    // Project Filter
    if (selected_project_id) {
      filteredPcbas = filteredPcbas.filter(
        (item) => item?.project?.id === parseInt(selected_project_id)
      );
    }
    setFilteredItems(filteredPcbas);
  }, [
    pcbas,
    selected_customer_id,
    selected_project_id,
    show_items_in_inactive_projects,
  ]);

  function toggle(value) {
    return !value;
  }

  const rowEvents = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/pcbas/${row.id}`);
    } else {
      window.location.href = `/#/pcbas/${row.id}`;
    }
  };
  const columns = [
    {
      key: "full_part_number",
      header: "Part number",
      formatter: numberFormatter,
    },
    {
      key: "pcb_renders",
      header: "",
      formatter: (row) => {
        return <ThumbnailFormatterComponent row={row} />;
      },
    },
    {
      key: "display_name",
      header: "Display name ",
      // formatter: titleFormatter,
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
      key: "project",
      header: "Project",
      formatter: (row) => {
        return row.project ? row.project.title : "";
      },
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
      <NewPcbaForm setRefresh={props?.setRefresh} />
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

        <DokulyTable
          data={filtered_items}
          columns={columns}
          itemsPerPage={100}
          onRowClick={rowEvents}
          defaultSort={{ columnNumber: 6, sorting: "desc" }}
        />
      </div>
    </div>
  );
}
