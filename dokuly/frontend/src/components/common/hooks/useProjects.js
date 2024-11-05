import { useState, useEffect } from "react";
import { fetchProjects } from "../../projects/functions/queries";

/**
 * A custom hook for fetching, caching, and refreshing projects.
 * It loads projects from localStorage for immediate rendering, but also fetches from
 * the server to ensure data is up to date, caching new data again.
 *
 * @return {Array} A stateful value (projects) and a function to manually refresh the projects.
 */
function useProjects() {
  const [projects, setProjects] = useState([]);

  // Function to fetch projects and handle caching
  const fetchAndCacheProjects = async () => {
    try {
      const res = await fetchProjects();
      setProjects(res.data);
      localStorage.setItem("projects", JSON.stringify(res.data)); // Cache the projects in localStorage
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      // On fetch error, use any existing data in local storage as a fallback
      fetchFromLocalStorage();
    }
  };

  // Function to fetch projects from local storage
  const fetchFromLocalStorage = () => {
    try {
      const storedProjects = localStorage.getItem("projects");
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects)); // Attempt to parse the stored JSON
      }
    } catch (error) {
      console.error("Error parsing projects from localStorage:", error);
      localStorage.removeItem("projects"); // Remove corrupted data from localStorage
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    const cachedProjects = localStorage.getItem("projects");
    if (cachedProjects) {
      try {
        setProjects(JSON.parse(cachedProjects)); // Attempt to parse the stored JSON for immediate use
      } catch (error) {
        console.error(
          "Error parsing projects from localStorage on mount:",
          error
        );
        localStorage.removeItem("projects"); // Remove corrupted data from localStorage
      }
    }
    fetchAndCacheProjects(); // Always fetch to ensure data is up to date
  }, []); // Empty dependency array means this effect runs once on mount

  return [projects, fetchAndCacheProjects];
}

export default useProjects;
