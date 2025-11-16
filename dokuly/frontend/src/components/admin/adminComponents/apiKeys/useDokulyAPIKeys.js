import { useEffect, useState } from "react";
import { fetchDokulyAPIKeys } from "../../functions/queries";

function useDokulyAPIKeys(orgId, setLoading, setIsAuthenticated, refresh) {
  const [dokulyAPIKeys, setDokulyAPIKeys] = useState([]);

  useEffect(() => {
    if (orgId) {
      setLoading(true);
      fetchDokulyAPIKeys(orgId)
        .then((res) => {
          if (res.status === 200) {
            setDokulyAPIKeys(res.data);
          } else {
            setDokulyAPIKeys([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching API keys:", err);
          if (err?.response) {
            setDokulyAPIKeys([]);
            if (err?.response.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [orgId, refresh, setLoading, setIsAuthenticated]); // Dependencies for useEffect

  return { dokulyAPIKeys };
}

export default useDokulyAPIKeys;
