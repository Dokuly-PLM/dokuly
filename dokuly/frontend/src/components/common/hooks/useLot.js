import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getLot } from "../queries";

/**
 * Custom hook for fetching and refreshing a single lot data on demand.
 * @param {number} lotId - The lot ID for which to fetch lot data.
 * @returns {Array} An array containing:
 * - {Object|null} lot - The current lot data or null if no data is available.
 * - {Function} refreshLot - Function to refresh the lot data.
 * - {boolean} loadingLot - Indicates if the lot data is currently being loaded.
 */

const useLot = ({ lotId, setIsAuthenticated = () => {} }) => {
  const [loadingLot, setLoading] = useState(true);
  const [lot, setLot] = useState(null);

  const refreshLot = useCallback(() => {
    if (!lotId || lotId === -1) {
      return;
    }
    setLoading(true);
    getLot(lotId)
      .then((res) => {
        if (res.status === 204) {
          setLot({ id: -1, status: "No lot found" });
        } else if (res.status === 200) {
          setLot(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch lot.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lotId]);

  useEffect(() => {
    if (lotId) {
      refreshLot();
    }
  }, [refreshLot, lotId]);

  return [lot, refreshLot, loadingLot];
};

export default useLot;
