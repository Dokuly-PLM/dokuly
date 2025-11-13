import React, { useState, useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { editProjectTask } from "../functions/queries";
import EditableMarkdown from "../../dokuly_components/dokulyMarkdown/editableMarkdown";
import SubmitButton from "../../dokuly_components/submitButton";
import DeleteButton from "../../dokuly_components/deleteButton";
import NumericFieldEditor from "../../dokuly_components/dokulyTable/components/numericFieldEditor";
import DokulyTags from "../../dokuly_components/dokulyTags/dokulyTags";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import { toast } from "react-toastify";
import DokulyCheckFormGroup from "../../dokuly_components/dokulyCheckFormGroup";
import DokulyModal from "../../dokuly_components/dokulyModal";
import DokulyFormSection from "../../dokuly_components/dokulyForm/dokulyFormSection";
import GenericMultiSelector from "../../dokuly_components/genericMultiSelector";
import useProjectMembers from "../../common/hooks/useProjectMembers";
import TaskAssignees from "./taskAssignees";
import useTaskAssignees from "../../common/hooks/useTaskAssignees";

export const EditTaskForm = ({
  project_id,
  project = { id: -1 },
  task = null,
  edit_task = -1,
  setRefresh = () => {},
  updateItemField = () => {},
  tasks = [],
  show = false,
  setShow = () => {},
}) => {
  const [is_active, setIsActive] = useState(false);
  const [is_billable, setIsBillable] = useState(false);
  const [task_name, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [isGantt, setIsGantt] = useState(false);
  const [start, setStart] = useState(new Date().toISOString().split("T")[0]);
  const [end, setEnd] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [workloadHours, setWorkloadHours] = useState(0);
  const [endError, setEndError] = useState(false);
  const [parentTask, setParentTask] = useState(null);

  const [projectMembers, refreshProjectMembers, loadingProjectMembers] =
    useProjectMembers({ projectId: project_id });

  const [taskAssignees, refreshTaskAssignees, loadingTaskAssignees] =
    useTaskAssignees({ taskId: task?.id });

  const filteredTasks = tasks.filter(
    (taskObject) => task?.id !== taskObject?.id
  );

  if (task?.parent_task) {
    filteredTasks.push({ id: -1, title: "Remove parent connection" });
  }

  const handleParentTaskChange = (selectedTask) => {
    let taskId = selectedTask;
    if (typeof taskId === "object") {
      taskId = selectedTask.value;
    } else {
      taskId = selectedTask;
    }
    setParentTask(taskId);
  };

  useEffect(() => {
    if (task) {
      setIsActive(task?.is_active);
      setIsBillable(task?.is_billable);
      setTaskName(task?.title);
      setDescription(task?.description);
      setIsGantt(task?.gantt_id);
      setStart(task?.start || new Date().toISOString().split("T")[0]);
      setEnd(
        task?.end ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
      );
      setWorkloadHours(task?.workload_hours || 0);
      setParentTask(task?.parent_task || "");
    }
  }, [task]);

  const checkInputEnd = () => {
    return endError ? "form-control is-invalid" : "form-control";
  };

  useEffect(() => {
    if (end !== "" && end !== undefined && end !== null) {
      setEndError(false);
    }
  }, [end]);

  function onSubmit() {
    if (isGantt) {
      if (end === "" || end === undefined || end === null || endError) {
        setEndError(true);
        return;
      }
    }

    const data = {
      name: task_name,
      description: description,
      is_billable: is_billable,
      is_active: is_active,
      is_gantt: isGantt,
      start_time: start,
      end_time: end,
      workload_hours: workloadHours,
      project_id: project_id,
    };

    if (parentTask !== null && parentTask !== "") {
      data.parent_task_id = parentTask;
      data.subtask_id = task?.id;
    }

    editProjectTask(task?.id, data)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Task updated");
        }
      })
      .finally(() => {
        setRefresh(true);
        setShow(false);
      });
  }

  function archiveTask() {
    if (!confirm("Are you sure you want to archive the task?")) {
      return;
    }

    const data = {
      is_archived: true,
    };
    editProjectTask(task?.id, data).then((res) => {
      if (res.status === 200) {
        toast.success("Task archived");
        setRefresh(true);
        setShow(false);
      }
    });
  }

  const handleStartDateChange = (e) => {
    const newStartDate = new Date(e.target.value).toISOString().split("T")[0];
    setStart(newStartDate);
    if (new Date(newStartDate) > new Date(end)) {
      setEndError(true);
    } else {
      setEndError(false);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = new Date(e.target.value).toISOString().split("T")[0];
    setEnd(newEndDate);
    if (new Date(start) > new Date(newEndDate)) {
      setEndError(true);
    } else {
      setEndError(false);
    }
  };

  const changeField = (key, value, otherRefresh = false) => {
    if (task?.id == null) {
      return;
    }
    if (key == null) {
      return;
    }

    if (otherRefresh) {
      const refresh = () => {
        setRefresh(true);
        refreshProjectMembers();
        refreshTaskAssignees();
      };
      updateItemField(task.id, key, value, refresh);
      return;
    }

    updateItemField(task.id, key, value, setRefresh);
  };

  const handleTagsChange = (newTags) => {
    // New array with tag ids
    changeField("tags", newTags);
  };

  const formatTasks = (tasks) => {
    return tasks.map((task) => {
      return {
        value: task.id,
        label: task.title,
      };
    });
  };

  const handleAddTaskAssignee = (currentAssignees, newAssignee) => {
    const formattedAssignee = {
      id: newAssignee.value,
      first_name: newAssignee.label.split(" ")[0],
      last_name: newAssignee.label.split(" ")[1],
      color: newAssignee.color,
    };
    if (currentAssignees.find((a) => a.id === formattedAssignee.id)) {
      toast.error("User already assigned to task");
      return;
    }
    const newAssignees = [...currentAssignees, formattedAssignee];
    const assigneeIds = newAssignees.map((a) => a.id);
    changeField("assignees", assigneeIds, true);
  };

  const handleRemoveTaskAssignee = (currentAssignees, assigneeToRemove) => {
    const newAssignees = currentAssignees.filter(
      (a) => a.id !== assigneeToRemove.id
    );
    if (newAssignees.length === currentAssignees.length) {
      return;
    }
    const assigneeIds = newAssignees.map((a) => a.id);
    changeField("assignees", assigneeIds, true);
  };

  const handleAssigneeKeyDown = (event) => {};

  return (
    <DokulyModal
      title={"Edit task"}
      show={show}
      onHide={() => setShow(false)}
      size="xl"
    >
      <div className="form-group">
        <label>Task name</label>
        <input
          className="form-control"
          type="text"
          name="task_name"
          onChange={(e) => {
            if (e.target.value.length > 100) {
              alert("Max length 100");
              return;
            }
            setTaskName(e.target.value);
          }}
          value={task_name}
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <EditableMarkdown
          initialMarkdown={description}
          setMarkdownText={setDescription}
          initialOpen={true}
        />
      </div>
      <hr />
      <Row className="justify-content-center align-items-center d-flex mb-2">
        <Col>
          <Row className="mt-2">
            <Col>
              <DokulyFormSection
                onChange={setWorkloadHours}
                value={workloadHours}
                label="Estimated workload (h)"
                id="workload-hours"
                disabled={task?.hasSubObject}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: "1rem" }}>
            <Col>
              <Form.Group>
                <Form.Label>Task Assignees</Form.Label>
                <TaskAssignees
                  projectMembers={projectMembers}
                  selectedTask={task}
                  handleAddTaskAssignee={handleAddTaskAssignee}
                  handleRemoveTaskAssignee={handleRemoveTaskAssignee}
                  handleKeyDown={handleAssigneeKeyDown}
                  taskAssignees={taskAssignees}
                />
              </Form.Group>
            </Col>
          </Row>
        </Col>
        <Col>
          <div className="form-group" style={{ marginTop: "0rem" }}>
            <Row>
              <DokulyCheckFormGroup
                label={"Add To Gantt"}
                value={isGantt}
                onChange={setIsGantt}
                id="add-to-gantt"
              />
              {isGantt && (
                <Row>
                  <Col>
                    <div className="form-group">
                      <input
                        className="form-control"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={start}
                        onChange={handleStartDateChange}
                      />
                    </div>
                  </Col>
                  <Col>
                    <div className="form-group">
                      <input
                        className={checkInputEnd()}
                        type="date"
                        min={start}
                        value={end}
                        required
                        onChange={handleEndDateChange}
                        onBlur={() => {
                          if (new Date(start) > new Date(end)) {
                            setEndError(true);
                          } else {
                            setEndError(false);
                          }
                        }}
                      />
                      <div className="invalid-feedback">
                        Please choose a valid end date.
                      </div>
                    </div>
                  </Col>
                </Row>
              )}
              {!task?.hasSubObject && (
                <>
                  <DokulyCheckFormGroup
                    label={"Billable"}
                    value={is_billable}
                    onChange={setIsBillable}
                    id="billable"
                  />
                </>
              )}
              <DokulyCheckFormGroup
                label={"Active"}
                value={is_active}
                onChange={setIsActive}
                id="active"
              />
            </Row>
          </div>
        </Col>
      </Row>
      <hr />
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Row className="mt-2 align-items-top">
              <Col className="col-lg-6 col-xl-6">Tags</Col>
            </Row>
            <Row className="mt-2 align-items-top">
              <Col className="col-10">
                <DokulyTags
                  tags={task?.tags ?? []}
                  onChange={handleTagsChange}
                  readOnly={false}
                  project={project}
                  setRefresh={setRefresh}
                  closeEditModeOnSubmit={true}
                  hideEditButton={true}
                />
              </Col>
            </Row>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="mt-2 mb-3">
            <Form.Label>Parent task</Form.Label>
            <GenericDropdownSelector
              state={parentTask}
              setState={handleParentTaskChange}
              dropdownValues={formatTasks(filteredTasks)}
              placeholder={"Select parent task"}
              borderIfPlaceholder={false}
              readOnly={false}
              textSize="16px"
              onHoverTooltip={false}
              tooltipText={""}
            />
          </Form.Group>
        </Col>
      </Row>
      <div className="form-group">
        <div style={{ display: "flex", alignItems: "center" }}>
          <SubmitButton
            disabledTooltip={"Invalid date range"}
            onClick={onSubmit}
            disabled={endError}
            children={"Submit"}
          />
          <DeleteButton onDelete={archiveTask} />
        </div>
      </div>
    </DokulyModal>
  );
};
