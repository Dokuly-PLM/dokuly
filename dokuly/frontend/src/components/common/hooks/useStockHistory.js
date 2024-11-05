import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getStockHistory } from "../../dokuly_components/dokulyInventory/functions/queries";

/**
 * Custom hook for fetching and refreshing stock history data related to a specific database object and date range.
 * This hook also fetches the initial stock level before the specified start date to provide a comprehensive view of stock changes.
 *
 * @param {string} app - The application context or identifier for which to fetch stock history, used to determine the relevant model.
 * @param {string} dbObjectId - The ID of the database object for which to fetch stock history. This should correspond to an entity in the specified 'app'.
 * @param {string} fromDate - The ISO string representing the start date for the stock history query. Only entries on or after this date are fetched.
 * @param {string} toDate - The ISO string representing the end date for the stock history query. Only entries up to and including this date are fetched.
 * @param {function} setIsAuthenticated - A function to update the authentication status, typically triggered by a 401 status code from backend responses.
 *
 * @returns {Array} An array containing:
 *   - stockHistory: An array of stock history entries fetched for the given parameters.
 *   - initialStockLevel: The cumulative stock level calculated up to but not including the 'fromDate'. This helps establish a baseline for the given period.
 *   - refreshStockHistory: A function that can be called to refresh the stock history data based on the current or updated parameters.
 *   - loadingStockHistory: A boolean indicating whether the stock history data is currently being fetched.
 */

const useStockHistory = ({
  app,
  dbObjectId,
  fromDate,
  toDate,
  setIsAuthenticated = () => {},
}) => {
  const [loadingStockHistory, setLoading] = useState(true);
  const [stockHistory, setStockHistory] = useState([]);
  const [initialStockLevel, setInitialStockLevel] = useState(0);

  const refreshStockHistory = useCallback(() => {
    if (!app || !dbObjectId || dbObjectId === -1) {
      toast.error("Invalid parameters for fetching stock history.");
      return;
    }

    if (!fromDate || !toDate) {
      toast.error("Please select a valid date range.");
      return;
    }

    setLoading(true);
    getStockHistory(dbObjectId, app, fromDate, toDate)
      .then((res) => {
        if (res.status === 204) {
          setStockHistory([]);
          setInitialStockLevel(0);
        } else if (res.status === 200) {
          setStockHistory(res.data.history);
          setInitialStockLevel(res.data.initial_stock_level);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch stock history.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [app, dbObjectId, fromDate, toDate]);

  useEffect(() => {
    if (dbObjectId) {
      refreshStockHistory();
    }
  }, [refreshStockHistory, dbObjectId, fromDate, toDate]);

  return [
    stockHistory,
    initialStockLevel,
    refreshStockHistory,
    loadingStockHistory,
  ];
};

export default useStockHistory;
