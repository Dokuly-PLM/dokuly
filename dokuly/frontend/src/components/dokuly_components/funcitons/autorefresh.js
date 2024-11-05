import React, { useState, useEffect, useCallback } from "react";

const AutoRefresh = ({ setRefresh }) => {
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    // Function to check inactivity and set refresh
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

      if (timeSinceLastActivity >= thirtyMinutes) {
        setRefresh(true);
      }
    };

    // Set up the interval to check inactivity
    const intervalId = setInterval(checkInactivity, 1000 * 60); // check every minute

    // Set up event listeners for user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("click", handleActivity);

    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [lastActivity, setRefresh]);

  // The component does not render anything itself
  return null;
};

export default AutoRefresh;
