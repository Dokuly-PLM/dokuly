import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getBomIssues } from "../queries";

/**
 * Custom hook for fetching and refreshing BOM issue data on demand.
 * @param {string} app - The app context (e.g., 'pcbas', 'assemblies').
 * @param {number} dbObjectId - The database object ID for which to fetch BOM issues.
 * @returns {Array} An array containing:
 *  - {Object|null} bomIssues - The current BOM issue data or null if no data is available.
 *  - {Function} refreshBomIssues - Function to refresh the BOM issue data.
 *  - {boolean} loadingBomIssues - Indicates if the BOM issue data is currently being loaded.
 */
const useBomIssues = ({ app, dbObjectId, setIsAuthenticated = () => {} }) => {
  const [loadingBomIssues, setLoading] = useState(true);
  const [bomIssues, setBomIssues] = useState(null);

  const refreshBomIssues = useCallback(() => {
    if (!app || !dbObjectId || dbObjectId === -1) {
      return;
    }
    setLoading(true);
    getBomIssues(app, dbObjectId)
      .then((res) => {
        if (res.status === 204) {
          setBomIssues({ id: -1, status: "No BOM related issues found" });
        } else if (res.status === 200) {
          setBomIssues(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch bom related issues.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [app, dbObjectId]);

  useEffect(() => {
    if (dbObjectId) {
      refreshBomIssues();
    }
  }, [refreshBomIssues, dbObjectId]);

  return [bomIssues, refreshBomIssues, loadingBomIssues];
};

export default useBomIssues;
