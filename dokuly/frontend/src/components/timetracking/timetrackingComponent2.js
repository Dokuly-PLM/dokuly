import React, { useState, useEffect, useContext } from "react";
import AutoRefresh from "../dokuly_components/funcitons/autorefresh";
import TimetrackingForm from "./forms/timetrackingForm2";
import { fetchCustomers } from "../customers/funcitons/queries";
import moment from "moment";
import { fetchProjects } from "../projects/functions/queries";
import {
  getEmployeeTimeRecordsByWeek,
  setEmployeeTimeRecord,
  newCloneRecord,
} from "./funcions/queries";
import { calculateHours } from "./funcions/utilityFunctions";
import { useSpring, animated } from "react-spring";
import { useNavigate } from "react-router";
import { AuthContext } from "../App";
import { toast } from "react-toastify";
import DokulySelect from "../dokuly_components/dokulySelect";
import { Col, Row } from "react-bootstrap";

export default function TimetrackingComponent() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(true);
  const [refreshAfterEntry, setRefreshAfterEntry] = useState(false);

  const [launchForm, setLaunchForm] = useState(0);
  const [time_records, setTimeRecords] = useState([]);
  const [filtered_time_records, setFilteredTimeRecords] = useState([]);

  const [time_record, setTimeRecord] = useState(null);

  const [date, setDate] = useState("");
  const [selected_week, setSelectedWeek] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedYear, setSelectedYear] = useState({
    value: moment().year(),
    label: moment().year(),
  });

  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [billableHoursPerDay, setBillableHoursPerDay] = useState({});

  const currentYear = moment().year();
  const formattedYearDropdownOptions = Array.from({ length: 5 }, (_, i) => {
    return { value: currentYear - i, label: currentYear - i };
  });

  useEffect(() => {
    if (refresh === true) {
      // check local storage for cached customers
      const cachedCustomers = localStorage.getItem("customers");
      if (cachedCustomers) {
        try {
          setCustomers(JSON.parse(cachedCustomers));
        } catch (e) {
          toast.log(e);
          localStorage.removeItem("customers");
        }
      }

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
        })
        .finally(() => {
          setLoadingCustomers(false);
        });

      // check local storage for cached projects
      const cachedProjects = localStorage.getItem("projects");
      if (cachedProjects) {
        try {
          setProjects(JSON.parse(cachedProjects));
        } catch (e) {
          toast.log(e);
          localStorage.removeItem("projects");
        }
      }

      fetchProjects()
        .then((res) => {
          if (res.status === 200) {
            setProjects(res.data);
            localStorage.setItem("projects", JSON.stringify(res.data));
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
          setLoadingProjects(false);
        });

      const current_date = moment();

      setDate(current_date.format("YYYY-MM-DD"));
      setSelectedWeek(current_date.clone().isoWeek());
      setSelectedDay(current_date.clone().isoWeekday());
    }
    if (refreshAfterEntry === true && selected_week) {
      getEmployeeTimeRecordsByWeek(
        selected_week,
        selectedYear?.value ?? currentYear
      )
        .then((res) => {
          if (res.status === 200) {
            setTimeRecords(res.data);
            localStorage.setItem(
              `my_time_records_week_${selected_week}`,
              JSON.stringify(res.data)
            );
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
            setTimeRecords([]);
            toast.error(err.response.data.message);
          }
        });
    }

    setRefresh(false);
    setRefreshAfterEntry(false);

    // Updates tab title
    document.title = "Timesheet | Dokuly";
  }, [refresh, refreshAfterEntry]);

  useEffect(() => {
    if (selectedYear !== "" && selected_week) {
      getEmployeeTimeRecordsByWeek(
        selected_week,
        selectedYear?.value ?? currentYear
      )
        .then((res) => {
          if (res.status === 200) {
            setTimeRecords(res.data);
            localStorage.setItem(
              `my_time_records_week_${selected_week}`,
              JSON.stringify(res.data)
            );
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
            setTimeRecords([]);
            toast.error(err.response.data.message);
          }
        });
    }
  }, [selectedYear]);

  // Function to calculate billable hours for each weekday
  function calculateBillableHours() {
    const billableHours = {};

    for (let i = 1; i <= 7; i++) {
      let billableHoursToday = 0;
      const today = moment().isoWeek(selected_week).isoWeekday(i);

      time_records.forEach((timetrack) => {
        if (moment(timetrack.date).isSame(today, "day")) {
          if (
            timetrack.hour !== "" &&
            parseFloat(timetrack.hour) !== 0 &&
            timetrack.is_billable
          ) {
            billableHoursToday += parseFloat(timetrack.hour);
          }
        }
      });

      billableHours[i] = billableHoursToday.toFixed(1);
    }

    setBillableHoursPerDay(billableHours);
  }

  // Call calculateBillableHours and fetch time records when selected_week changes
  useEffect(() => {
    calculateBillableHours();
  }, [time_records]);

  useEffect(() => {
    if (selected_week !== "") {
      // check local storage for cached time records for the selected week
      const cachedTimeRecords = localStorage.getItem(
        `my_time_records_week_${selected_week}`
      );

      getEmployeeTimeRecordsByWeek(
        selected_week,
        selectedYear?.value ?? currentYear
      ).then((res) => {
        if (res.status === 200) {
          setTimeRecords(res.data);
          localStorage.setItem(
            `my_time_records_week_${selected_week}`,
            JSON.stringify(res.data)
          );
        }
      });
    }
    calculateBillableHours();
  }, [selected_week]);

  useEffect(() => {
    if (time_records !== undefined) {
      const filteredTimetrackings = time_records;

      // Sorting time entries by date and start time
      filteredTimetrackings
        .sort(function (a, b) {
          return (
            new Date(`1970/01/01 ${a.start_time}`) -
            new Date(`1970/01/01 ${b.start_time}`)
          );
        })
        .sort((a, b) => (moment(a.date) > moment(b.date) ? 1 : -1));

      setFilteredTimeRecords(filteredTimetrackings);
    }
  }, [time_records]);

  function renderDayTotalTime(weekday) {
    let hours_today = 0;
    let billableHoursToday = 0;
    let timerIsRunning = false;
    const today = moment()
      .year(selectedYear?.value ?? currentYear)
      .isoWeek(selected_week)
      .isoWeekday(weekday);

    time_records.forEach((timetrack) => {
      if (moment(timetrack.date).isSame(today, "day")) {
        if (timetrack.hour !== "" && parseFloat(timetrack.hour) !== 0) {
          hours_today += parseFloat(timetrack.hour);
          projects.map((project) =>
            parseInt(project.customer) !== 1 &&
            project.id === timetrack.project.id
              ? // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
                (billableHoursToday += parseFloat(timetrack.hour))
              : ""
          );
        } else {
          timerIsRunning = true;
        }
      }
    });
    hours_today = Math.round((hours_today + Number.EPSILON) * 10) / 10;

    return selectedDay === weekday ? (
      // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
      <div
        className="card"
        style={{ cursor: "pointer" }}
        onClick={() => changeDay(weekday)}
      >
        <div className="card-body text-center">
          <div
            className="row-2 flex"
            data-toggle="tooltip"
            data-placement="top"
            title="Day / Month"
          >
            <b>{today.format("D/M")} </b> <br />
          </div>
          <div className="row-2 flex">
            <b>{today.format("dddd")} </b>{" "}
          </div>
          <div className="row-2 flex">
            <div
              className="mt-1"
              data-toggle="tooltip"
              data-placement="top"
              title="Total hours today"
            >
              {hours_today.toFixed(1)} hours
              <br />
              {billableHoursPerDay[weekday] || "0.0"} billable
              <br />
              {timerIsRunning && (
                <div className="badge dokuly-bg-warning">Timer Running</div>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : (
      // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
      <div
        className="card dokuly-bg-light"
        style={{ cursor: "pointer" }}
        onClick={() => changeDay(weekday)}
      >
        <div className="card-body text-center">
          <div
            className="row-2 flex"
            data-toggle="tooltip"
            data-placement="top"
            title="Day / Month"
          >
            <b>{today.format("D/M")} </b>{" "}
          </div>
          <div className="row-2 flex">
            <b>{today.format("dddd")} </b>{" "}
          </div>

          <div className="row-2 flex">
            <div
              className="mt-1"
              data-toggle="tooltip"
              data-placement="top"
              title="Total hours today"
            >
              {hours_today.toFixed(1)} hours
              <br />
              {billableHoursPerDay[weekday] || "0.0"} billable
              <br />
              {timerIsRunning && (
                <div className="badge dokuly-bg-warning">Timer Running</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function weekHours() {
    let hours_current_week = 0;
    if (
      time_records.length !== 0 &&
      time_records != null &&
      time_records !== undefined
    ) {
      time_records.map((timetrack) => {
        if (
          moment(timetrack.date).isoWeek() === selected_week &&
          moment(timetrack.date).isSame(moment(), "year")
        ) {
          if (timetrack.hour !== "") {
            hours_current_week += parseFloat(timetrack.hour);
          }
        }
      });
      hours_current_week =
        Math.round((hours_current_week + Number.EPSILON) * 10) / 10;
    }
    return hours_current_week;
  }

  function edit(timetrack) {
    setTimeRecord(timetrack);
    setLaunchForm(launchForm + 1);
  }

  function changeDay(change) {
    const newDate = moment()
      .year(selectedYear?.value ?? currentYear)
      .isoWeek(selected_week)
      .isoWeekday(change);
    setDate(newDate.format("YYYY-MM-DD"));
    setSelectedDay(change);
  }

  function changeWeek(change) {
    let new_selected_week = selected_week + change;
    let new_year = selectedYear.value;

    // Adjust the year when wrapping week numbers
    if (new_selected_week > moment().year(new_year).weeksInYear()) {
      new_selected_week = 1;
      new_year += 1;
    } else if (new_selected_week < 1) {
      new_selected_week = moment()
        .year(new_year - 1)
        .weeksInYear();
      new_year -= 1;
    }

    setSelectedWeek(new_selected_week);
    setSelectedYear({ value: new_year, label: new_year }); // Update the year
    const newDate = moment()
      .year(new_year)
      .isoWeek(new_selected_week)
      .isoWeekday(selectedDay);
    setDate(newDate.format("YYYY-MM-DD"));
  }

  /**
   * Begins recording time based on a different record.
   * A temporary record is stored in the browser while waiting for the refetch.
   * @param {*} time_record
   */
  function newCloneFrom(time_record) {
    const data = {
      date: moment().format("YYYY-MM-DD"),
      start_time: moment().format("HH:mm"),
    };

    newCloneRecord(time_record.id, data).then((res) => {
      if (res.status === 201) {
        setRefresh(true);

        const time_record_clone = { ...time_record }; // Create a new clone of the time record
        time_record_clone.id = res.data.id; // Use res.data.id instead of res.status.id
        time_record_clone.date = data.date;
        time_record_clone.start_time = data.start_time;
        time_record_clone.stop_time = data.start_time;

        // Check if the time record already exists before adding it
        const isDuplicate = time_records.some(
          (record) => record.id === time_record_clone.id
        );
        if (!isDuplicate) {
          setTimeRecords((time_records) => [
            ...time_records,
            time_record_clone,
          ]);
        }
      }
    });
  }

  /**
  /**
   * Stop a running record (timer).
   * @param {*} time_record
   */
  function stopTimer(time_record) {
    const stopTime = moment().format("HH:mm");
    const hours = calculateHours(time_record.start_time, stopTime);

    const time_record_clone = { ...time_record }; // Create a new clone of the time record
    time_record_clone.stop_time = stopTime; // Update the stop_time property
    time_record_clone.hour = parseFloat(hours); // Update the hour property
    updateTimeRecord(time_record_clone); // Call updateTimeRecord with the updated record

    const data = {
      id: time_record.id,
      stop_time: stopTime,
      hour: parseFloat(hours),
    };

    setEmployeeTimeRecord(data).then((res) => {
      if (res.status === 202) {
        setRefresh(true);
      }
    });
  }

  /**
   * Update a single time record in the current window.
   * Typically used when waiting for refetch.
   */
  function updateTimeRecord(time_record) {
    const new_array = time_records.map((item) => {
      if (item.id === time_record.id) {
        return time_record;
      }
      return item;
    });
    setTimeRecords(new_array);
  }

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  });

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <AutoRefresh setRefresh={setRefresh} />
      <TimetrackingForm
        doLaunchForm={launchForm}
        timeRecord={time_record}
        parentDate={date}
        setRefresh={setRefreshAfterEntry}
        year={selectedYear?.value ?? currentYear}
      />
      <div className="card rounded p-3">
        <div className="row">
          <div className="col">
            <Row>
              <Col lg={4} md={4}>
                <DokulySelect
                  options={formattedYearDropdownOptions}
                  value={selectedYear}
                  onChange={(value) => setSelectedYear(value)}
                />
              </Col>
            </Row>
          </div>
          <div className="col">
            {" "}
            <div className="d-flex justify-content-center">
              <div className="p-2 bd-highlight">
                <button
                  className="btn btn-sm  text-light  m-1 "
                  onClick={() => changeWeek(-1)}
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
              <div className="p-2 bd-highlight">
                <h3>Week: {selected_week}</h3>
              </div>
              <div className="p-2 bd-highlight">
                <button
                  className="btn btn-sm  text-light m-1 "
                  onClick={() => changeWeek(1)}
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
          </div>
          <div className="col" />
        </div>

        <div className="d-flex justify-content-center mt-1 mb-1">
          <ul className="list-group list-group-flush text-center">
            <li className="list-group-item ">
              <b> Hours this week: </b> &nbsp;{weekHours()}
            </li>
          </ul>
        </div>

        <div className="d-flex justify-content-center align-content-center mt-1 mb-1">
          <div className="card-group w-100">
            {/* Render card for total time Monday */}
            {renderDayTotalTime(1)}
            {/* Render card for total time Tuesday */}
            {renderDayTotalTime(2)}
            {/* Render card for total time Wednesday */}
            {renderDayTotalTime(3)}
            {/* Render card for total time Thursday */}
            {renderDayTotalTime(4)}
            {/* Render card for total time Friday */}
            {renderDayTotalTime(5)}
            {/* Render card for total time Saturday */}
            {renderDayTotalTime(6)}
            {/* Render card for total time Sunday */}
            {renderDayTotalTime(7)}
          </div>
        </div>
        <div className="card mt-3 mb-1">
          <div className="table-responsive rounded">
            <table className="table table-hover">
              <thead className="thead">
                <tr>
                  <th width="10%">Date</th>
                  <th width="15%">Project</th>
                  <th width="20%">Customer</th>
                  <th width="10%">Time</th>
                  <th width="10%">Hours</th>
                  <th width="20%">Comments</th>
                  <th width="15%" className="text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered_time_records.map((timetrack) => {
                  {
                    if (
                      moment(timetrack.date).isoWeek() === selected_week &&
                      moment(timetrack.date).isoWeekday() === selectedDay
                    ) {
                      return (
                        <tr key={timetrack.id}>
                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                          <td onClick={() => edit(timetrack)}>
                            {moment(timetrack.date).format("dddd DD.MM.YY")}
                          </td>

                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                          <td onClick={() => edit(timetrack)}>
                            <b>
                              {`${timetrack.project.customer.customer_id}${timetrack.project.project_number} - ${timetrack.project.title}`}
                            </b>
                            <br />
                            {timetrack.task_id.title}
                          </td>

                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                          <td onClick={() => edit(timetrack)}>
                            {timetrack.project.customer.name}
                          </td>
                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                          <td onClick={() => edit(timetrack)}>
                            {timetrack.start_time != null
                              ? timetrack.start_time.substring(0, 5)
                              : ""}{" "}
                            <br />
                            {timetrack.start_time !== timetrack.stop_time &&
                            timetrack.stop_time != null
                              ? timetrack.stop_time.substring(0, 5)
                              : "Running"}
                          </td>

                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                          <td onClick={() => edit(timetrack)}>
                            {parseFloat(timetrack.hour) === 0.0
                              ? ""
                              : timetrack.hour}
                          </td>

                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                          <td onClick={() => edit(timetrack)}>
                            {timetrack.comment}
                          </td>

                          <td className="text-center">
                            {timetrack.start_time !== timetrack.stop_time &&
                            timetrack.stop_time != null ? (
                              <button
                                className="btn btn-sm m-auto"
                                type="button"
                              >
                                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                                <img
                                  // width="15px"
                                  className="icon-tabler-dark"
                                  onClick={() => newCloneFrom(timetrack)}
                                  src="../../static/icons/play.svg"
                                  alt="Play Icon"
                                />
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn m-auto "
                                data-toggle="modal"
                                // data-target="#editTime"
                                type="button"
                              >
                                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                                <img
                                  // width="15px"
                                  className="icon-tabler-dark"
                                  onClick={() => stopTimer(timetrack)}
                                  src="../../static/icons/stop.svg"
                                  alt="Stop Icon"
                                />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
