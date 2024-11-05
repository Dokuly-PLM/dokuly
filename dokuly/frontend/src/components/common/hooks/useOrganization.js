import { useState, useEffect, useCallback } from "react";
import { getOrganization } from "../queries";

/**
 * Custom hook for fetching and refreshing organization data.
 *
 * @returns {Array} An array containing:
 *   - {Object|null} organization - The current organization data or null if no data is available.
 *   - {Function} refreshOrganization - Function to refresh the organization data.
 *   - {boolean} loading - Indicates if the organization data is currently being loaded.
 */
const useOrganization = () => {
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);

  const refreshOrganization = useCallback(() => {
    setLoading(true);
    getOrganization()
      .then((res) => {
        if (res.status === 204) {
          setOrganization({ id: -1, status: "No Organization Found" });
        } else if (res.status === 200) {
          // console.log("Organization Data:", res.data);
          setOrganization(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refreshOrganization();
  }, [refreshOrganization]);

  return [organization, refreshOrganization, loading];
};

export default useOrganization;
