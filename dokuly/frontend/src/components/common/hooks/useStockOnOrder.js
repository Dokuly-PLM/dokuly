import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getStockOnOrder } from "../../dokuly_components/dokulyInventory/functions/queries";

/**
 * Custom hook to fetch on order stock for a given db object.
 * @param {string} app - The application context or identifier for which to fetch stock history, used to determine the relevant model.
 * @param {string} dbObjectId - The ID of the database object for which to fetch stock history. This should correspond to an entity in the specified 'app'.
 * @param {function} setIsAuthenticated - A function to update the authentication status, typically triggered by a 401 status code from backend responses.
 * @returns {Array} An array containing:
 *  - stockOnOrder: The stock on order for the given db object.
 *  - refreshStockOnOrder: A function that can be called to refresh the stock on order data.
 *  - loadingStockOnOrder: A boolean indicating whether the stock on order data is currently being fetched.
 */
const useStockOnOrder = ({
  app,
  dbObjectId,
  setIsAuthenticated = () => {},
}) => {
  const [loadingStockOnOrder, setLoading] = useState(true);
  const [stockOnOrder, setStockOnOrder] = useState(0);
  const [connectedPos, setConnectedPos] = useState([]);

  const refreshStockOnOrder = useCallback(() => {
    if (!app || !dbObjectId || dbObjectId === -1) {
      toast.error("Invalid parameters for fetching stock on order.");
      return;
    }

    setLoading(true);
    getStockOnOrder(dbObjectId, app)
      .then((res) => {
        if (res.status === 204) {
          setStockOnOrder(0);
          setConnectedPos([]);
        } else if (res.status === 200) {
          setStockOnOrder(res.data.on_order);
          setConnectedPos(res.data.connected_pos);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch stock on order.");
        }
      })
      .finally(() => setLoading(false));
  }, [app, dbObjectId]);

  useEffect(() => {
    refreshStockOnOrder();
  }, [refreshStockOnOrder, dbObjectId]);

  return [stockOnOrder, connectedPos, refreshStockOnOrder, loadingStockOnOrder];
};

export default useStockOnOrder;
