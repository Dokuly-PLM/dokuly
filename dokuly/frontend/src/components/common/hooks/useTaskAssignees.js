import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getTaskAssignees } from "../../projects/functions/queries";

/**
 * Custom hook for fetching and refreshing task assignee data.
 * @param {string} taskId - The id of the task for which to fetch task assignees.
 * @returns {Array} An array containing:
 * - {Object|null} taskAssignees - The current task assignee data or null if no data is available.
 * - {Function} refreshTaskAssignees - Function to refresh the task assignee data.
 * - {boolean} loadingTaskAssignees - Indicates if the task assignee data is currently being loaded.
 */

const useTaskAssignees = ({ taskId }) => {
  const [loadingTaskAssignees, setLoading] = useState(true);
  const [taskAssignees, setTaskAssignees] = useState([]);

  const refreshTaskAssignees = useCallback(() => {
    if (!taskId || taskId === -1) {
      return;
    }

    setLoading(true);
    getTaskAssignees(taskId)
      .then((res) => {
        if (res.status === 204) {
          setTaskAssignees({ id: -1, status: "No Task Assignees Found" });
        } else if (res.status === 200) {
          setTaskAssignees(res.data);
        }
      })
      .catch((err) => {
        toast.error("Failed to fetch task assignees.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [taskId]);

  useEffect(() => {
    refreshTaskAssignees();
  }, [refreshTaskAssignees]);

  return [taskAssignees, refreshTaskAssignees, loadingTaskAssignees];
};

export default useTaskAssignees;
