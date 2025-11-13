import React, { useState, useEffect } from "react";
import {
  addSubtask,
  editProjectTask,
  getProjectTasks,
  removeSubtask,
} from "../functions/queries";
import { NewTaskForm } from "./newTaskForm";
import { EditTaskForm } from "./editTask";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import DokulyMarkdown from "../../dokuly_components/dokulyMarkdown/dokulyMarkdown";
import CardTitle from "../../dokuly_components/cardTitle";
import EditButton from "../../dokuly_components/editButton";
import { getTaskTime } from "../../timetracking/funcions/queries";
import { Col, Form, Row } from "react-bootstrap";
import DokulyTags from "../../dokuly_components/dokulyTags/dokulyTags";
import { createTask, updateTaskField } from "../functions/utilities";
import {
  dateFormatter,
  genericDateFormatter,
} from "../../documents/functions/formatters";
import EditTags from "../../dokuly_components/dokulyTags/editTagsGeneric";
import useProjectTags from "../../common/hooks/useProjectTags";
import NumericFieldEditor from "../../dokuly_components/dokulyTable/components/numericFieldEditor";
import { titleFormatter } from "../../dokuly_components/formatters/titleFormatter";
import DokulyCheckFormGroup from "../../dokuly_components/dokulyCheckFormGroup";
import { checkAllChildrenProp } from "../../dokuly_components/dokulyTable/functions/mappingUtils";
import { toast } from "react-toastify";
import TextFieldEditor from "../../dokuly_components/dokulyTable/components/textFieldEditor";

const TaskManager = (props) => {
  const [tasksNoTime, setTasksNoTime] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(-1);
  const [refresh, setRefresh] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  // Total estimated hours for all tasks
  const [totalEstimatedHours, setTotalEstimatedHours] = useState(0);
  // Total hours worked on tasks
  const [totalWorkedHours, setTotalWorkedHours] = useState(0);
  // Total hours worked on completed tasks
  const [
    totalHoursWorkedOnCompletedTasks,
    setTotalHoursWorkedOnCompletedTasks,
  ] = useState(0);
  // Total hours left based on estimate minus hours worked tasks not completed
  const [totalHoursLeftBasedOnEstimate, setTotalHoursLeftBasedOnEstimate] =
    useState(0);

  const [projectId, setProjectId] = useState(-1);
  const [projectHours, setProjectHours] = useState([]);

  const [selectedTaskForSubtasks, setSelectedTaskForSubtasks] = useState(null);
  const [showSubtasksModal, setShowSubtasksModal] = useState(false);
  const [treeStructure, setTreeStructure] = useState(true);
  const [filteredTasks, setFilteredTasks] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);

  const [projectTags, fetchAndCacheTags, loadingProjectTags] = useProjectTags({
    projectId: projectId ?? -1,
    readonly: false,
  });

  const createTaskAddAsSubtask = (row) => {
    const data = {
      // Fields used by the view.
      name: "--",
      description: "",
      is_billable: false,
      is_gantt: false,
      start: new Date().toISOString().split("T")[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      parent_task_id: row.id,
      subtask_id: true,
    };
    createTask(data, projectId, setRefresh);
  };

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setProjectId(Number.parseInt(split[5]));
  }, [window.location.href]);

  useEffect(() => {
    if (
      (projectId != null && projectId !== undefined && projectId !== -1) ||
      refresh
    ) {
      getProjectTasks(projectId).then((res) => {
        if (res.status === 200) {
          setTasksNoTime(res.data);
        }
      });
    }
    setEditTask(-1);
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh, projectId]);

  useEffect(() => {
    if (props?.refresh) {
      setRefresh(true);
    }
  }, [props?.refresh]);

  useEffect(() => {
    if (projectId != null && projectId !== undefined && projectId !== -1) {
      getTaskTime(projectId).then((res) => {
        if (res.status === 200) {
          setProjectHours(res.data);
        }
      });
    }
  }, [projectId]);

  useEffect(() => {
    // Combine tasks with time data
    const tasksWithTime = tasksNoTime.map((task) => {
      const taskTime = projectHours.find((time) => time.task_id === task.id);
      return {
        ...task,
        worked_hours: taskTime?.accumulated_time_hours || 0,
        children: [], // Initialize children array
      };
    });

    // Build a mapping from task id to task
    const taskMap = {};
    tasksWithTime.forEach((task) => {
      taskMap[task.id] = task;
    });

    // Build the tree structure
    tasksWithTime.forEach((task) => {
      task.isProjectTask = true;
      if (task.parent_task) {
        const parentId = task.parent_task;
        if (taskMap[parentId]) {
          taskMap[parentId].children.push(task);
        }
      }
    });

    // Function to compute summed hours
    function computeSummedHours(task) {
      if (task.children.length === 0) {
        // Leaf node, return its own hours
        return {
          totalWorkedHours: Number.parseFloat(task.worked_hours) || 0,
          totalEstimatedHours: Number.parseFloat(task.workload_hours) || 0,
        };
      } else {
        // Parent node, sum up children's hours
        let totalWorkedHours = 0;
        let totalEstimatedHours = 0;
        task.children.forEach((child) => {
          const childHours = computeSummedHours(child);
          totalWorkedHours += childHours.totalWorkedHours;
          totalEstimatedHours += childHours.totalEstimatedHours;
        });
        // Store the summed hours in the task
        task.worked_hours = totalWorkedHours;
        task.workload_hours = totalEstimatedHours;
        return {
          totalWorkedHours,
          totalEstimatedHours,
        };
      }
    }

    // Compute summed hours starting from root tasks
    const rootTasks = tasksWithTime.filter((task) => !task.parent_task);
    rootTasks.forEach((task) => {
      computeSummedHours(task);
    });

    tasksWithTime.sort((a, b) => {
      const aIsNew = a?.title === "--";
      const bIsNew = b?.title === "--";
      if (aIsNew && !bIsNew) return -1;
      if (bIsNew && !aIsNew) return 1;
      return 0;
    });

    setTasks(tasksWithTime);
  }, [tasksNoTime, projectHours]);

  useEffect(() => {
    let totalEst = 0;
    let totalWorked = 0;
    let totalWorkedCompleted = 0;
    let totalLeftEstimate = 0;

    if (filteredTasks.length === 0) {
      setTotalEstimatedHours(totalEst);
      setTotalWorkedHours(totalWorked);
      setTotalHoursWorkedOnCompletedTasks(totalWorkedCompleted);
      setTotalHoursLeftBasedOnEstimate(totalLeftEstimate);
      return;
    }

    // Only consider leaf tasks
    const leafTasks = filteredTasks.filter(
      (task) => task.children.length === 0
    );

    leafTasks.forEach((task) => {
      // Avoid NaN values
      const workedHours = Number.parseFloat(task.worked_hours) || 0;
      const workloadHours = Number.parseFloat(task.workload_hours) || 0;

      // Total estimated hours for all tasks
      totalEst += workloadHours;

      // Total hours worked on tasks
      totalWorked += workedHours;

      // Check if the task is completed
      if (task.is_complete) {
        // Total hours worked on completed tasks
        totalWorkedCompleted += workedHours;
      } else {
        if (workloadHours > 0) {
          // Total hours left based on estimate minus hours worked for tasks not completed
          totalLeftEstimate += workloadHours - workedHours;
        }
      }
    });

    setTotalEstimatedHours(totalEst);
    setTotalWorkedHours(totalWorked);
    setTotalHoursWorkedOnCompletedTasks(totalWorkedCompleted);
    setTotalHoursLeftBasedOnEstimate(totalLeftEstimate);
  }, [filteredTasks]);

  const handleEditClick = (rowIndex, row) => {
    setSelectedTask(row);
    setEditTask((prevEditTask) => prevEditTask + 1); // Increment editTask
    setShowEditModal(true);
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      maxWidth: "40px",
      csvFormatter: (row) => (row?.id ? row.id : ""),
      defaultShowColumn: true,
    },
    {
      key: "is_complete",
      header: "",
      maxWidth: "40px",
      formatter: (row) => {
        const isParent = row?.children?.length > 0 ?? false;
        const allChildrenIsCompleted = checkAllChildrenProp(row, "is_complete");
        if (isParent && !allChildrenIsCompleted) {
          return "";
        }
        let checked = false;
        if (!isParent) {
          checked = row?.is_complete;
        } else {
          checked = allChildrenIsCompleted;
        }
        return (
          <Row className="d-flex justify-content-center">
            <Form.Check
              type="checkbox"
              id={row?.id}
              className="dokuly-checkbox"
              checked={checked}
              disabled={isParent}
              onChange={(e) => {
                editProjectTask(row?.id, {
                  is_complete: e.target.checked,
                })
                  .then((res) => {
                    if (res.status === 200) {
                      setRefresh(true);
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }}
            />
          </Row>
        );
      },
      csvFormatter: (row) => (row?.is_complete ? "Completed" : "Not completed"),
    },
    {
      key: "title",
      header: "Title",
      hierarchical: true,
      formatter: (row) => {
        const titleStyle = row?.is_complete
          ? { textDecoration: "line-through", opacity: 0.75 }
          : {};

        // Apply inline display to ensure all elements are rendered inline
        const spanStyle = { display: "inline" };

        return (
          <span style={{ ...titleStyle, ...spanStyle }}>
            <TextFieldEditor
              text={row?.title}
              setText={(newText) =>
                updateTaskField(row.id, "name", newText, setRefresh)
              }
              multiline={false}
              readOnly={row?.is_complete ?? false}
              renderAsSpan={true}
              isMarkdown={false}
            />
          </span>
        );
      },
      csvFormatter: (row) => (row?.title ? row.title : ""),
    },
    {
      key: "description",
      header: "Task description",
      formatter: (row) => {
        const rowStyle = row?.is_complete ? { opacity: 0.75 } : {};
        return (
          <span style={rowStyle}>
            <TextFieldEditor
              text={row?.description}
              setText={(newText) =>
                updateTaskField(row.id, "description", newText, setRefresh)
              }
              multiline={true}
              readOnly={row?.is_complete ?? false}
            />
          </span>
        );
      },
      csvFormatter: (row) => (row?.description ? `${row?.description}` : ""),
    },
    {
      key: "tags",
      header: "Tags",
      maxWidth: "120px",
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
      key: "worked_hours",
      header: "Worked hours",
      headerTooltip: "Hours recorded against this task",
      maxWidth: "70px",
      formatter: (row) => {
        const workedHours = Number.parseFloat(row?.worked_hours ?? 0).toFixed(
          2
        );
        const workloadHours = Number.parseFloat(
          row?.workload_hours ?? 0
        ).toFixed(2);

        const isParent = row?.children.length > 0;
        const isParentStyle =
          row?.children.length > 0 ? { fontWeight: "bold" } : {};
        const isCompletedStyle = row?.is_complete
          ? { opacity: 0.75, ...isParentStyle }
          : { ...isParentStyle };

        if (workloadHours === 0) {
          return (
            <div className="text-left" style={isCompletedStyle}>
              {isParent ? `(${workedHours} h)` : `${workedHours} h`}
            </div>
          );
        }
        if (workedHours) {
          if (
            Number.parseFloat(workedHours) > Number.parseFloat(workloadHours)
          ) {
            return (
              <div style={isCompletedStyle} className="text-left">
                <span
                  className="badge bg-danger text-white"
                  title="Worked hours exceed workload hours"
                >
                  {isParent ? `(${workedHours} h)` : `${workedHours} h`}
                </span>
              </div>
            );
          }
          return (
            <div className="text-left" style={isCompletedStyle}>
              {isParent ? `(${workedHours} h)` : `${workedHours} h`}
            </div>
          );
        }
        return "";
      },
      csvFormatter: (row) =>
        row?.worked_hours
          ? `${Number.parseFloat(row?.worked_hours).toFixed(2)} h`
          : "",
      defaultShowColumn: true,
    },
    {
      key: "workload_hours",
      header: "Estimate",
      headerTooltip: "Estimated workload in hours",
      maxWidth: "70px",
      formatter: (row) => {
        const isParent = row?.children.length > 0;
        const isParentStyle =
          row?.children.length > 0 ? { fontWeight: "bold" } : {};
        const isCompletedStyle = row?.is_complete
          ? { opacity: 0.75, ...isParentStyle }
          : { ...isParentStyle };
        return (
          <NumericFieldEditor
            number={row?.workload_hours?.toFixed(2)}
            setNumber={(value) => {
              updateTaskField(row?.id, "workload_hours", value, setRefresh);
            }}
            unit="h"
            style={isCompletedStyle}
            renderWithParentheses={isParent}
            disabled={isParent}
          />
        );
      },
      csvFormatter: (row) =>
        row?.workload_hours ? `${row?.workload_hours?.toFixed(2)} h` : "",
      defaultShowColumn: true,
    },
    {
      key: "last_updated",
      header: "Last Modified",
      formatter: (row) => dateFormatter(row),
      defaultShowColumn: false,
    },
    {
      key: "gantt_id",
      header: "In Gantt",
      formatter: (row) => (
        <input
          className="d-flex align-items-center dokuly-checkbox"
          type="checkbox"
          checked={row?.gantt_id !== null && row?.gantt_id !== undefined}
          disabled
          style={
            row?.is_complete
              ? { opacity: 0.75, marginLeft: "10px" }
              : { marginLeft: "10px" }
          }
        />
      ),
      csvFormatter: (row) => (row?.gantt_id ? "Yes" : "No"),
      defaultShowColumn: false,
    },
    {
      key: "is_active",
      header: "Active task",
      formatter: (row) => (
        <input
          className="d-flex align-items-center dokuly-checkbox"
          type="checkbox"
          checked={row?.is_active && row?.is_active === true}
          disabled
          style={
            row?.is_complete
              ? { opacity: 0.75, marginLeft: "10px" }
              : { marginLeft: "10px" }
          }
        />
      ),
      csvFormatter: (row) => (row?.is_active ? "Yes" : "No"),
      defaultShowColumn: false,
    },
    {
      key: "is_billable",
      header: "Billable",
      formatter: (row) => {
        const isParent = row?.children?.length > 0 ?? false;
        return (
          <Row className="align-items-center justify-content-center d-flex mt-2">
            <Col>
              {!isParent ? (
                <input
                  className="dokuly-checkbox d-flex align-items-center"
                  type="checkbox"
                  checked={row?.is_billable && row?.is_billable === true}
                  onChange={(e) => {
                    // Update is_billable field when checkbox is changed
                    updateTaskField(
                      row.id,
                      "is_billable",
                      e.target.checked,
                      setRefresh
                    );
                  }}
                  style={
                    row?.is_complete
                      ? { opacity: 0.75, marginLeft: "10px" }
                      : { marginLeft: "10px" }
                  }
                />
              ) : (
                ""
              )}
            </Col>
            <Col />
          </Row>
        );
      },
      csvFormatter: (row) => (row?.is_billable ? "Yes" : "No"),
      defaultShowColumn: false,
      maxWidth: "50px",
    },
    {
      key: "start",
      header: "Start date",
      formatter: (row) => genericDateFormatter(row?.start),
      defaultShowColumn: false,
      maxWidth: "70px",
    },
    {
      key: "",
      header: "",
      sort: false,
      formatter: (row, index) => {
        const rowStyle = row?.is_complete ? { opacity: 0.75 } : {};
        return (
          <Row
            style={rowStyle}
            className="align-items-top justify-content-center"
          >
            <EditButton
              buttonText={""}
              onClick={() => handleEditClick(index, row)}
              iconSize="25px"
            />
          </Row>
        );
      },
      includeInCsv: false,
      maxWidth: "50px",
    },
    {
      key: "parent_task",
      header: "Parent task",
      formatter: (row) => {
        return row?.parent_task ? row.parent_task.title : "";
      },
      defaultShowColumn: false,
    },
  ];

  const startDateCol = 11;
  const defaultSorted = { columnNumber: startDateCol, order: "asc" };

  useEffect(() => {
    const filtered = tasks.filter((task) => showInactive || task.is_active);
    setFilteredTasks(filtered);
  }, [tasks, showInactive]);

  return (
    <React.Fragment>
      <EditTaskForm
        setRefresh={(value) => props?.setRefresh(value)}
        task={selectedTask}
        edit_task={editTask}
        project_id={projectId}
        project={props?.project}
        updateItemField={updateTaskField}
        tasks={tasks}
        show={showEditModal}
        setShow={setShowEditModal}
      />
      <div className="mt-4">
        <div className="card-body bg-white m-3 card rounded">
          <CardTitle
            titleText="Task Manager"
            optionalHelpText={
              "This table manages project tasks. These tasks may be logged time to, and can optionally be included in a Gantt chart."
            }
          />
          <Row className="align-items-center ml-2">
            <Col className="col-auto">
              <NewTaskForm
                project_id={projectId}
                project={props?.project}
                setRefresh={(value) => props?.setRefresh(value)}
              />
            </Col>
            <Col className="col-auto">
              <EditTags
                projectTags={projectTags}
                project={props?.project ?? { id: -1 }}
                fetchAndCacheTags={fetchAndCacheTags}
                readOnly={false}
                setRefresh={(value) => props?.setRefresh(value)}
              />
            </Col>
          </Row>
          <DokulyTable
            tableName="TaskTable"
            data={filteredTasks}
            columns={columns}
            showColumnSelector={true}
            defaultSort={defaultSorted}
            onRowClick={() => {}}
            onRowDoubleClick={() => {}}
            treeData={treeStructure}
            contextMenuActions={[
              {
                label: "Add subtask",
                onClick: (row) => {
                  createTaskAddAsSubtask(row);
                },
              },
            ]}
            useOnRightClick={true}
            renderChildrenNextToSearch={
              <Row className="align-items-center">
                <label
                  className="form-check-label"
                  style={{ marginLeft: "1rem", marginRight: "1rem" }}
                >
                  <input
                    className="dokuly-checkbox"
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />{" "}
                  Show Inactive Tasks
                </label>
                <Form.Group style={{ marginTop: "1rem" }}>
                  <DokulyCheckFormGroup
                    label="Show parent-subtasks structure"
                    value={treeStructure}
                    onChange={setTreeStructure}
                    id="showParentSubtasksStructure"
                  />
                </Form.Group>
              </Row>
            }
          />
          <Row
            className="justify-content-start d-flex"
            style={{
              borderTop: "1px dashed gray",
              marginTop: "0.66rem",
              paddingTop: "0.66rem",
            }}
          >
            <Col className="col-6 justify-content-center d-flex">
              <b className="mr-1">Total worked Hours:</b>
              {totalWorkedHours.toFixed(2)} h
            </Col>
            <Col className="col-6 justify-content-center d-flex">
              <b className="mr-1">Total hours worked on completed tasks:</b>
              {totalHoursWorkedOnCompletedTasks.toFixed(2)} h
            </Col>
          </Row>
          <Row className="justify-content-end d-flex">
            <Col className="col-6 justify-content-center d-flex">
              <b className="mr-1">Total estimated hours:</b>
              {totalEstimatedHours.toFixed(2)} h
            </Col>
            <Col className="col-6 justify-content-center d-flex">
              <b className="mr-1">Total hours left on uncompleted tasks:</b>
              {totalHoursLeftBasedOnEstimate.toFixed(2)} h
            </Col>
          </Row>
        </div>
      </div>
    </React.Fragment>
  );
};

export default TaskManager;
