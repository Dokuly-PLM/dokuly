import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { get_active_customers } from "../../customers/funcitons/queries";
import {
  getActiveProjectByCustomer,
  getTaskAssignees,
} from "../../projects/functions/queries";
import { getActiveProjectTasks } from "../../projects/functions/queries";
import { calculateHours } from "../funcions/utilityFunctions";
import {
  getTimeRecord,
  setEmployeeTimeRecord,
  deleteTimeRecord,
  fetchLastTimetracking,
} from "../funcions/queries";
import SubmitButton from "../../dokuly_components/submitButton";
import DeleteButton from "../../dokuly_components/deleteButton";
import { Col, Row } from "react-bootstrap";
import {
  addChildrenArrayToTasks,
  buildTreeStructure,
  findLeafNodes,
} from "../../dokuly_components/dokulyTable/functions/mappingUtils";
import DokulySelect from "../../dokuly_components/dokulySelect";
import TaskOption from "./taskOption";
import { generateRandomColorWithContrast } from "../../dokuly_components/dokulyTags/dokulyTags";

/**
 * Throttle a function so that it can be called at most once every `delay` milliseconds.
 *
 * @param {Function} callback - The function to be throttled.
 * @param {number} delay - The time, in milliseconds, to wait before allowing the function to be called again.
 * @return {Function} - A new function that, when called, will execute `callback` in a throttled manner.
 */
export function throttle(callback, delay) {
  let isThrottlingActive = false; // Indicates whether throttling is currently active
  let lastArgs = null; // Stores the latest arguments passed to the throttled function

  // Function to handle the execution of the callback with stored arguments
  function executeWithStoredArgs() {
    // If there are no stored arguments, set throttling to inactive
    if (lastArgs === null) {
      isThrottlingActive = false;
    } else {
      // Execute the callback with the stored arguments
      callback(...lastArgs);

      // Reset stored arguments
      lastArgs = null;

      // Schedule the next execution
      setTimeout(executeWithStoredArgs, delay);
    }
  }

  // The throttled function
  return (...args) => {
    // If throttling is active, store the latest arguments
    if (isThrottlingActive) {
      lastArgs = args;
      return;
    }

    // Execute the callback immediately if throttling is not active
    callback(...args);

    // Activate throttling
    isThrottlingActive = true;

    // Schedule the next allowed execution
    setTimeout(executeWithStoredArgs, delay);
  };
}

/**
 * # Button with form to create a new assembly.
 */
const TimeTrackingForm = ({
  doLaunchForm,
  timeRecord,
  timeRecordId,
  parentDate,
  setRefresh,
}) => {
  const [comments, setComments] = useState("");

  const [active_customers, setActiveCustomers] = useState(null);
  const [selected_customer_id, setSelectedCustomerId] = useState(-1);

  const [projects, setProjects] = useState(null);
  const [selected_project_id, setSelectedProjectId] = useState(-1);

  const [tasks, setTasks] = useState([]);
  const [selected_task_id, setSelectedTaskId] = useState(-1);
  // selected_task_name is included for legacy support.
  const [selected_task_name, setSelectedTaskName] = useState("");

  const [start_time, setStartTime] = useState("");
  const [stop_time, setStopTime] = useState("");

  const [is_not_today, setIsNotToday] = useState(false);

  const [time_record_id, setTimeRecordId] = useState(
    timeRecord?.id === undefined || timeRecord?.id === -1 ? -1 : timeRecord.id
  );

  const [date, setDate] = useState(
    parentDate === undefined || parentDate === ""
      ? moment().format("YYYY-MM-DD")
      : parentDate
  );

  const [customerOptions, setCustomerOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const headerRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Throttle the `handleMouseMove` function to achieve 60 frames per second.
  const handleMouseMove = throttle((event) => {
    // Check if the modal is currently being dragged
    if (isDragging && modalRef.current && headerRef.current) {
      // Calculate the offset based on the starting position
      const offsetX = event.clientX - startPos.x;
      const offsetY = event.clientY - startPos.y;

      // Update the position based on the calculated offset
      setPosition({
        x: position.x + offsetX,
        y: position.y + offsetY,
      });

      // Update the starting position for the next event
      setStartPos({ x: event.clientX, y: event.clientY });

      // Update the modal's CSS transform property to reflect the new position
      modalRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }, 16); // Throttling to ~60fps
  // 1000ms / 60 frames = ~16.67ms per frame, rounded down to 16ms.

  function disable_button() {
    const isDisabled =
      selected_project_id === -1 ||
      selected_project_id === "" ||
      selected_customer_id === -1 ||
      selected_customer_id === "" ||
      selected_task_id === -1 ||
      selected_task_id === "" ||
      start_time === "";

    return isDisabled;
  }

  /**
   * Empty the form fields.
   */
  function emptyFields() {
    setTimeRecordId(-1);
    setSelectedCustomerId(-1);
    setSelectedProjectId(-1);
    setSelectedTaskId(-1);
    setComments("");
    setStartTime("");
    setStopTime("");
    setSelectedTaskName("");
    //setDate("");
  }

  useEffect(() => {
    if (parentDate !== undefined && parentDate !== "") {
      setDate(parentDate);
    }
  }, [parentDate]);

  /* When the form is prompted through a prop, this view runs.
  The launchForm prop starts at zero at render, and increments for each entry.
  */
  useEffect(() => {
    if (doLaunchForm !== undefined && doLaunchForm !== 0) {
      if (timeRecord?.id == undefined || timeRecord.id === -1) {
        setRefresh(true);
        return;
      }
      launchFormFromProp();
    }
  }, [doLaunchForm]);

  /**
   * Pre-load data to the form.
   * This is used for editing prior time logs.
   */
  useEffect(() => {
    if (timeRecord !== null && timeRecord !== undefined) {
      setTimeRecordId(timeRecord.id);

      setComments(timeRecord.comment);
      setStartTime(timeRecord.start_time);
      setStopTime(timeRecord.stop_time);
      setDate(timeRecord.date);

      /* These require customer data to have an effect.
      setSelectedCustomerId(timeRecord.customer);
      setSelectedProjectId(timeRecord.project);
      setSelectedTaskId(timeRecord.task_id);
      */

      // If the customer is stored in the task, then this query can be removed.
      if (timeRecord?.id == undefined || timeRecord.id === -1) {
        setRefresh(true);
        return;
      }
      getTimeRecord(timeRecord.id).then((res) => {
        if (res.status === 200) {
          const data = res.data;
          setSelectedCustomerId(data.customer);
          setSelectedProjectId(data.project);
          setSelectedTaskId(data.task_id);
        }
      });
    }
  }, [timeRecord]);

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

  useEffect(() => {
    if (
      selected_project_id !== null &&
      selected_project_id !== undefined &&
      selected_project_id !== -1
    ) {
      getActiveProjectTasks(selected_project_id).then((res) => {
        let tasks = res.data;
        if (res.status === 200) {
          // filter out tasks that are completed
          tasks = res.data.filter((task) => task.is_complete === false);
        } else if (res.status === 204) {
          tasks = [{ id: "", title: "No Tasks Found!" }];
        }
        const tasksCopy = [...tasks]; // In case we need to keep the original data
        const leafTasks = findLeafNodes(tasksCopy, "id", "parent_task");

        // Fetch assignees for each task
        Promise.all(
          leafTasks.map(async (task) => {
            const assigneesRes = await getTaskAssignees(task.id);
            const assignees = (
              assigneesRes.status === 200 ? assigneesRes.data : []
            ).map((assignee) => ({
              ...assignee,
              color: assignee.color || generateRandomColorWithContrast(),
            }));
            return { ...task, assignees };
          })
        )
          .then((tasksWithAssignees) => {
            setTasks(tasksWithAssignees);
          })
          .catch((error) => {
            console.error("Error fetching tasks or assignees:", error);
            setTasks(leafTasks);
          });
      });
    }
  }, [selected_project_id]);

  useEffect(() => {
    if (
      selected_task_id != null &&
      selected_task_id !== undefined &&
      selected_task_id !== -1
    ) {
      const selected_task = tasks.filter(
        (task) => task.id === parseInt(selected_task_id)
      )[0];
      if (selected_task !== undefined) {
        setSelectedTaskName(selected_task.title);
      }
    }
  }, [selected_task_id]);

  function notTodayWarning(date) {
    return is_not_today ? (
      <span className="badge dokuly-bg-warning">
        Warning: this is not today's date
      </span>
    ) : (
      <div />
    );
  }

  const launchForm = () => {
    emptyFields();

    const today = moment().format("YYYY-MM-DD");
    setIsNotToday(today !== date);

    $("#modal").modal("show");

    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
  };

  const launchFormFromProp = () => {
    const today = moment().format("YYYY-MM-DD");
    setIsNotToday(today !== date);

    $("#modal").modal("show");

    get_active_customers().then((res) => {
      setActiveCustomers(res.data);
    });
  };

  function onSubmit() {
    const hours = calculateHours(start_time, stop_time);
    let tempStopTime = stop_time;
    if (!tempStopTime) {
      tempStopTime = start_time;
    }

    let tempTaskName = selected_task_name;
    if (!tempTaskName) {
      if (selected_project_id && selected_task_id) {
        for (let i = 0; i < tasks.length; i++) {
          if (parseInt(tasks[i].project_id) === parseInt(selected_project_id)) {
            tempTaskName = tasks[i].title;
            break;
          }
        }
      }
    }

    const data = {
      // Fields used by the view.
      id: time_record_id,
      comment: comments,
      project_id: parseInt(selected_project_id),
      task_id: parseInt(selected_task_id),
      task: tempTaskName, // Legacy, kept for usage in the time reports for filters and merging tasks
      start_time: start_time,
      stop_time: tempStopTime,
      date: date,
      hour: parseFloat(hours),
    };

    if (hours < 0) {
      toast.error("Hours cannot be negative!");
      return;
    }
    if (time_record_id === null || time_record_id === undefined) {
      toast.error("Time record entry not valid, ID error.");
      return;
    }
    if (
      selected_customer_id === -1 ||
      selected_customer_id === null ||
      selected_customer_id === undefined
    ) {
      toast.error("Select a valid customer!");
      return;
    }
    if (
      selected_project_id === -1 ||
      selected_project_id === null ||
      selected_project_id === undefined
    ) {
      toast.error("Select a valid project!");
      return;
    }

    if (
      selected_task_id === -1 ||
      selected_task_id === null ||
      selected_task_id === undefined ||
      selected_task_id === ""
    ) {
      toast.error("Select a valid task!");
      return;
    }

    // Push data to the database
    setEmployeeTimeRecord(data)
      .then((res) => {
        if (res.status === 201) {
          emptyFields();
        }
      })
      .finally(() => {
        if (setRefresh !== undefined) {
          setRefresh(true);
        }
        /* // TODO update parent component so the table is responsive while a refetch occurs.
        if (props.pushTimeRecordToParent !== undefined) {
          props.pushTimeRecordToParent(data);
        }
        */
      });
    $("#modal").modal("hide");
  }

  function deleteEntry(time_record_id) {
    if (!confirm("Are you sure you want to delete this time record?")) {
      return;
    }
    $("#modal").modal("hide");
    // Perform the delete operation
    deleteTimeRecord(time_record_id).then((res) => {
      if (res.status === 200) {
        emptyFields();
      }
      if (setRefresh !== undefined) {
        setRefresh(true);
      }
    });
  }

  const loadFromLastTimetrack = () => {
    fetchLastTimetracking().then((res) => {
      if (res.status === 200) {
        setComments(res?.data?.comment);
        if (res?.data?.task_id?.id) {
          setSelectedTaskId(res?.data?.task_id?.id);
          setSelectedTaskName(res?.data?.task_id?.title);
        }
        if (res?.data?.project?.id) {
          setSelectedCustomerId(res.data.project?.customer);
          setSelectedProjectId(res.data.project.id);
        }
      }
    });
  };

  useEffect(() => {
    const headerElement = headerRef.current;
    headerElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      headerElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isDragging, position]);

  useEffect(() => {
    if (active_customers) {
      const customerOptions = active_customers
        .sort((a, b) => (a.customer_id > b.customer_id ? 1 : -1))
        .map((customer) => ({
          value: customer.id,
          label: customer.name,
        }));
      setCustomerOptions(customerOptions);
    }
  }, [active_customers]);

  useEffect(() => {
    if (projects) {
      const projectOptions = projects
        .sort((a, b) => (a.project_number > b.project_number ? 1 : -1))
        .map((project) => ({
          value: project.id,
          label: project.title,
        }));
      setProjectOptions(projectOptions);
    }
  }, [projects]);

  useEffect(() => {
    if (tasks) {
      const taskOptions = tasks.map((task) => ({
        value: task.id,
        label: task.title,
        assignees: task.assignees, // Include assignees
      }));
      setTaskOptions(taskOptions);
    }
  }, [tasks]);

  return (
    <div className="container-fluid">
      <button
        type="button"
        className="btn btn-bg-transparent mt-2 mb-2"
        onClick={() => {
          launchForm();
        }}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="icon"
          />
          <span className="btn-text">Add hours</span>
        </div>
      </button>

      {/* <!-- Modal --> */}
      <div
        className="modal fade"
        id="modal"
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
      >
        <div ref={modalRef} className="modal-dialog" role="document">
          <div className="modal-content">
            <div
              ref={headerRef}
              className="modal-header"
              style={isDragging ? { cursor: "grabbing" } : { cursor: "grab" }}
            >
              <h5 className="modal-title">{`Record work on ${date}`}</h5>

              <small className="form-text text-muted pl-3">
                * Mandatory fields
              </small>

              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {/* Form inputs below */}
            <div className="modal-body">
              <div className="form-group">
                <label>Date *</label>
                <input
                  className="form-control"
                  type="date"
                  name="date"
                  onChange={(e) => {
                    setDate(e.target.value);
                    const today = moment().format("YYYY-MM-DD");
                    setIsNotToday(today !== e.target.value);
                  }}
                  value={date}
                />
              </div>
              <div className="form-group">
                <label>Customer *</label>
                <DokulySelect
                  options={customerOptions}
                  value={
                    selected_customer_id && selected_customer_id !== -1
                      ? customerOptions.find(
                          (option) =>
                            option.value === parseInt(selected_customer_id)
                        )
                      : ""
                  }
                  onChange={(option) => {
                    setSelectedCustomerId(option ? option.value : -1);
                    setSelectedProjectId(-1);
                    setSelectedTaskId(-1);
                  }}
                  placeholder="Choose customer"
                  isClearable
                />
              </div>

              <div className="form-group">
                <label>Project *</label>
                <DokulySelect
                  options={projectOptions}
                  value={
                    selected_project_id && selected_project_id !== -1
                      ? projectOptions.find(
                          (option) =>
                            option.value === parseInt(selected_project_id)
                        )
                      : ""
                  }
                  onChange={(option) => {
                    setSelectedProjectId(option ? option.value : -1);
                    setSelectedTaskId(-1);
                  }}
                  placeholder="Choose project"
                  isClearable
                  isDisabled={selected_customer_id === -1}
                />
              </div>

              <div className="form-group">
                <label>Task *</label>
                <DokulySelect
                  options={taskOptions}
                  value={
                    selected_task_id && selected_task_id !== -1
                      ? taskOptions.find(
                          (option) =>
                            option.value === parseInt(selected_task_id)
                        )
                      : null
                  }
                  onChange={(option) =>
                    setSelectedTaskId(option ? option.value : -1)
                  }
                  placeholder="Choose task"
                  isClearable
                  isDisabled={selected_project_id === -1}
                  components={{ Option: TaskOption }} // Pass the custom Option component
                />
              </div>

              <div className="form-row">
                <div className="form-group col">
                  <label>Start</label>
                  <input
                    className="form-control"
                    height="50px"
                    type="time"
                    name="start_time"
                    onChange={(e) => {
                      setStartTime(e.target.value);
                    }}
                    value={start_time}
                  />

                  {is_not_today ? (
                    ""
                  ) : (
                    <button
                      type="button"
                      className="btn btn-bg-transparent mt-2 mb-2"
                      onClick={() => setStartTime(moment().format("HH:mm"))}
                      // data-dismiss="modal"
                    >
                      <div className="row">
                        <img
                          className="icon-dark"
                          src="../../static/icons/clock_start.svg"
                          alt="icon"
                        />
                        <span className="btn-text">Start now</span>
                      </div>
                    </button>
                  )}
                </div>
                <div className="form-group col">
                  <label>Stop</label>
                  <input
                    className="form-control"
                    height="50px"
                    type="time"
                    name="stop_time"
                    onChange={(e) => {
                      setStopTime(e.target.value);
                    }}
                    value={stop_time}
                  />
                  {is_not_today ? (
                    ""
                  ) : (
                    <button
                      type="button"
                      className="btn btn-bg-transparent mt-2"
                      onClick={() => setStopTime(moment().format("HH:mm"))}
                      // data-dismiss="modal"
                    >
                      <div className="row">
                        <img
                          className="icon-dark"
                          src="../../static/icons/clock_stop.svg"
                          alt="icon"
                        />
                        <span className="btn-text">Stop now</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group col">
                  {stop_time !== start_time && !is_not_today ? (
                    <button
                      type="button"
                      className="btn btn-bg-transparent mt-2"
                      onClick={() => setStopTime(start_time)}
                      // data-dismiss="modal"
                    >
                      <div className="row">
                        <img
                          className="icon-dark"
                          src="../../static/icons/clock_start.svg"
                          alt="icon"
                        />
                        <span className="btn-text">
                          Run timer from start time
                        </span>
                      </div>
                    </button>
                  ) : (
                    ""
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Comments</label>
                <textarea
                  className="form-control"
                  type="text"
                  name="comments"
                  onChange={(e) => {
                    if (e.target.value.length > 200) {
                      alert("Max length 200");
                      return;
                    }
                    setComments(e.target.value);
                  }}
                  value={comments}
                />
              </div>

              <div>
                <div className="form-group">{notTodayWarning(date)}</div>
                <div className="form-group">
                  <Row className="align-items-center">
                    <Col lg={2} sm={2} md={2}>
                      <SubmitButton
                        type="submit"
                        className="btn dokuly-bg-primary"
                        onClick={() => onSubmit()}
                        disabled={disable_button()}
                        disabledTooltip={
                          "Mandatory fields must be entered. Mandatory fields are marked with *"
                        }
                      >
                        Submit
                      </SubmitButton>
                    </Col>
                    <Col
                      lg={
                        time_record_id === -1 || time_record_id === undefined
                          ? 4
                          : 9
                      }
                      sm={
                        time_record_id === -1 || time_record_id === undefined
                          ? 4
                          : 9
                      }
                      md={
                        time_record_id === -1 || time_record_id === undefined
                          ? 4
                          : 9
                      }
                      className="justify-content-start mx-2"
                    >
                      {
                        // Only show delete button when editing an entry.
                        time_record_id === -1 ||
                        time_record_id === undefined ? (
                          ""
                        ) : (
                          <DeleteButton
                            onDelete={() => deleteEntry(time_record_id)}
                          />
                        )
                      }
                    </Col>
                  </Row>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingForm;
