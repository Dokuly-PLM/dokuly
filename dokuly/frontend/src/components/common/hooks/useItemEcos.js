import { useState, useEffect, useCallback } from "react";
import { getEcosForItem } from "../../eco/functions/queries";

/**
 * Custom hook to fetch ECOs for a specific item
 * 
 * @param {string} app - The app type ('parts', 'pcbas', 'assemblies', 'documents')
 * @param {number} itemId - The item ID
 * @returns {Object} { ecos, loading, error, refetch }
 */
const useItemEcos = (app, itemId) => {
  const [ecos, setEcos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEcos = useCallback(async () => {
    if (!app || !itemId) {
      setEcos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getEcosForItem(app, itemId);
      if (response.status === 200) {
        setEcos(response.data || []);
      } else {
        setEcos([]);
      }
    } catch (err) {
      console.error("Failed to fetch ECOs for item:", err);
      setError(err);
      setEcos([]);
    } finally {
      setLoading(false);
    }
  }, [app, itemId]);

  useEffect(() => {
    fetchEcos();
  }, [fetchEcos]);

  return { ecos, loading, error, refetch: fetchEcos };
};

export default useItemEcos;
