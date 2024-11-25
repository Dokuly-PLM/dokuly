import { useState, useEffect } from "react";

const useTableSettings = (tableName) => {
  const [settings, setSettings] = useState(() => {
    try {
      // Retrieve initial settings from localStorage
      const storedSettings = localStorage.getItem("tables");
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings && typeof parsedSettings === "object") {
          return parsedSettings[tableName] || {};
        }
      }
    } catch (error) {
      console.error("Failed to parse table settings. Resetting localStorage:", error);
      localStorage.removeItem("tables"); // Remove corrupt data
    }
    return {}; // Return default settings
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem("tables");
      const allSettings = storedSettings ? JSON.parse(storedSettings) : {};
      allSettings[tableName] = settings;
      localStorage.setItem("tables", JSON.stringify(allSettings));
    } catch (error) {
      console.error("Failed to save table settings to localStorage:", error);
      localStorage.removeItem("tables"); // Remove corrupt data
    }
  }, [tableName, settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return [settings, updateSetting];
};

export default useTableSettings;
