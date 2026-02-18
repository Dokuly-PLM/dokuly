import React, { useEffect, useRef, useState } from "react";
import { Gantt } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import {
  createGantt,
  editProjectTask,
  fetchGantt,
  editGantt,
} from "../functions/queries";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import { Col, Container, Row } from "react-bootstrap";
import "./styling/gantt.css";
import { toast } from "react-toastify";
import { NewTaskForm } from "../projectTimeline/newTaskForm";
import DokulyCard from "../../dokuly_components/dokulyCard";
import moment from "moment";
import CardTitle from "../../dokuly_components/cardTitle";
import ProgressionBar from "../../dokuly_components/progressionBar";
import useProjectTaskTime from "../../common/hooks/useProjectTaskTime";

const DisplayGantt = (props) => {
  const [project_id, setProjectId] = useState(-1);

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setProjectId(Number.parseInt(split[5]));
  }, [window.location.href]);

  const [refresh, setRefresh] = useState(false);
  const [gantt, setGantt] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [loadingGantt, setLoadingGantt] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [target, setTarget] = useState(null);
  const [rawTasks, setRawTasks] = useState([]);
  const [tasksValid, setTasksValid] = useState(true);
  const [view, setView] = useState("Week");
  const [error, setError] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);

  const [taskTimes, fetchAndCacheTaskTimes, loadingProjectTasksTime] =
    useProjectTaskTime({
      projectId: project_id,
    });

  const checkTasks = (tasks) => {
    if (!tasks) {
      return false;
    }
    return tasks.some((task) => {
      if (!(task.start instanceof Date) || !(task.end instanceof Date)) {
        console.error("Invalid task dates found:", task);
        return true;
      }
      return false;
    });
  };

  const buildTasksArr = (data) => {
    const taskMap = {};

    // First, create a mapping of tasks by their IDs and initialize their properties
    const tasksWithTime = data
      .map((task) => {
        const startDate = new Date(task.start);
        const endDate = new Date(task.end);

        if (
          Number.isNaN(startDate) ||
          Number.isNaN(endDate) ||
          startDate >= endDate
        ) {
          console.error(`Invalid date for task ID: ${task.id}`);
          return null;
        }

        const workload = task.workload_hours || 0;
        const taskTime = taskTimes.find((t) => t.task_id === task.id) ?? {
          accumulated_time_hours: 0,
        };

        let taskProgress = (taskTime.accumulated_time_hours / workload) * 100;
        if (Number.isNaN(taskProgress) || taskProgress < 0) {
          taskProgress = 0;
        }
        if (taskProgress > 100) {
          taskProgress = 100;
        }

        if (task.is_complete) {
          taskProgress = 100;
        }

        let hoursFormatted = "N/A";
        if (taskTime && workload > 0) {
          hoursFormatted = ` ${taskTime.accumulated_time_hours.toFixed(
            1,
          )} / ${workload.toFixed(1)} h`;
        }

        const renderUnicode = (task) => {
          if (task.is_complete) {
            return "\u2713"; // ✓
          }
          return "";
        };

        // Update task name to include the formatted hours
        const updatedName = `${renderUnicode(task)} ${
          task.title || "Unnamed Task"
        } - ${hoursFormatted}`;

        // Initialize the task object with properties required by Gantt
        const ganttTask = {
          id: task.id.toString(),
          name: updatedName,
          start: startDate,
          end: endDate,
          progress: taskProgress?.toFixed(2) || 0,
          type: "task", // default type is 'task'
          isDisabled: task.isDisabled || false,
          project: null, // default project is null
          hideChildren: false,
          // Store the original task data and initialize the children array
          originalTask: task,
          children: [],
        };

        // Add to taskMap for easy lookup
        taskMap[task.id] = ganttTask;

        return ganttTask;
      })
      .filter((task) => task !== null);

    // Build a set of parent task ids
    const parentTaskIds = new Set();
    tasksWithTime.forEach((task) => {
      const parentId = task.originalTask.parent_task;
      if (parentId) {
        parentTaskIds.add(parentId);
      }
    });

    // Set the 'type' of each task
    tasksWithTime.forEach((task) => {
      if (parentTaskIds.has(parseInt(task.id))) {
        task.type = "project";
      } else {
        task.type = "task";
      }
    });

    // Compute the ancestor paths for each task
    tasksWithTime.forEach((task) => {
      let path = [];
      let currentTask = task;
      while (currentTask) {
        path.unshift(currentTask.id);
        if (currentTask.originalTask.parent_task) {
          currentTask = taskMap[currentTask.originalTask.parent_task];
        } else {
          currentTask = null;
        }
      }
      task.ancestorPath = path;
    });

    // Sort the tasks based on ancestorPath
    tasksWithTime.sort((a, b) => {
      const len = Math.max(a.ancestorPath.length, b.ancestorPath.length);
      for (let i = 0; i < len; i++) {
        const aId = parseInt(a.ancestorPath[i], 10) || -1;
        const bId = parseInt(b.ancestorPath[i], 10) || -1;
        if (aId !== bId) {
          return aId - bId;
        }
      }
      return 0;
    });

    // Update the state with the sorted tasks
    setTasks(tasksWithTime);
    setTasksValid(!checkTasks(tasksWithTime));
  };

  const getStartEndDateForProject = (tasksArray, projectId) => {
    const projectTasks = tasksArray.filter(
      (t) => t.originalTask.parent_task === parseInt(projectId),
    );

    if (projectTasks.length === 0) {
      return [null, null];
    }

    let start = projectTasks[0].start;
    let end = projectTasks[0].end;

    for (let i = 1; i < projectTasks.length; i++) {
      const task = projectTasks[i];
      if (start.getTime() > task.start.getTime()) {
        start = task.start;
      }
      if (end.getTime() < task.end.getTime()) {
        end = task.end;
      }
    }
    return [start, end];
  };

  const updateProjectDates = (projectId) => {
    if (!projectId) return;

    // Find all child tasks belonging to the project
    const childTasks = tasks.filter(
      (t) => t.originalTask.parent_task === projectId,
    );

    if (childTasks.length > 0) {
      // Find the earliest start and latest end dates among the child tasks
      const earliestStart = new Date(
        Math.min(...childTasks.map((t) => new Date(t.start).getTime())),
      );
      const latestEnd = new Date(
        Math.max(...childTasks.map((t) => new Date(t.end).getTime())),
      );

      // Find the parent (project) task
      const projectTask = tasks.find((t) => parseInt(t.id) === projectId);

      if (!projectTask) return;

      // Only update the project task if its dates need to be adjusted
      if (
        new Date(projectTask.start).getTime() !== earliestStart.getTime() ||
        new Date(projectTask.end).getTime() !== latestEnd.getTime()
      ) {
        // Optimistically update the project task dates
        const updatedProject = {
          ...projectTask,
          start: earliestStart,
          end: latestEnd,
        };

        const updatedTasks = tasks.map((t) =>
          t.id === projectId.toString() ? updatedProject : t,
        );
        setTasks(updatedTasks);

        // Prepare the payload for the API call
        const data = {
          new_start: earliestStart.toISOString().split("T")[0],
          new_end: latestEnd.toISOString().split("T")[0],
        };

        // Make the API call to update the project in the backend
        editProjectTask(projectId, data).then((res) => {
          if (res.status !== 200) {
            toast.error("Error updating project dates");
          } else {
            // Recursively update parent projects
            updateProjectDates(projectTask.originalTask.parent_task);
          }
        });
      } else {
        // Even if dates didn't change, we might need to update parent project dates
        updateProjectDates(projectTask.originalTask.parent_task);
      }
    }
  };

  const onDateChangeOptimistic = (task, children) => {
    let newTasks = tasks.map((t) => (t.id === task.id ? task : t));

    const updateParentDates = (currentTask, tasksArray) => {
      const parentTaskId = currentTask.originalTask.parent_task;
      if (parentTaskId) {
        const [start, end] = getStartEndDateForProject(
          tasksArray,
          parentTaskId,
        );
        const parentTaskIndex = tasksArray.findIndex(
          (t) => t.id === parentTaskId.toString(),
        );
        const parentTask = tasksArray[parentTaskIndex];
        if (
          parentTask &&
          (parentTask.start.getTime() !== start.getTime() ||
            parentTask.end.getTime() !== end.getTime())
        ) {
          const changedParentTask = { ...parentTask, start, end };
          tasksArray[parentTaskIndex] = changedParentTask;

          // Recursively update ancestor projects
          updateParentDates(changedParentTask, tasksArray);
        }
      }
    };

    // Start updating from the changed task
    updateParentDates(task, newTasks);

    setTasks(newTasks);

    // Now, after updating the frontend, make API calls to update backend
    const data = {
      new_start: new Date(task.start).toISOString().split("T")[0],
      new_end: new Date(task.end).toISOString().split("T")[0],
    };

    editProjectTask(task.id, data).then((res) => {
      if (res.status !== 200) {
        // Revert the optimistic update in case of an error
        setTasks(tasks);
        toast.error("Error updating task data");
      } else {
        // Update parent tasks in the backend
        const parentTasksToUpdate = [];

        const collectParentTasks = (currentTask) => {
          const parentTaskId = currentTask.originalTask.parent_task;
          if (parentTaskId) {
            parentTasksToUpdate.push(parentTaskId);
            const parentTask = newTasks.find(
              (t) => t.id === parentTaskId.toString(),
            );
            if (parentTask) {
              collectParentTasks(parentTask);
            }
          }
        };

        collectParentTasks(task);

        // Now, update each parent task in the backend
        parentTasksToUpdate.forEach((parentTaskId) => {
          const parentTask = newTasks.find(
            (t) => t.id === parentTaskId.toString(),
          );
          if (parentTask) {
            const parentData = {
              new_start: new Date(parentTask.start).toISOString().split("T")[0],
              new_end: new Date(parentTask.end).toISOString().split("T")[0],
            };
            editProjectTask(parentTaskId, parentData).then((res) => {
              if (res.status !== 200) {
                toast.error("Error updating parent task data");
              }
            });
          }
        });
      }
    });
  };

  const onClick = (task) => {
    if (selectedTask?.id !== task.id) {
      setTarget(task);
    }
  };

  const onSelect = (task, isSelected) => {
    setSelectedTask(task);
  };

  const getColWidth = () => {
    if (view === "Hour") {
      return 30;
    }
    if (view === "Day") {
      return 61.9;
    }
    if (view === "Week") {
      return 234;
    }
    if (view === "Month") {
      return 351;
    }
  };

  useEffect(() => {
    if ((gantt == null && tasks == null) || refresh) {
      setLoadingGantt(true);
      setTasksValid(false);
      if (project_id !== -1) {
        fetchGantt(project_id)
          .then((res) => {
            if (res.status === 200) {
              setRawTasks(res.data.tasks);
              setGantt(res.data.gantt);
            } else if (res.status === 204) {
              setRawTasks([]);
            } else {
              setError(true);
            }
          })
          .finally(() => {
            setLoadingGantt(false);
          });
      }
    } else {
      setLoadingGantt(false);
    }
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh, project_id]);

  useEffect(() => {
    if (rawTasks.length > 0) {
      const taskCount = rawTasks.length;
      const tasksCompleted = rawTasks.filter(
        (task) => task.is_complete === true,
      ).length;
      setTaskCount(taskCount);
      setTasksCompleted(tasksCompleted);
    }
  }, [rawTasks]);

  useEffect(() => {
    if (props?.refresh) {
      setRefresh(true);
    }
  }, [props?.refresh]);

  useEffect(() => {
    if (!loadingGantt && !loadingProjectTasksTime) {
      buildTasksArr(rawTasks);
    }
  }, [rawTasks, taskTimes]);

  if (loadingGantt || !tasksValid) {
    return loadingSpinner();
  }

  if (error) {
    return <div>Error loading component, contact admin.</div>;
  }

  return (
    <div className="mt-4">
      {tasks?.length === 0 ||
      tasks === null ||
      tasks === undefined ||
      gantt === null ||
      gantt === undefined ? (
        <div className="m-3">No tasks added to gantt</div>
      ) : (
        <DokulyCard>
          <CardTitle titleText="Gantt Chart" />
          <Row className="mt-3 ml-2 mb-2">
            <Col>
              <Row className="align-items-center ml-2">
                <Col className="col-auto">
                  <NewTaskForm
                    project_id={project_id}
                    setRefresh={(value) => {
                      setRefresh(value);
                      if (props.setRefresh) {
                        props.setRefresh(value);
                      }
                    }}
                    addToGantDefault={true}
                    project={props?.project}
                  />
                </Col>
                <Col className="col-8">
                  <ProgressionBar
                    rowClassname="mx-2 align-items-center"
                    currentProgressCount={tasksCompleted}
                    totalCount={taskCount}
                    firstColClassname="col-auto"
                    secondColClassname="col-lg-8 col-xl-8 col-8"
                    label="Completed"
                    tooltipText="- Shows the number of tasks completed"
                  />
                </Col>
              </Row>
            </Col>
            <Col>
              <button
                className={`btn badge badge-pill p-2 ml-2 ${
                  view === "Hour" ? "dokuly-bg-primary" : "btn-outline-primary"
                }`}
                onClick={() => {
                  setView("Hour");
                }}
                type="button"
              >
                Hour
              </button>
              <button
                className={`btn badge badge-pill p-2 ml-2 ${
                  view === "Day" ? "dokuly-bg-primary" : "btn-outline-primary"
                }`}
                onClick={() => {
                  setView("Day");
                }}
                type="button"
              >
                Day
              </button>
              <button
                className={`btn badge badge-pill p-2 ml-2 ${
                  view === "Week" ? "dokuly-bg-primary" : "btn-outline-primary"
                }`}
                onClick={() => {
                  setView("Week");
                }}
                type="button"
              >
                Week
              </button>
              <button
                className={`btn badge badge-pill p-2 ml-2 ${
                  view === "Month" ? "dokuly-bg-primary" : "btn-outline-primary"
                }`}
                onClick={() => {
                  setView("Month");
                }}
                type="button"
              >
                Month
              </button>
            </Col>
          </Row>
          <div
            className="center-content-start-left"
            style={{ maxWidth: "87.77vw", overflowX: "auto" }}
          >
            <Gantt
              key={tasks?.length ?? -1}
              tasks={tasks ?? []}
              viewMode={view}
              onDateChange={onDateChangeOptimistic}
              onProgressChange={() => {}}
              onClick={onClick}
              onSelect={onSelect}
              columnWidth={getColWidth()}
              listCellWidth={""}
              ganttHeight={"100%"}
              barProgressColor="#165216ff"
            />
          </div>
        </DokulyCard>
      )}
    </div>
  );
};

export default DisplayGantt;
