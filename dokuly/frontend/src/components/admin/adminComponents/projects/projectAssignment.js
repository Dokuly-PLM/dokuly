import React, { useState, useEffect } from "react";

import {
  addUserToProject,
  removeUserFromProject,
} from "../../../projects/functions/queries";
import { toast } from "react-toastify";

const ProjectAssignment = (props) => {
  useEffect(() => {
    loadStates(props);
  }, [props.users, props.selectedProject]);

  const loadStates = (props) => {
    setUsers(
      props.users !== (null || undefined) &&
        filterUsers(props?.users, props?.selectedProject, false)
    );
    setCurrentAssignees(
      filterUsersInProject(props?.users, props?.selectedProject)
    );
  };

  const filterUsersInProject = (users, project) => {
    if (!users || !project) return [];
    return users
      ?.filter((user) => {
        project?.project_members?.includes(user.id);
      })
      .sort((a, b) => a.first_name.localeCompare(b.first_name));
  };

  const filterUsers = (users, project, isAssignee) => {
    if (!users || !project) return [];

    const projectMemberIds =
      project?.project_members?.map((member) => parseInt(member)) ?? [];
    return users
      ?.filter((user) => {
        const isMember = projectMemberIds.includes(user.id);
        return isAssignee ? isMember : !isMember && user.is_active;
      })
      .sort((a, b) => a.first_name.localeCompare(b.first_name));
  };

  const [users, setUsers] = useState(() =>
    filterUsers(props.users, props.selectedProject, false)
  );
  const [currentAssignees, setCurrentAssignees] = useState(() =>
    filterUsers(props.users, props.selectedProject, true)
  );

  const removeFromProject = (user, project) => {
    removeUserFromProject(project.id, user.id).then((res) => {
      if (res.status === 200) {
        toast.success("User removed from project");
        props.setSelectedProject(res.data);
      }
    });
  };

  const assignToProject = (user, project) => {
    addUserToProject(project.id, user.id).then((res) => {
      if (res.status === 200) {
        toast.success("User assigned to project");
        props.setSelectedProject(res.data);
      }
    });
  };

  if (props?.selectedProject == null) {
    return (
      <div className="card-body bg-white m-3 card rounded shadow">
        No Project Selected
      </div>
    );
  }

  return (
    <div className="card-body bg-white m-3 card rounded">
      <h5>
        <b>Selected Project Assignees Management</b>
      </h5>
      <div
        className="row"
        style={{ marginTop: "0.9rem", marginLeft: "0.5rem" }}
      >
        <div className="col-md-auto" style={{ marginRight: "1rem" }}>
          <h6>Available Users:</h6>
          <div>
            {users.length > 0 ? (
              <ul
                className="list-group list-group-flush"
                style={{ width: "fit-content", maxWidth: "26rem" }}
              >
                {users.map((user) => (
                  <li className="list-group-item" key={user.id}>
                    <div className="row">
                      <div className="col">
                        {`${user.first_name} ${user.last_name}`}
                      </div>
                      <div className="col-md-auto">
                        <button
                          className="btn btn-sm dokuly-btn-primary"
                          onClick={() =>
                            assignToProject(user, props.selectedProject)
                          }
                        >
                          Assign User
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div>No Available Users</div>
            )}
          </div>
        </div>
        <div className="col-md-auto">
          <h6>Current Project Assignees:</h6>
          {currentAssignees.length > 0 ? (
            <ul
              className="list-group list-group-flush"
              style={{ width: "fit-content", maxWidth: "26rem" }}
            >
              {currentAssignees.map((user) => (
                <li className="list-group-item" key={user.id}>
                  <div className="row">
                    <div className="col-md-auto">
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() =>
                          removeFromProject(user, props.selectedProject)
                        }
                      >
                        Remove Assignee
                      </button>
                    </div>
                    <div className="col">
                      {`${user.first_name} ${user.last_name}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>No Current Assignees</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectAssignment;
