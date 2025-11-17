import React, { useState, useEffect, useContext } from "react";

import { fetchProjects } from "./functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";

import NewProjectForm from "./forms/newProjectForm";
import { useNavigate } from "react-router";
import { AuthContext } from "../App";
import DokulyDateFormat from "../dokuly_components/formatters/dateFormatter";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { Col, Row } from "react-bootstrap";

export default function ProjectsTable() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(true);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [projects, setProjecs] = useState([]);
  const [filtered_projects, setFilteredProjects] = useState([]);
  const [organization, setOrganization] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch organization settings
    const storedOrg = localStorage.getItem("organization");
    if (storedOrg) {
      try {
        setOrganization(JSON.parse(storedOrg));
      } catch (e) {
        localStorage.removeItem("organization");
      }
    }
  }, []);

  useEffect(() => {
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

    if (customers === [] || customers == null || refresh === true) {
      fetchCustomers()
        .then((res) => {
          if (res.status === 200) {
            setCustomers(res.data);
            localStorage.setItem("customers", JSON.stringify(res.data));
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

    if (projects === [] || projects == null || refresh === true) {
      fetchProjects()
        .then((res) => {
          if (res.status === 200) {
            setProjecs(res.data);
            localStorage.setItem("projects", JSON.stringify(res.data));
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
    setRefresh(false);

    // Updates tab title
    document.title = "Projects | Dokuly";
  }, [refresh]);

  const [show_inactive_customers, setShowInactiveCustomers] = useState(false);
  const [show_inactive_projects, setShowInactiveProjects] = useState(false);

  useEffect(() => {
    let temp_proj = projects;
    // Customer Filter.
    if (selected_customer_id !== "") {
      temp_proj = projects.filter((project) => {
        return project.customer === parseInt(selected_customer_id);
      });
    }

    let tempArr = [];
    if (!show_inactive_projects) {
      temp_proj.map((project) => {
        if (
          project?.is_active === true ||
          project?.is_active === "true" ||
          project?.is_active === null
        ) {
          tempArr.push(project);
        }
      });
    } else {
      tempArr = temp_proj;
    }

    setFilteredProjects(tempArr);
  }, [projects, selected_customer_id, show_inactive_projects]);

  function toggle(value) {
    return !value;
  }

  /**
   * Interpret boolean value as Yes/No in the table.
   */
  function formatIsActiveYesNo(row) {
    const is_active =
      row.is_active === "true" ||
      row.is_active === true ||
      row.is_active === null;

    return (
      <Row className="justify-content-start">
        <Col className="col-10 offset-1">
          <input
            type="checkbox"
            className="dokuly-checkbox"
            checked={is_active}
          />
        </Col>
      </Row>
    );
  }

  const rowEvents = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/projects/${row.id}`);
    } else {
      window.location.href = `/#/projects/${row.id}`;
    }
  };

  function dateFormatter(row) {
    return <DokulyDateFormat date={row.last_updated} />;
  }

  const columns = [
    {
      key: "full_number",
      header: "Project number",
    },
    {
      key: "title",
      header: "Project name",
    },
    ...(organization?.customer_is_enabled !== false ? [{
      key: "customer_name",
      header: "Customer",
    }] : []),
    {
      key: "is_active",
      header: "Active",

      formatter: formatIsActiveYesNo,
    },
    {
      key: "last_updated",
      header: "Last modified",
      formatter: dateFormatter,
    },
  ];

  const defaultSorted = [
    {
      dataField: "full_number", // if dataField is not match to any column you defined, it will be ignored.
      order: "desc", // desc or asc
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NewProjectForm setRefresh={setRefresh} />
      <div className="card rounded p-3">
        <div className="row">
          {organization?.customer_is_enabled !== false && (
            <>
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
                      if (show_inactive_customers !== true) {
                        if (
                          customer?.is_active === true ||
                          customer?.is_active === null
                        ) {
                          return customer;
                        } else {
                          return "";
                        }
                      } else {
                        return customer;
                      }
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
            </>
          )}

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
          data={filtered_projects}
          columns={columns}
          defaultSorted={defaultSorted}
          onRowClick={rowEvents}
        />
      </div>
    </div>
  );
}
