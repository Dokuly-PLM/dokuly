import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { fetchLocations } from "../../parts/functions/queries";

/**
 * Custom hook for fetching and refreshing location data.
 * @param {string} app - The app for which to fetch locations.
 * @param {string} dbObjectId - The id of the database object for which to fetch locations.
 * @returns {Array} An array containing:
 * - {Object|null} locations - The current location data or null if no data is available.
 * - {Function} refreshLocations - Function to refresh the location data.
 * - {boolean} loadingLocations - Indicates if the location data is currently being loaded.
 */
const useLocations = ({ setIsAuthenticated = () => {} }) => {
  const [loadingLocations, setLoading] = useState(true);
  const [locations, setLocations] = useState(null);

  const refreshLocations = useCallback(() => {
    setLoading(true);
    fetchLocations()
      .then((res) => {
        if (res.status === 204) {
          setLocations({ id: -1, status: "No Locations Found" });
        } else if (res.status === 200) {
          setLocations(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch locations.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refreshLocations();
  }, [refreshLocations]);

  return [locations, refreshLocations, loadingLocations];
};

export default useLocations;
