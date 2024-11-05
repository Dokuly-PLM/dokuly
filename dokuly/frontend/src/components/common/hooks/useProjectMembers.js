import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getProjectUsers } from "../../projects/functions/queries";

/**
 * Custom hook for fetching and refreshing project member data.
 * @param {string} projectId - The id of the project for which to fetch project members.
 * @returns {Array} An array containing:
 * - {Object|null} projectMembers - The current project member data or null if no data is available.
 * - {Function} refreshProjectMembers - Function to refresh the project member data.
 * - {boolean} loadingProjectMembers - Indicates if the project member data is currently being loaded.
 */

const useProjectMembers = ({ projectId }) => {
  const [loadingProjectMembers, setLoading] = useState(true);
  const [projectMembers, setProjectMembers] = useState([]);

  const refreshProjectMembers = useCallback(() => {
    if (!projectId || projectId === -1) {
      return;
    }

    setLoading(true);
    getProjectUsers(projectId)
      .then((res) => {
        if (res.status === 204) {
          setProjectMembers({ id: -1, status: "No Project Members Found" });
        } else if (res.status === 200) {
          setProjectMembers(res.data);
        }
      })
      .catch((err) => {
        toast.error("Failed to fetch project members.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    refreshProjectMembers();
  }, [refreshProjectMembers]);

  return [projectMembers, refreshProjectMembers, loadingProjectMembers];
};

export default useProjectMembers;
