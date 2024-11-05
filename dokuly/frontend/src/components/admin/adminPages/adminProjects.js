import React, { useState, useEffect } from "react";
import ProjectList from "../adminComponents/projects/projectsList";
import {
  fetchCustomers,
  fetchProjects,
  fetchProjectsWithNumbers,
  fetchUsers,
} from "../functions/queries";
import ProjectAssignment from "../adminComponents/projects/projectAssignment";
import { threeCardSkeletonLoader4ColTableLeftInfoTableRight } from "../functions/helperFunctions";
import { useSpring, animated } from "react-spring";
import { toast } from "react-toastify";

const AdminProjects = (props) => {
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [loading3, setLoading3] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [projects, setProjects] = useState(
    props?.projects !== undefined && props?.projects !== null
      ? props?.projects
      : null,
  );
  const [selectedProject, setSelectedProject] = useState({});
  const [users, setUsers] = useState(
    props.users !== null && props.users !== undefined ? props.users : null,
  );
  const [customers, setCustomers] = useState(
    props.customers !== null && props.customers !== undefined
      ? props.customers
      : null,
  );

  useEffect(() => {
    if (props.projects !== null && props.projects !== undefined) {
      setProjects(props.projects);
    }
    if (refresh) {
      fetchProjectsWithNumbers().then((res) => {
        if (res.status === 200) {
          setProjects(res.data);
          const tempSelectedProjectID = selectedProject.id;

          setSelectedProject(
            res.data.find((project) => project.id === tempSelectedProjectID),
          );
        }
      });
    }
    if (projects == null) {
      fetchProjectsWithNumbers()
        .then((res) => {
          if (
            res?.projects !== null &&
            res?.projects !== undefined &&
            res?.projects !== "No data found"
          ) {
            setProjects(res.data);
            let ok = false;
            for (let i = 0; i < res.data.length; i++) {
              if (res.data[i].is_active === true) {
                setSelectedProject(res.data[i]);
                ok = true;
                break;
              }
            }
            if (!ok) {
              setSelectedProject({});
            }
          }
        })
        .catch((err) => {
          if (err.response.status === 400) {
            setProjects("No data found");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (
      selectedProject?.id === undefined ||
      selectedProject?.id == null
    ) {
      let ok = false;
      for (let i = 0; i < projects.length; i++) {
        if (projects[i].is_active === true) {
          setSelectedProject(projects[i]);
          ok = true;
          break;
        }
      }
      if (!ok) {
        setSelectedProject({});
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
    if (customers == null) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
        })
        .finally(() => {
          setLoading2(false);
        });
    } else {
      setLoading2(false);
    }
    if (users == null) {
      fetchUsers()
        .then((res) => {
          setUsers(res.data);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            setUsers(-1);
            toast.error("Unauthorized");
          }
        })
        .finally(() => {
          setLoading3(false);
        });
    } else {
      setLoading3(false);
    }
    setRefresh(false);
  }, [props, refresh]);

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  });

  if (loading || loading2 || loading3) {
    return threeCardSkeletonLoader4ColTableLeftInfoTableRight(12, spring);
  }

  return (
    <div>
      <div className="row">
        <ProjectList
          data={projects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          customers={customers}
          setRefresh={setRefresh}
          users={users}
        />
      </div>
    </div>
  );
};

export default AdminProjects;
