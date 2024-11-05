import { useState, useEffect } from "react";
import { fetchCustomers } from "../../customers/funcitons/queries";

/**
 * A custom hook for fetching, caching, and refreshing customers.
 * It loads customers from localStorage for immediate rendering, but also fetches from
 * the server to ensure data is up to date, caching new data again.
 *
 * @return {Array} A stateful value (customers) and a function to manually refresh the customers.
 */
function useCustomers() {
  const [customers, setCustomers] = useState([]);

  // Function to fetch customers and handle caching
  const fetchAndCacheCustomers = async () => {
    try {
      const res = await fetchCustomers();
      setCustomers(res.data);
      localStorage.setItem("customers", JSON.stringify(res.data)); // Cache the customers in localStorage
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      // On fetch error, use any existing data in local storage as a fallback
      fetchFromLocalStorage();
    }
  };

  // Function to fetch customers from local storage
  const fetchFromLocalStorage = () => {
    try {
      const storedCustomers = localStorage.getItem("customers");
      if (storedCustomers) {
        setCustomers(JSON.parse(storedCustomers)); // Attempt to parse the stored JSON
      }
    } catch (error) {
      console.error("Error parsing customers from localStorage:", error);
      localStorage.removeItem("customers"); // Remove corrupted data from localStorage
    }
  };

  // Fetch customers on mount
  useEffect(() => {
    const cachedCustomers = localStorage.getItem("customers");
    if (cachedCustomers) {
      try {
        setCustomers(JSON.parse(cachedCustomers)); // Attempt to parse the stored JSON for immediate use
      } catch (error) {
        console.error(
          "Error parsing customers from localStorage on mount:",
          error
        );
        localStorage.removeItem("customers"); // Remove corrupted data from localStorage
      }
    }
    fetchAndCacheCustomers(); // Always fetch to ensure data is up to date
  }, []); // Empty dependency array means this effect runs once on mount

  return [customers, fetchAndCacheCustomers];
}

export default useCustomers;
