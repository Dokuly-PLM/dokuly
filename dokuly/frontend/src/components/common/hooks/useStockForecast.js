import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getStockForecast } from "../../dokuly_components/dokulyInventory/functions/queries";

/**
 * Custom hook to fetch stock forecast data.
 * @param {Object} app - The app object.
 * @param {number} dbObjectId - The database object ID.
 * @param {string} toDate - The end date for the forecast.
 *
 * @returns {Array} - The stock forecast data, loading state, and refresh function.
 */

const useStockForecast = ({ app, dbObjectId, toDate }) => {
  const [loadingStockForecast, setLoading] = useState(true);
  const [stockForecast, setStockForecast] = useState([]);

  const refreshStockForecast = useCallback(() => {
    if (!app || !dbObjectId || dbObjectId === -1) {
      toast.error("Invalid parameters for fetching stock forecast.");
      return;
    }

    if (!toDate) {
      toast.error("Please select a valid date range.");
      return;
    }

    setLoading(true);
    getStockForecast(dbObjectId, app, toDate)
      .then((res) => {
        if (res.status === 204) {
          setStockForecast([]);
        } else if (res.status === 200) {
          setStockForecast(res.data ?? []);
        }
      })
      .catch((err) => {
        toast.error("Failed to fetch stock forecast.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [app, dbObjectId, toDate]);

  useEffect(() => {
    if (dbObjectId) {
      refreshStockForecast();
    }
  }, [dbObjectId, refreshStockForecast, toDate]);

  return [stockForecast, loadingStockForecast, refreshStockForecast];
};

export default useStockForecast;
