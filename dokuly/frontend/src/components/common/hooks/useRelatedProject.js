import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getRelatedProject } from "../queries";

const useRelatedProject = ({
  relatedObjectId,
  setIsAuthenticated = () => {},
}) => {
  const [loadingProject, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  const refreshProject = useCallback(() => {
    if (!relatedObjectId || relatedObjectId === -1) {
      return;
    }

    setLoading(true);
    getRelatedProject(relatedObjectId, app)
      .then((res) => {
        if (res.status === 204) {
          setProject({ id: -1, status: "No Project Found" });
        } else if (res.status === 200) {
          setProject(res.data);
        }
      })
      .catch((err) => {
        if (err?.response && err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          toast.error("Failed to fetch project.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [relatedObjectId]);

  useEffect(() => {
    if (relatedObjectId) {
      refreshProject();
    }
  }, [refreshProject, relatedObjectId]);

  return [project, refreshProject, loadingProject];
};

export default useRelatedProject;
