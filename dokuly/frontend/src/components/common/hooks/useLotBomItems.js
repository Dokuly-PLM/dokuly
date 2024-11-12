import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getLotBomItems } from "../queries";

/**
 * Custom hook for fetching and refreshing lot bom items data on demand.
 * @param {number} dbObjectId - The object id connected to the lot.
 * @param {string} app - The type of object connected to the lot.
 * @returns {Array} An array containing:
 * - {Array} lotBomItems - The current lot bom items data.
 * - {string} app - The type of object connected to the lot.
 * - {Function} refreshLotBomItems - Function to refresh the lot bom items data.
 * - {boolean} loadingLotBomItems - Indicates if the lot bom items data is currently being loaded.
 */
const useLotBomItems = ({ lotId }) => {
  const [loadingLotBomItems, setLoading] = useState(true);
  const [lotBomItems, setLotBomItems] = useState([]);
  const [app, setApp] = useState(null);

  const refreshLotBomItems = useCallback(() => {
    if (!lotId || lotId === -1) {
      return;
    }
    setLoading(true);
    getLotBomItems(lotId)
      .then((res) => {
        if (res.status === 204) {
          setLotBomItems([]);
        } else if (res.status === 200) {
          // Exclude items where is_mounted is explicitly false
          const filteredItems = res.data.bom.filter(item => item.is_mounted !== false);
          setLotBomItems(filteredItems);
          setApp(res.data.app);
        }
      })
      .catch((err) => {
        toast.error("Failed to fetch lot bom items.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lotId]);

  useEffect(() => {
    if (lotId) {
      refreshLotBomItems();
    }
  }, [refreshLotBomItems, lotId]);

  return [lotBomItems, app, refreshLotBomItems, loadingLotBomItems];
};

export default useLotBomItems;
