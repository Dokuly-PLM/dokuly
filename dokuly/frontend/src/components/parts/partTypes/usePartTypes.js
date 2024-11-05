import { useState, useEffect } from "react";
import { toast } from "react-toastify";

import { getPartTypes } from "../functions/queries";

export const usePartTypes = () => {
  const [partTypes, setPartTypes] = useState([]);

  useEffect(() => {
    const loadPartTypes = async () => {
      // Attempt to load part types from local storage
      const savedPartTypes = localStorage.getItem("partTypes");
      try {
        if (savedPartTypes) {
          setPartTypes(JSON.parse(savedPartTypes));
        }
      } catch (e) {
        localStorage.removeItem("partTypes"); // Delete corrupt data
      }

      // Fetch the latest part types from the server
      try {
        const res = await getPartTypes();
        if (res.status === 200) {
          setPartTypes(res.data);
          localStorage.setItem("partTypes", JSON.stringify(res.data)); // Update local storage
        } else {
          toast.error("Error fetching part types");
        }
      } catch (e) {
        toast.error("Error fetching part types");
      }
    };

    loadPartTypes();
  }, []);

  return partTypes;
};
