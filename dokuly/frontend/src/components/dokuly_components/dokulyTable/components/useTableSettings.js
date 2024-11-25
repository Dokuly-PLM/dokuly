import { useState, useEffect } from "react";

const useTableSettings = (tableName) => {
  const [settings, setSettings] = useState(() => {
    // Retrieve initial settings from localStorage
    const storedSettings = localStorage.getItem("tables");
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      return parsedSettings[tableName] || {};
    }
    return {};
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const storedSettings = localStorage.getItem("tables");
    const allSettings = storedSettings ? JSON.parse(storedSettings) : {};
    allSettings[tableName] = settings;
    localStorage.setItem("tables", JSON.stringify(allSettings));
  }, [tableName, settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return [settings, updateSetting];
};

export default useTableSettings;