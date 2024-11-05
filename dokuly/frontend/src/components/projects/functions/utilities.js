import React from "react";
import { editProjectTask, newProjectTask } from "./queries";
import { toast } from "react-toastify";

export function updateTaskField(id, key, value, setRefresh = () => {}) {
  if (!id || !key || value === undefined) {
    toast.error("Error updating part.");
    return;
  }

  const data = {
    [key]: value,
  };

  editProjectTask(id, data)
    .then((res) => {
      if (res.status === 200) {
        toast.success("Task updated");
      }
    })
    .finally(() => {
      setRefresh(true);
    });
}

export const createTask = (data, project_id, setRefresh = () => {}) => {
  newProjectTask(project_id, data)
    .then((res) => {
      if (res.status === 201) {
        toast.success("Task created");
      }
    })
    .finally(() => {
      setRefresh(true);
    });
};
