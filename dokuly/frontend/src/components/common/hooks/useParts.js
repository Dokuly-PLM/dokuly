import { useState, useEffect } from "react";
import { getPartsTable } from "../../parts/functions/queries";

/**
 * A custom hook for fetching, caching, and refreshing parts.
 * It loads parts from localStorage for immediate rendering, but also fetches from
 * the server to ensure data is up to date, caching new data again.
 *
 * This hook fetches the latest revisions, as used in the parts table.
 *
 * @return {Array} A stateful value (parts) and a function to manually refresh the parts.
 */
function useParts() {
  const [parts, setParts] = useState([]);

  // Function to fetch parts and handle caching
  const fetchAndCacheParts = async () => {
    try {
      const res = await getPartsTable();
      setParts(res.data);
      localStorage.setItem("parts", JSON.stringify(res.data)); // Cache the parts in localStorage
    } catch (error) {
      console.error("Failed to fetch parts:", error);
      // On fetch error, use any existing data in local storage as a fallback
      fetchFromLocalStorage();
    }
  };

  // Function to fetch parts from local storage
  const fetchFromLocalStorage = () => {
    try {
      const storedParts = localStorage.getItem("parts");
      if (storedParts) {
        setParts(JSON.parse(storedParts)); // Attempt to parse the stored JSON
      }
    } catch (error) {
      console.error("Error parsing parts from localStorage:", error);
      localStorage.removeItem("parts"); // Remove corrupted data from localStorage
    }
  };

  // Fetch parts on mount
  useEffect(() => {
    const cachedParts = localStorage.getItem("parts");
    if (cachedParts) {
      try {
        setParts(JSON.parse(cachedParts)); // Attempt to parse the stored JSON for immediate use
      } catch (error) {
        console.error("Error parsing parts from localStorage on mount:", error);
        localStorage.removeItem("parts"); // Remove corrupted data from localStorage
      }
    }
    fetchAndCacheParts(); // Always fetch to ensure data is up to date
  }, []); // Empty dependency array means this effect runs once on mount

  return [parts, fetchAndCacheParts];
}

export default useParts;
