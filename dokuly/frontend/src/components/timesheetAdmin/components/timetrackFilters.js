import React, { useEffect, useState } from "react";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import moment from "moment";
import { loadCustomer, loadProject } from "../functions/helperFunctions";
import { fetchProjectTasks } from "../functions/queries";
import { Container, Row } from "react-bootstrap";
import { toast } from "react-toastify";

const TimeTrackFilter = ({
  date_from,
  date_to,
  projects,
  customers,
  profiles,
  timetracks,
  filterCustomer,
  filterProject,
  filterTask,
  loading,
  loadingCustomers,
  loadingProfiles,
  loadingProjects,
  loadingTimetrack,
  setSelectedEmployee,
  setFilterCustomer,
  setFilterProject,
  setFilterTask,
  setDateFrom,
  setDateTo,
  user,
  filterBillable,
  setFilterBillable,
  projectTasks,
  setProjectTasks,
  allTasks,
}) => {
  const [showInactiveCustomers, setShowInactiveCustomers] = useState(false);
  const [showInactiveProjects, setShowInactiveProjects] = useState(false);
  const [showInactiveProfiles, setShowInactiveProfiles] = useState(false);
  const [reloadCompnent, setReloadComponent] = useState(false);
  const [tempSelectedCustomer, setTempSelectedCustomer] = useState({});
  const [billable, setBillable] = useState("");

  const projects_copy = [...projects];
  const customers_copy = [...customers];
  const profiles_copy = [...profiles];

  const filterCustomers = () => {
    if (showInactiveCustomers) {
      return customers_copy;
    }
    return customers_copy?.filter((customer) => customer.is_active === true);
  };

  const filterProjects = () => {
    if (showInactiveProjects) {
      return projects_copy;
    }
    return projects_copy?.filter((project) => project.is_active === true);
  };

  const filterProfiles = () => {
    if (showInactiveProfiles) {
      return profiles_copy;
    }
    return profiles_copy?.filter((profile) => profile.is_active === true);
  };

  const filteredCustomers = filterCustomers();
  const filteredProjects = filterProjects();
  const filteredProfiles = filterProfiles();

  const changeMonth = (change) => {
    let from = date_from;
    let to = date_to;
    if (change === 1) {
      from = moment(from).add(1, "month");
      to = moment(to).add(1, "month");
    }
    if (change === -1) {
      from = moment(from).add(-1, "month");
      to = moment(to).add(-1, "month");
    }
    to = to.endOf("month");
    setDateFrom(from);
    setDateTo(to);
  };

  const onChange = (event) => {
    const { name, value } = event.target;

    switch (name) {
      case "filterCustomer":
        setFilterCustomer(value);
        break;
      case "filterProject":
        setFilterProject(value);
        break;
      case "showInactiveCustomers":
        setShowInactiveCustomers(value);
        break;
      case "showInactiveProjects":
        setShowInactiveProjects(value);
        break;
      case "filterEmployee":
        setSelectedEmployee(value);
        break;
      case "showInactiveProfiles":
        setShowInactiveProfiles(value);
        break;
      default:
        break;
    }
  };

  const checkCustomerValue = () => {
    if (tempSelectedCustomer?.id) {
      return tempSelectedCustomer.id;
    }
    return customers_copy.id;
  };

  useEffect(() => {}, [
    date_from,
    date_to,
    projects,
    customers,
    profiles,
    timetracks,
    filterCustomer,
    filterProject,
    filterTask,
    loading,
    loadingCustomers,
    loadingProfiles,
    loadingProjects,
    loadingTimetrack,
    setSelectedEmployee,
    setFilterCustomer,
    setFilterProject,
    setFilterTask,
    setDateFrom,
    setDateTo,
    user,
    filterBillable,
    setFilterBillable,
    projectTasks,
    setProjectTasks,
  ]); // For fetching new props

  useEffect(() => {
    if (reloadCompnent) {
      setReloadComponent(false);
    }
  }, [reloadCompnent]);

  return (
    <div className="row mt-3 m-auto mt-2 mb-21">
      <div className="col mt-3 ">
        <div className="card m-auto">
          <div className="card-body">
            {loading ||
            loadingCustomers ||
            loadingProfiles ||
            loadingProjects ||
            loadingTimetrack ? (
              loadingSpinner()
            ) : (
              <React.Fragment>
                <div className="row d-flex justify-content-center">
                  <div className="p-2 bd-highlight">
                    <button
                      className="btn btn-sm text-light m-1"
                      onClick={() => changeMonth(-1)}
                      type="button"
                    >
                      <img
                        // width="15px"
                        className="icon-tabler-dark"
                        src="../../static/icons/arrow-left.svg"
                        alt="icon"
                      />
                    </button>
                  </div>
                  <div className="mt-2">
                    <h3>{moment(date_from).format("MMMM")}</h3>
                  </div>
                  <div className="p-2 bd-highlight">
                    <button
                      className="btn btn-sm  text-light m-1 "
                      onClick={() => changeMonth(1)}
                      type="button"
                    >
                      <img
                        // width="15px"
                        className="icon-tabler-dark"
                        src="../../static/icons/arrow-right.svg"
                        alt="icon"
                      />
                    </button>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <label
                          className="input-group-text"
                          htmlFor="dateFromFilter"
                        >
                          Date from:
                        </label>
                      </div>
                      <input
                        className="custom-input flex-grow-1"
                        id="dateFromFilter"
                        type="date"
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                        }}
                        name="date_from"
                        value={moment(date_from).format("YYYY-MM-DD")}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <label
                          className="input-group-text"
                          htmlFor="dateToFilter"
                        >
                          Date to:&nbsp; &nbsp;&nbsp;
                        </label>
                      </div>
                      <input
                        className="custom-input flex-grow-1"
                        id="dateToFilter"
                        type="date"
                        onChange={(e) => {
                          setDateTo(e.target.value);
                        }}
                        name="date_to"
                        value={moment(date_to).format("YYYY-MM-DD")}
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <label
                          className="input-group-text"
                          htmlFor="inputGroupSelectCustomerFilter"
                        >
                          Customer:&nbsp;
                        </label>
                      </div>
                      <select
                        className="custom-select flex-grow-1"
                        id="inputGroupSelectCustomerFilter"
                        name="filterCustomer"
                        value={checkCustomerValue()}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            setFilterCustomer("");
                            setTempSelectedCustomer("");
                            setFilterProject("");
                            setProjectTasks([]);
                          } else {
                            setFilterCustomer(parseInt(e.target.value));
                            const tempTasks = [];
                            const projectIds = [];
                            projects.map((project) => {
                              if (
                                parseInt(project.customer) ===
                                parseInt(e.target.value)
                              ) {
                                projectIds.push(project.id);
                              }
                            });
                            allTasks.map((task) => {
                              if (
                                projectIds.includes(parseInt(task.project_id))
                              ) {
                                tempTasks.push(task);
                              }
                            });
                            setProjectTasks(tempTasks);
                          }
                          setReloadComponent(true);
                        }}
                      >
                        <option value="">All</option>
                        {filteredCustomers.map((customer) => {
                          return (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          );
                        })}
                      </select>
                    </div>{" "}
                    <div className="form-check mb-3">
                      <input
                        className="dokuly-checkbox"
                        name="showInactiveCustomers"
                        type="checkbox"
                        onChange={(e) => {
                          onChange({
                            target: {
                              name: e.target.name,
                              value: e.target.checked,
                            },
                          });
                        }}
                        checked={showInactiveCustomers}
                      />
                      <label
                        className="form-check-label ml-1"
                        htmlFor="flexCheckDefault"
                      >
                        Show inactive customers
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <label
                          className="input-group-text"
                          htmlFor="inputGroupSelectCustomerFilter"
                        >
                          Project:&nbsp;
                        </label>
                      </div>
                      <select
                        className="custom-select flex-grow-1"
                        id="inputGroupSelectCustomerFilter"
                        name="filterProject"
                        value={filterProject}
                        onChange={(e) => {
                          if (e.target.value === "") {
                            setFilterProject("");
                            setReloadComponent(true);
                          } else {
                            if (filterCustomer !== "") {
                              setFilterProject(parseInt(e.target.value));
                              const project = loadProject(
                                parseInt(e.target.value),
                                projects_copy
                              );
                              const customer = loadCustomer(
                                parseInt(project.customer),
                                customers_copy
                              );
                              if (
                                !customer.is_active &&
                                !showInactiveCustomers
                              ) {
                                setShowInactiveCustomers(true);
                              }
                              setTempSelectedCustomer(customer);
                              setFilterCustomer(parseInt(customer.id));
                              const projectTasks = [];
                              allTasks.map((task) => {
                                if (
                                  parseInt(task?.project_id) ===
                                  parseInt(project?.id)
                                ) {
                                  projectTasks.push(task);
                                }
                              });
                              setProjectTasks(projectTasks);
                              setReloadComponent(true);
                            }
                          }
                        }}
                      >
                        <option value="">All</option>
                        {filterCustomer !== ""
                          ? filteredProjects.map((project) => {
                              return parseInt(project.customer) ===
                                parseInt(filterCustomer) ||
                                filterCustomer === "" ? (
                                <option key={project.id} value={project.id}>
                                  {project?.project_number} -&nbsp;
                                  {project?.title ?? "--"}
                                </option>
                              ) : (
                                ""
                              );
                            })
                          : filteredProjects.map((project) => {
                              return (
                                <option key={project.id} value={project.id}>
                                  {project?.project_number} -&nbsp;
                                  {project?.title ?? "--"}
                                </option>
                              );
                            })}
                      </select>
                    </div>

                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        name="showInactiveProjects"
                        type="checkbox"
                        onChange={(e) => {
                          onChange({
                            target: {
                              name: e.target.name,
                              value: e.target.checked,
                            },
                          });
                        }}
                        checked={showInactiveProjects}
                      />
                      <label
                        className="form-check-label ml-1"
                        htmlFor="flexCheckDefault"
                      >
                        Show inactive projects
                      </label>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <label
                          className="input-group-text	"
                          htmlFor="inputGroupSelectCustomerFilter"
                        >
                          Employee:&nbsp;
                        </label>
                      </div>
                      {user.role === "Admin" || user.role === "Owner" ? (
                        <select
                          className="custom-select flex-grow-1"
                          id="inputGroupSelectCustomerFilter"
                          name="filterEmployee"
                          value={filteredProfiles.user}
                          onChange={onChange}
                        >
                          <option value="">All</option>
                          {filteredProfiles.map((employee) => {
                            return (
                              <option key={employee.user} value={employee.user}>
                                {employee.first_name} {employee.last_name}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <select
                          className="custom-select flex-grow-1"
                          value={user.user}
                          disabled={true}
                        >
                          <option>
                            {user.first_name} {user.last_name}
                          </option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <label
                          className="input-group-text	"
                          htmlFor="inputGroupSelectCustomerFilter"
                        >
                          Task:&nbsp;
                        </label>
                      </div>
                      {projectTasks && filterProject ? (
                        <select
                          className="custom-select flex-grow-1"
                          id="inputGroupSelectCustomerFilter"
                          name="filterTasks"
                          value={projectTasks.id}
                          onChange={(e) => {
                            if (e.target.value === "") {
                              setFilterTask("");
                            } else {
                              setFilterTask(parseInt(e.target.value));
                            }
                            setReloadComponent(true);
                          }}
                        >
                          <option value="">All</option>
                          {projectTasks.map((task) => {
                            return (
                              <option key={task.id} value={task.id}>
                                {task?.title ?? "--"}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <select
                          className="custom-select flex-grow-1"
                          id="inputGroupSelectCustomerFilter"
                          name="filterTasks"
                          value={"select"}
                          disabled={true}
                          onChange={(e) => {
                            if (e.target.value !== "select") {
                            }
                          }}
                        >
                          <option value="select">Select a project</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div className="form-check mb-3">
                      <input
                        className="dokuly-checkbox"
                        name="showInactiveProfiles"
                        type="checkbox"
                        onChange={(e) => {
                          onChange({
                            target: {
                              name: e.target.name,
                              value: e.target.checked,
                            },
                          });
                        }}
                        checked={showInactiveProfiles}
                      />
                      <label
                        className="form-check-label ml-1"
                        htmlFor="flexCheckDefault"
                      >
                        Show inactive employees
                      </label>
                    </div>
                  </div>
                  <div className="col-6 col-sm-6 col-md-6 col-lg-6 col-xl-6">
                    <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <label
                          className="input-group-text"
                          htmlFor="inputGroupSelectCustomerFilter"
                        >
                          Billable:&nbsp;
                        </label>
                      </div>
                      <select
                        className="custom-select flex-grow-1"
                        id="inputGroupSelectCustomerFilter"
                        name="billable"
                        value={billable}
                        onChange={(e) => {
                          if (filterProject === "" && allTasks.length !== 0) {
                            setBillable(e.target.value);
                            if (e.target.value === "billable") {
                              let billableTasks = [];
                              if (allTasks.length === 1) {
                                if (allTasks[0].is_billable) {
                                  billableTasks.push(allTasks[0].id);
                                } else {
                                  billableTasks = [-1]; // No billable tasks in taskList
                                  // Cannot use empty array here, as we need filter and not null. No ids are -1.
                                }
                              } else {
                                allTasks.map((task) => {
                                  if (task.is_billable) {
                                    billableTasks.push(task.id);
                                  }
                                });
                              }
                              setFilterBillable(billableTasks);
                            } else if (e.target.value === "nonBillable") {
                              const nonBillableTasks = [];
                              allTasks.map((task) => {
                                if (!task.is_billable) {
                                  nonBillableTasks.push(task.id);
                                }
                              });
                              setFilterBillable(nonBillableTasks);
                            } else {
                              setFilterBillable(null);
                            }
                            return;
                          }
                          if (!projectTasks || projectTasks?.length === 0) {
                            toast.info(
                              "No project selected. Select a project to change billable filter"
                            );
                            setFilterBillable(null);
                          } else {
                            setBillable(e.target.value);
                            if (e.target.value === "") {
                              setFilterBillable(null);
                            } else if (e.target.value === "billable") {
                              let billableTasks = [];
                              if (projectTasks.length === 1) {
                                if (projectTasks[0].is_billable) {
                                  billableTasks.push(projectTasks[0].id);
                                } else {
                                  billableTasks = [-1]; // No billable tasks in taskList
                                  // Cannot use empty array here, as we need filter and not null. No ids are -1.
                                }
                              } else {
                                projectTasks.map((task) => {
                                  if (task.is_billable) {
                                    billableTasks.push(task.id);
                                  }
                                });
                              }
                              setFilterBillable(billableTasks);
                            } else {
                              const nonBillableTasks = [];
                              projectTasks.map((task) => {
                                if (!task.is_billable) {
                                  nonBillableTasks.push(task.id);
                                }
                              });
                              setFilterBillable(nonBillableTasks);
                            }
                          }
                        }}
                      >
                        <option value="">All</option>
                        <option value={"billable"}>Billable only</option>
                        <option value={"nonBillable"}>Non-billable only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackFilter;
