import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getConnectedLotPos } from "../queries";

/**
 * Custom hook for fetching and refreshing a single lot procurement data on demand.
 * @param {number} lotId - The lot ID for which to fetch lot procurement data.
 * @returns {Array} An array containing:
 * - {Object|null} lotPos - The current lot procurement data or null if no data is available.
 * - {Function} refreshLotPos - Function to refresh the lot procurement data.
 * - {boolean} loadingLotPos - Indicates if the lot procurement data is currently being loaded.
 */

const useLotPos = ({ lotId, setIsAuthenticated = () => {} }) => {
  const [loadingLotPos, setLoading] = useState(true);
  const [lotPos, setLotPos] = useState(null);

  const refreshLotPos = useCallback(() => {
    if (!lotId || lotId === -1) {
      return;
    }
    setLoading(true);
    getConnectedLotPos(lotId)
      .then((res) => {
        if (res.status === 204) {
          setLotPos({ id: -1, status: "No lot procurement found" });
        } else if (res.status === 200) {
          setLotPos(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch lot procurement.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lotId]);

  useEffect(() => {
    if (lotId) {
      refreshLotPos();
    }
  }, [refreshLotPos, lotId]);

  return [lotPos, refreshLotPos, loadingLotPos];
};

export default useLotPos;
