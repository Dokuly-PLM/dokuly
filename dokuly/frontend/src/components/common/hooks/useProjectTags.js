import { useState, useEffect } from "react";
import { fetchProjectTags } from "../../projects/functions/queries";

/**
 * A custom hook for fetching, caching, and refreshing project tags.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {number} params.projectId - The ID of the project to fetch tags for.
 * @param {boolean} params.readonly - If true, the hook will fetch data, if false, it will not fetch.
 * @returns {[Array, Function, boolean]} - An array containing project tags, a function to fetch and cache tags, and a loading state.
 */
const useProjectTags = ({ projectId, readonly = false }) => {
  // Updated here to include readonly
  const [projectTags, setTags] = useState([]);
  const [loadingProjectTags, setLoading] = useState(false); // State to track loading status

  // Function to fetch tags and handle caching
  const fetchAndCacheTags = async () => {
    if (readonly) return; // Skip fetching if readonly is false

    setLoading(true); // Set loading to true when the fetch starts
    try {
      const res = await fetchProjectTags(projectId);
      setTags(res.data);
      localStorage.setItem("tags", JSON.stringify(res.data));
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      // On fetch error, use any existing data in local storage as a fallback
      fetchFromLocalStorage();
    } finally {
      setLoading(false); // Set loading to false when fetch is complete
    }
  };

  // Function to fetch tags from local storage
  const fetchFromLocalStorage = () => {
    try {
      const storedTags = localStorage.getItem("tags");
      if (storedTags) {
        setTags(JSON.parse(storedTags));
      }
    } catch (error) {
      console.error("Error parsing tags from localStorage:", error);
      localStorage.removeItem("tags");
    }
  };

  // Fetch tags on mount
  useEffect(() => {
    if (
      readonly ||
      projectId === -1 ||
      projectId === null ||
      projectId === undefined
    ) {
      return;
    }

    const cachedTags = localStorage.getItem("tags");
    if (cachedTags) {
      try {
        setTags(JSON.parse(cachedTags)); // Load immediately from cache if available
      } catch (error) {
        console.error("Error parsing tags from localStorage on mount:", error);
        localStorage.removeItem("tags");
      }
    }
    fetchAndCacheTags(); // Fetch from server to ensure data is up to date
  }, [projectId, readonly]); // Re-run this effect if projectId or readonly changes

  return [projectTags, fetchAndCacheTags, loadingProjectTags];
};

export default useProjectTags;
