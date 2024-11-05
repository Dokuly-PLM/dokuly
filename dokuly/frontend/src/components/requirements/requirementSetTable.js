import React, { useState, useEffect, useContext } from "react";

import { dateFormatter } from "../documents/functions/formatters";

import { useNavigate } from "react-router";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import useRequirementSets from "../common/hooks/useRequirementSets";
import useCustomers from "../common/hooks/useCustomers";
import useProjects from "../common/hooks/useProjects";
import useProfile from "../common/hooks/useProfile";
import NewRequirementSetForm from "./forms/newRequirementSetForm";

const RequirementSetTable = () => {
  const [filtered_items, setFilteredItems] = useState([]);
  const [selected_customer_id, setSelectedCustomerId] = useState("");
  const [selected_project_id, setSelectedProjectId] = useState("");
  const navigate = useNavigate();

  const [customers, refreshCustomers] = useCustomers();
  const [projects, refreshProjects] = useProjects();
  const [profile, refreshProfile] = useProfile();
  const [requirementSets, refreshRequirementSets] = useRequirementSets();

  const [show_inactive_customers, setShowInactiveCustomers] = useState(false);
  const [show_inactive_projects, setShowInactiveProjects] = useState(false);
  const [show_items_in_inactive_projects, setShowItemsInInactiveProjects] =
    useState(false);

  useEffect(() => {
    // map projects to requirementSets
    // biome-ignore lint/complexity/noForEach: <explanation>
    requirementSets.forEach((requirementSet) => {
      requirementSet.project = projects.find(
        (project) => project.id === requirementSet.project,
      );
    });

    let filteredItems = [...requirementSets]; // Start with a copy of the sorted array

    // Customer Filter
    if (selected_customer_id) {
      filteredItems = filteredItems.filter(
        (item) =>
          item?.project?.customer?.id === Number.parseInt(selected_customer_id),
      );
    }

    // Project Filter
    if (selected_project_id) {
      filteredItems = filteredItems.filter(
        (item) => item?.project?.id === Number.parseInt(selected_project_id),
      );
    }
    setFilteredItems(filteredItems);
  }, [
    requirementSets,
    selected_customer_id,
    selected_project_id,
    show_items_in_inactive_projects,
  ]);

  function toggle(value) {
    return !value;
  }

  const rowEvents = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/requirements/set/${row.id}`);
    } else {
      window.location.href = `/#/requirements/set/${row.id}`;
    }
  };
  const columns = [
    {
      key: "display_name",
      header: "Display name ",
      formatter: (row) => {
        return row.display_name ? row.display_name : "";
      },
    },
    {
      key: "project",
      header: "Project",
      formatter: (row) => {
        return row.project ? row.project.title : "";
      },
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
      <NewRequirementSetForm setRefresh={refreshRequirementSets} />
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
                  if (!profile?.allowed_apps.includes("customers")) {
                    return "";
                  }
                  if (!show_inactive_customers) {
                    if (
                      customer?.is_active === true ||
                      customer?.is_active === null
                    ) {
                      return customer;
                    }
                    return "";
                  }
                  return customer;
                })
                .sort((a, b) => {
                  if (a.customer_id < b.customer_id) {
                    return -1;
                  }
                  return 1;
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
                    }
                    return "";
                  }
                  return project;
                })
                .map((project) => {
                  return Number.parseInt(project.customer) ===
                    Number.parseInt(selected_customer_id) ||
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
          itemsPerPage={25}
          onRowClick={rowEvents}
          defaultSort={{ columnNumber: 2, order: "desc" }}
        />
      </div>
    </div>
  );
};

export default RequirementSetTable;
