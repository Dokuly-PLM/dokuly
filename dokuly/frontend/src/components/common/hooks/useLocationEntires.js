import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getLocationEntires } from "../../dokuly_components/dokulyInventory/functions/queries";

/**
 * Custom hook for fetching and refreshing location data.
 * @param {string} app - The app for which to fetch locations.
 * @param {string} dbObjectId - The id of the database object for which to fetch locations.
 * @returns {Array} An array containing:
 * - locationEntires: The fetched location entries.
 * - refreshLocationData: A function to refresh the location data.
 * - loadingLocationEntires: A boolean indicating whether the location data is being fetched
 *
 */
const useLocationEntires = ({
  app,
  dbObjectId,
  setIsAuthenticated = () => {},
}) => {
  const [loadingLocationEntires, setLoading] = useState(true);
  const [locationEntires, setLocationEntires] = useState(null);

  const refreshLocationData = useCallback(() => {
    if (!app || !dbObjectId || dbObjectId === -1) {
      return;
    }

    setLoading(true);
    getLocationEntires(dbObjectId, app)
      .then((res) => {
        if (res.status === 204) {
          setLocationEntires({ id: -1, status: "No Locations Found" });
        } else if (res.status === 200) {
          setLocationEntires(res.data);
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
  }, [app, dbObjectId]);

  useEffect(() => {
    if (dbObjectId) {
      refreshLocationData();
    }
  }, [refreshLocationData, dbObjectId]);

  return [locationEntires, refreshLocationData, loadingLocationEntires];
};

export default useLocationEntires;
