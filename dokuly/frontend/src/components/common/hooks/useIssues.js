import { useState, useEffect, useCallback } from "react";
import { getIssues } from "../../dokuly_components/dokulyIssues/functions/queries";
import { toast } from "react-toastify";

/**
 * Custom hook for fetching and refreshing issue data.
 * @param {string} app - The app for which to fetch issues.
 * @param {string} dbObjectId - The id of the database object for which to fetch issues.
 * @returns {Array} An array containing:
 *  - {Object|null} issues - The current issue data or null if no data is available.
 * - {Function} refreshIssues - Function to refresh the issue data.
 * - {boolean} loadingIssues - Indicates if the issue data is currently being loaded.
 */
const useIssues = ({ app, dbObjectId, setIsAuthenticated = () => {} }) => {
  const [loadingIssues, setLoading] = useState(true);
  const [issues, setIssues] = useState(null);

  const refreshIssues = useCallback(() => {
    if (!app || !dbObjectId || dbObjectId === -1) {
      return;
    }

    setLoading(true);
    getIssues(dbObjectId, app)
      .then((res) => {
        if (res.status === 204) {
          setIssues({ id: -1, status: "No Issues Found" });
        } else if (res.status === 200) {
          setIssues(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch issues.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [app, dbObjectId]);

  useEffect(() => {
    if (dbObjectId) {
      refreshIssues();
    }
  }, [refreshIssues, dbObjectId]);

  return [issues, refreshIssues, loadingIssues];
};

export default useIssues;
