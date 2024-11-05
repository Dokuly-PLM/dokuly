import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getNotesTabs } from "../../dokuly_components/dokulyMarkdown/functions/queries";

/**
 * Custom hook for fetching and refreshing notes tab data.
 * @param {string} app - The app for which to fetch notes tabs.
 * @param {string} dbObjectId - The id of the database object for which to fetch notes tabs.
 * @returns {Array} An array containing:
 * - {Object|null} notesTabs - The current notes tab data or null if no data is available.
 * - {Function} refreshNotesTabs - Function to refresh the notes tab data.
 * - {boolean} loadingNotesTabs - Indicates if the notes tab data is currently being loaded.
 */
const useMarkdownTabs = ({
  app,
  dbObjectId,
  setIsAuthenticated = () => {},
}) => {
  const [loadingNotesTabs, setLoading] = useState(true);
  const [notesTabs, setNotesTabs] = useState(null);

  const refreshNotesTabs = useCallback(() => {
    if (!app || !dbObjectId || dbObjectId === -1) {
      return;
    }

    setLoading(true);
    getNotesTabs({ object_id: dbObjectId, app })
      .then((res) => {
        if (res.status === 204) {
          setNotesTabs({ id: -1, status: "No Notes Tabs Found" });
        } else if (res.status === 200) {
          setNotesTabs(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch notes tabs.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [app, dbObjectId]);

  useEffect(() => {
    if (dbObjectId) {
      refreshNotesTabs();
    }
  }, [refreshNotesTabs, dbObjectId]);

  return [notesTabs, refreshNotesTabs, loadingNotesTabs];
};

export default useMarkdownTabs;
