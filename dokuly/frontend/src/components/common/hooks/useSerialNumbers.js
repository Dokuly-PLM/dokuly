import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getLotSerialNumbers } from "../queries";

/**
 * Custom hook for fetching and refreshing a single lot's serial numbers data on demand.
 * @param {number} lotId - The lot ID for which to fetch serial numbers data.
 * @returns {Array} An array containing:
 * - {Object|null} serialNumbers - The current serial numbers data or null if no data is available.
 * - {Function} refreshSerialNumbers - Function to refresh the serial numbers data.
 * - {boolean} loadingSerialNumbers - Indicates if the serial numbers data is currently being loaded.
 */

const useSerialNumbers = ({ lotId, setIsAuthenticated = () => {} }) => {
  const [loadingSerialNumbers, setLoading] = useState(true);
  const [serialNumbers, setSerialNumbers] = useState(null);

  const refreshSerialNumbers = useCallback(() => {
    if (!lotId || lotId === -1) {
      return;
    }
    setLoading(true);
    getLotSerialNumbers(lotId)
      .then((res) => {
        if (res.status === 204) {
          setSerialNumbers({ id: -1, status: "No serial numbers found" });
        } else if (res.status === 200) {
          setSerialNumbers(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch serial numbers.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lotId]);

  useEffect(() => {
    if (lotId) {
      refreshSerialNumbers();
    }
  }, [refreshSerialNumbers, lotId]);

  return [serialNumbers, refreshSerialNumbers, loadingSerialNumbers];
};

export default useSerialNumbers;
