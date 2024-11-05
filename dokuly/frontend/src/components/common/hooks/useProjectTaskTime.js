import { useState, useEffect } from "react";
import { getTaskTime } from "../../timetracking/funcions/queries";

const useProjectTaskTime = ({ projectId }) => {
  const [taskTimes, setTaskTimes] = useState([]);
  const [loadingProjectTasksTime, setLoading] = useState(true);

  const fetchAndCacheTaskTimes = async () => {
    if (!projectId || projectId === -1) {
      setLoading(false);
      return; // Early return if no valid project ID is provided
    }

    setLoading(true); // Set loading true at the start of the operation
    try {
      const res = await getTaskTime(projectId);
      setTaskTimes(res.data);
      localStorage.setItem(`taskTimes_${projectId}`, JSON.stringify(res.data)); // Cache with project-specific key
      setLoading(false); // Set loading false upon successful fetch
    } catch (error) {
      fetchFromLocalStorage(); // Fallback to local storage on error
      setLoading(false); // Ensure loading is set to false even if fetch fails
    }
  };

  const fetchFromLocalStorage = () => {
    const storedTaskTimes = localStorage.getItem(`taskTimes_${projectId}`);
    if (storedTaskTimes) {
      try {
        setTaskTimes(JSON.parse(storedTaskTimes));
      } catch (error) {
        localStorage.removeItem(`taskTimes_${projectId}`);
      }
    }
  };

  useEffect(() => {
    const cachedTaskTimes = localStorage.getItem(`taskTimes_${projectId}`);
    if (cachedTaskTimes) {
      try {
        setTaskTimes(JSON.parse(cachedTaskTimes));
      } catch (error) {
        localStorage.removeItem(`taskTimes_${projectId}`);
      }
    }
    fetchAndCacheTaskTimes();
  }, [projectId]); // Dependency array includes projectId to handle changes

  return [taskTimes, fetchAndCacheTaskTimes, loadingProjectTasksTime];
};

export default useProjectTaskTime;
