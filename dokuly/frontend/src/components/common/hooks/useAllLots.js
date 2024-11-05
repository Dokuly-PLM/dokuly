import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getAllLots } from "../queries";

/**
 * Custom hook for fetching and refreshing all lot data on demand.
 * @returns {Array} An array containing:
 * - {Object|null} lots - The current lot data or null if no data is available.
 * - {Function} refreshLots - Function to refresh the lot data.
 * - {boolean} loadingLots - Indicates if the lot data is currently being loaded.
 */

const useAllLots = () => {
  const [loadingLots, setLoading] = useState(true);
  const [lots, setLots] = useState(null);

  const refreshLots = useCallback(() => {
    setLoading(true);
    getAllLots()
      .then((res) => {
        if (res.status === 204) {
          setLots({ id: -1, status: "No lots found" });
        } else if (res.status === 200) {
          setLots(res.data);
        }
      })
      .catch((err) => {
        toast.error("Failed to fetch lots.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refreshLots();
  }, [refreshLots]);

  return [lots, refreshLots, loadingLots];
};

export default useAllLots;
