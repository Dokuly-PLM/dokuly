import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getIssue } from "../../dokuly_components/dokulyIssues/functions/queries";

const useIssue = ({ id, setIsAuthenticated = () => {} }) => {
  const [loadingIssue, setLoading] = useState(true);
  const [issue, setIssue] = useState(null);

  const refreshIssue = useCallback(() => {
    if (!id || id === -1) {
      return;
    }

    setLoading(true);
    getIssue(id)
      .then((res) => {
        if (res.status === 204) {
          setIssue({ id: -1, status: "No Issue Found" });
        } else if (res.status === 200) {
          setIssue(res?.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch issue.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (id) {
      refreshIssue();
    }
  }, [refreshIssue, id]);

  return [issue, refreshIssue, loadingIssue];
};

export default useIssue;
