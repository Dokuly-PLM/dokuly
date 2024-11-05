import React, { Fragment, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import moment from "moment";

import { loadingSpinner } from "../admin/functions/helperFunctions";
import {
  fetchCustomers,
  fetchProjects,
  fetchUserProfile,
  fetchUsers,
} from "../admin/functions/queries";

import { fetchAllTasks, fetchTimetrackings } from "./functions/queries";
import TimeTrackFilter from "./components/timetrackFilters";
import TimetrackAdminTable from "./components/timetrackTable";
import TimeReport from "./components/timeReportv2";
import { mathRound } from "./timesheetReport";
import { AuthContext } from "../App";
import StackedTimeChart from "./components/stackedTimeChart";
import StackedAggregatedTimeChart from "./components/stackedAggregatedTimeChart";

export default function TimesheetAdminDashboard() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [date_from, setDateFrom] = useState(() => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay;
  });
  const [date_to, setDateTo] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today;
  });
  const [user, setUser] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timetracks, setTimetracks] = useState(null);
  const [loadingTimetrack, setLoadingTimetrack] = useState(true);
  const [projects, setProjects] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [customers, setCustomers] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [profiles, setProfiles] = useState(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [include_comments, setIncludeComments] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterTask, setFilterTask] = useState("");
  const [filterBillable, setFilterBillable] = useState([]);
  const [allTasks, setAllTasks] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [projectTasks, setProjectTasks] = useState(null);
  const [filteredTimetracks, setFilteredTimetracks] = useState([]);
  const [isAggregatedGraphShown, setisAggregatedGraphShown] = useState(true);
  const navigate = useNavigate();

  const mergeTimetracks = (timetracks, commentCheck, selectedEmployee) => {
    const merged = {};

    timetracks.forEach((timetrack) => {
      let key = `${timetrack.date}-${timetrack.task_id}`;
      if (commentCheck) key += `-${timetrack.comment}`;

      if (merged[key]) {
        merged[key].hour += mathRound(timetrack.hour, 2);
        if (!merged[key].multiple_users.includes(timetrack.user)) {
          merged[key].multiple_users.push(timetrack.user);
        }
      } else {
        merged[key] = {
          ...timetrack,
          hour: mathRound(timetrack.hour, 2),
          multiple_users: [timetrack.user],
        };
      }
    });

    return Object.values(merged);
  };

  const filterTimetracks = (fetchedTimetracks) => {
    let filtered = fetchedTimetracks.filter(
      (timetrack) =>
        moment(timetrack.date).isSameOrAfter(date_from) &&
        moment(timetrack.date).isSameOrBefore(date_to)
    );
    if (filterCustomer) {
      const project_ids = filtered.flatMap((timetrack) => timetrack["project"]);
      const filteredProjects = projects.filter((project) =>
        project_ids.includes(project.id)
      );
      const projectCustomerFiltered = filteredProjects
        .filter(
          (project) => parseInt(project?.customer) === parseInt(filterCustomer)
        )
        .map((project) => project.id); // Need only ids
      filtered = filtered.filter((timetrack) => {
        return projectCustomerFiltered.includes(parseInt(timetrack.project));
      });
    }
    if (filterProject) {
      filtered = filtered.filter(
        (timetrack) => parseInt(timetrack.project) === parseInt(filterProject)
      );
    }
    if (filterTask) {
      filtered = filtered.filter(
        (timetrack) => parseInt(timetrack.task_id) === parseInt(filterTask)
      );
    }
    if (selectedEmployee) {
      filtered = filtered.filter(
        (timetrack) => parseInt(timetrack.user) === parseInt(selectedEmployee)
      );
    }
    if (filterBillable && filterBillable?.length > 0) {
      filtered = filtered.filter((timetrack) =>
        filterBillable.includes(timetrack.task_id)
      );
    }
    if (!include_comments) {
      filtered = mergeTimetracks(filtered, false, selectedEmployee);
    } else {
      filtered = mergeTimetracks(filtered, true, selectedEmployee);
    }
    return filtered;
  };

  useEffect(() => {
    if (timetracks == null || refresh) {
      fetchTimetrackings(date_from.getFullYear(), date_to.getFullYear())
        .then((res) => {
          if (res.status === 200) {
            fetchAllTasks()
              .then((resTasks) => {
                if (resTasks.status === 200) {
                  setAllTasks(resTasks.data);
                  const timetrackCopy = res.data;
                  timetrackCopy.map((timetrack) => {
                    if (timetrack?.task === "" && timetrack?.task_id) {
                      const task = resTasks.data?.find(
                        (task) => task.id === timetrack?.task_id
                      );
                      timetrack.task = task?.title;
                    }
                  });
                  setTimetracks(timetrackCopy);
                } else {
                  setAllTasks([]);
                }
              })
              .catch((errTasks) => {
                if (errTasks?.response) {
                  if (errTasks?.response?.status === 401) {
                    setIsAuthenticated(false);
                  }
                }
                if (errTasks) {
                  setAllTasks([]);
                }
              })
              .finally(() => {
                setLoadingTasks(false);
              });
          } else {
            setTimetracks([]);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
          if (err) {
            setTimetracks([]);
          }
        })
        .finally(() => {
          setLoadingTimetrack(false);
        });
    }
    if (user == null || refresh) {
      fetchUserProfile()
        .then((res) => {
          setUser(res?.data);
          if (res?.data.role !== "Owner" && res?.data.role !== "Admin") {
            setSelectedEmployee(res.data.user);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
    if (profiles == null || refresh) {
      fetchUsers()
        .then((res) => {
          if (res.status === 200) {
            setProfiles(res.data);
          } else {
            setProfiles([]);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
          if (err) {
            setProfiles([]);
          }
        })
        .finally(() => {
          setLoadingProfiles(false);
        });
    }
    if (customers == null || refresh) {
      fetchCustomers()
        .then((res) => {
          if (res.status === 200) {
            setCustomers(res.data);
          } else {
            setCustomers([]);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
          if (err) {
            setCustomers([]);
          }
        })
        .finally(() => {
          setLoadingCustomers(false);
        });
    }
    if (projects == null || refresh) {
      fetchProjects()
        .then((res) => {
          if (res.status === 200) {
            setProjects(res.data);
          } else {
            setProjects([]);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
          if (err) {
            setProjects([]);
          }
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
    setRefresh(false);
    document.title = "Time Report | Dokuly";
  }, [refresh]);

  useEffect(() => {
    if (date_from && date_to && allTasks) {
      fetchTimetrackings(
        new Date(date_from).getFullYear(),
        new Date(date_to).getFullYear()
      )
        .then((res) => {
          if (res.status === 200) {
            const timetrackCopy = res.data.map((timetrack) => {
              if (timetrack?.task === "" && timetrack?.task_id) {
                const task = allTasks.find(
                  (task) => task.id === timetrack.task_id
                );
                timetrack.task = task ? task?.title : "Task not found"; // Safe fallback
              }
              return timetrack;
            });
            setTimetracks(timetrackCopy);
          } else {
            setTimetracks([]);
          }
        })
        .catch((err) => {
          toast.error("Error fetching timetracks: ", err);
          setTimetracks([]);
        });
    }
  }, [date_from, date_to, allTasks]);

  useEffect(() => {
    if (
      !loading &&
      !loadingTimetrack &&
      !loadingProfiles &&
      !loadingProjects &&
      !loadingCustomers &&
      !loadingTasks
    ) {
      const safeArray = Array.isArray(timetracks) ? timetracks : [];
      const fetchedTimetracks = [...safeArray];
      setFilteredTimetracks(filterTimetracks(fetchedTimetracks));
    }
  }, [
    loading,
    loadingTimetrack,
    loadingProfiles,
    loadingProjects,
    loadingCustomers,
    loadingTasks,
    timetracks,
    filterCustomer,
    filterProject,
    filterTask,
    filterBillable,
    selectedEmployee,
    include_comments,
  ]);

  if (
    loading ||
    loadingTimetrack ||
    loadingProfiles ||
    loadingProjects ||
    loadingCustomers ||
    loadingTasks
  ) {
    return loadingSpinner();
  }

  return (
    <Fragment>
      <div className="row justify-content-center">
        {/* <h2>Time Report</h2> */}
      </div>
      <div className="row justify-content-center m-2 w-100">
        <div
          className="container-fluid mt-2 mainContainerWidth"
          style={{ paddingBottom: "1rem" }}
        >
          <TimeTrackFilter
            date_from={date_from}
            date_to={date_to}
            projects={projects}
            customers={customers}
            profiles={profiles}
            filterCustomer={filterCustomer}
            filterProject={filterProject}
            filterTask={filterTask}
            loading={loading}
            loadingCustomers={loadingCustomers}
            loadingProfiles={loadingProfiles}
            loadingProjects={loadingProjects}
            loadingTimetrack={loadingTimetrack}
            setSelectedEmployee={setSelectedEmployee}
            setFilterCustomer={setFilterCustomer}
            setFilterProject={setFilterProject}
            setFilterTask={setFilterTask}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
            user={user}
            filterBillable={filterBillable}
            setFilterBillable={setFilterBillable}
            projectTasks={projectTasks}
            setProjectTasks={setProjectTasks}
            allTasks={allTasks}
          />
          <TimeReport
            filterEmployee={selectedEmployee}
            include_comments={include_comments}
            date_from={date_from}
            date_to={date_to}
            projects={projects}
            customers={customers}
            profiles={profiles}
            timetracks={filteredTimetracks}
            filterCustomer={filterCustomer}
            filterProject={filterProject}
            loadingCustomers={loadingCustomers}
            loadingProfiles={loadingProfiles}
            loadingProjects={loadingProjects}
            loadingTimetrack={loadingTimetrack}
            setIncludeComments={setIncludeComments}
            projectTasks={projectTasks}
          />

          <div className="form-check form-switch">
            <input
              className="dokuly-checkbox"
              type="checkbox"
              role="switch"
              id="flexSwitchCheckDefault"
              checked={isAggregatedGraphShown}
              onClick={() => {
                setisAggregatedGraphShown(!isAggregatedGraphShown);
              }}
            />
            <label
              className="form-check-label ml-1"
              htmlFor="flexSwitchCheckDefault"
            >
              {" "}
              {isAggregatedGraphShown
                ? "Showing aggregated graph"
                : "Showing per day graph"}
            </label>
          </div>

          {isAggregatedGraphShown ? (
            <StackedAggregatedTimeChart
              projects={projects}
              customers={customers}
              profiles={profiles}
              timetracks={filteredTimetracks}
              loadingCustomers={loadingCustomers}
              loadingProfiles={loadingProfiles}
              loadingProjects={loadingProjects}
              loadingTimetrack={loadingTimetrack}
            />
          ) : (
            <StackedTimeChart
              projects={projects}
              customers={customers}
              profiles={profiles}
              timetracks={filteredTimetracks}
              loadingCustomers={loadingCustomers}
              loadingProfiles={loadingProfiles}
              loadingProjects={loadingProjects}
              loadingTimetrack={loadingTimetrack}
            />
          )}

          <TimetrackAdminTable
            projects={projects}
            customers={customers}
            profiles={profiles}
            timetracks={filteredTimetracks}
            loadingCustomers={loadingCustomers}
            loadingProfiles={loadingProfiles}
            loadingProjects={loadingProjects}
            loadingTimetrack={loadingTimetrack}
            allTasks={allTasks}
          />
        </div>
      </div>
    </Fragment>
  );
}
