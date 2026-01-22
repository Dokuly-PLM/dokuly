import React, { useEffect, useState } from "react";

import {
  activateUserQ,
  getMaxAllowedActiveUsers,
} from "../../functions/queries";
import EditUserProfile from "./editUserProfile";
import PermissionDropdown from "./permissionDropdown";
import CreateNewUser from "./createNewUser";
import { Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import AddButton from "../../../dokuly_components/AddButton";

const UsersList = (props) => {
  const [refresh, setRefresh] = useState(-1);
  const [data, setData] = useState(
    props.data !== null && props.data !== undefined ? props.data : null
  );
  const [selectedUser, setSelectedUser] = useState({});
  const [open, setOpen] = useState(false);
  const [newUserFormOpen, setNewUserFormOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [formattedData, setFormattedData] = useState([]);
  const [maxAllowedUsers, setMaxAllowedUsers] = useState(
    props?.allowedUsers !== null && props?.allowedUsers !== undefined
      ? props.allowedUsers
      : null
  );

  const childToParent = (childData) => {
    if (childData === "Refresh") {
      props?.setRefresh(true);
    }
    if (childData === "Closed") {
      setSelectedUser({});
      setOpen(false);
    }
    if (childData === "Submitted") {
      setSelectedUser({});
      setOpen(false);
      setRefresh(1);
    }
    if (childData?.newData) {
      setRefresh(true);
      props?.setRefresh(true);
      setSelectedUser({});
      setOpen(false);
    }
  };

  const childToParentlvl2 = (childData) => {
    if (childData?.form !== null && childData?.form !== undefined) {
      if (childData?.data !== null && childData?.data !== undefined) {
        setData(childData.data);
        childToParent("Refresh");
      }
      setNewUserFormOpen(childData.form);
      setRefresh(true);
    }
  };
  const handleShowInactiveChange = (e) => {
    setShowInactive(e.target.checked);
  };

  const activateUser = (user) => {
    if (!checkActiveVsSubs(user)) {
      toast.info(
        "Cannot activate user, no subscriptions available, purchase more to activate user."
      );
      return;
    }
    const data = {
      user_id: user.user,
    };
    activateUserQ(data)
      .then((res) => {
        setData(res.data);
        childToParent("Refresh");
      })
      .catch((err) => {
        if (err.response.status === 404) {
          toast.error("Not found, check connection");
          return;
        }
        if (err.response.status === 401) {
          toast.error("Unauthorized");
          return;
        }
      })
      .finally(() => {
        setRefresh(true);
      });
  };

  const checkActiveVsSubs = (user) => {
    if (maxAllowedUsers === null || maxAllowedUsers === undefined) {
      return false;
    }
    if (user?.role !== "Viewer") {
      if (
        maxAllowedUsers?.allowed_active_users > maxAllowedUsers?.active_users
      ) {
        return true;
      }
    } else {
      if (
        maxAllowedUsers?.allowed_viewer_users > maxAllowedUsers?.viewer_users
      ) {
        return true;
      }
    }
    return false;
  };

  const checkUserCount = () => {
    if (maxAllowedUsers === null || maxAllowedUsers === undefined) {
      return false;
    }
    if (maxAllowedUsers?.allowed_active_users > maxAllowedUsers?.active_users) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (props?.data !== null && props?.data !== undefined) {
      setData(props.data);
      setRefresh(true);
    }
    if (props?.allowedUsers !== null && props?.allowedUsers !== undefined) {
      setMaxAllowedUsers(props?.allowedUsers);
    }
  }, [props]);

  useEffect(() => {
    if (maxAllowedUsers === null || maxAllowedUsers === undefined || refresh) {
      getMaxAllowedActiveUsers().then((res) => {
        setMaxAllowedUsers(res.data);
      });
    }
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (props?.data) {
      const enrichedData = props.data.map((user) => {
        // Determine the subscription type based on allowed apps
        const hasRequirements =
          user.allowed_apps && user.allowed_apps.includes("requirements");
        const subscriptionType =
          user.role === "Viewer"
            ? "Viewer"
            : hasRequirements
            ? "Dokuly Pro + Requirements"
            : "Dokuly Pro";
        return {
          ...user,
          subscriptionType,
        };
      });
      // Filter out inactive users if showInactive is false
      const filteredData = enrichedData.filter((user) => {
        return showInactive || user.is_active;
      });
      setFormattedData(filteredData);
    }
  }, [props.data, showInactive]);

  if (props.basicList) {
    return (
      <div className="m-2">
        <div>
          {formattedData !== undefined &&
          formattedData !== null &&
          formattedData?.length !== 0 ? (
            <ul className="list-group list-group-flush">
              {formattedData.map((user, index) => {
                if (user != null && user !== undefined) {
                  return (
                    <li className="list-group-item">
                      <div className="row">
                        <div className="col-md-auto">
                          {`${user.first_name} ${user.last_name}`}
                        </div>
                        <div className="col">{user.is_active}</div>
                        <div className="col">
                          <PermissionDropdown user={user} />
                        </div>
                      </div>
                    </li>
                  );
                }
              })}
            </ul>
          ) : (
            <div>No data</div>
          )}
        </div>
      </div>
    );
  }
  if (props.tableView) {
    const filterData = (data) => {
      if (!showInactive) {
        return data.filter((user) => user.is_active === true);
      }
      return data;
    };

    const permissionsFormatter = (row) => {
      if (row.is_active === false || row.is_active == null) {
        return <span style={{ color: "#D3D3D3" }}>Inactive</span>;
      }
      return <PermissionDropdown user={row} setRefresh={props?.setRefresh} />;
    };

    const emailFormatter = (row) => {
      let style = {
        color: "black",
      };
      if (row.is_active === false || row.is_active == null) {
        style = {
          color: "#D3D3D3",
        };
      }
      return <span style={style}>{row?.email}</span>;
    };

    const subscriptionFormatter = (row) => {
      let style = {
        color: row.is_active ? "black" : "#D3D3D3",
      };

      return <span style={style}>{row.subscriptionType}</span>;
    };

    const actionsFormatter = (row) => {
      const style = {
        cursor: "pointer",
      };
      if (row.is_active === false || row.is_active == null) {
        return (
          <button
            type="button"
            className="btn dokuly-btn-transparent"
            onClick={() => {
              setRefresh(true);
              if (props.setRefresh) {
                props.setRefresh(true);
              }
              setTimeout(() => {
                activateUser(row);
              }, 500);
            }}
          >
            Activate user
          </button>
        );
      }
      return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: No need for button here. Div works fine.
        <span
          style={style}
          className="btn dokuly-btn-transparent"
          onClick={() => {
            setSelectedUser(row);
            setOpen(true);
          }}
        >
          <img
            className="icon-tabler-dark"
            src="../../static/icons/edit.svg"
            alt="edit"
          />{" "}
          Edit user
        </span>
      );
    };

    const nameFormatter = (row) => {
      let style = {
        color: "black",
      };

      if (row.is_active === false || row.is_active == null) {
        style = {
          color: "#D3D3D3",
        };
      }
      return (
        <span
          style={style}
          data-toggle="tooltip"
          data-placement="top"
          title="This user is inactive!"
        >
          {`${row.first_name} ${row.last_name}`}
        </span>
      );
    };

    const columns = [
      {
        key: "name",
        header: "Employee",
        sort: true,
        formatter: nameFormatter,
        style: {
          minWidth: "10rem",
        },
      },
      {
        key: "username",
        header: "Username",
        sort: true,
        formatter: (row) => {
          let style = {
            color: "black",
            minWidth: "10rem",
          };
          if (row.is_active === false || row.is_active == null) {
            style = {
              color: "#D3D3D3",
              minWidth: "10rem",
            };
          }
          return <span style={style}>{row.username}</span>;
        },
      },

      {
        key: "email",
        header: "Email",
        formatter: emailFormatter,
        sort: true,
        style: {
          minWidth: "20rem",
        },
      },
      {
        key: "role",
        header: "Permissions",
        sort: true,
        style: {
          minWidth: "10rem",
        },
        formatter: permissionsFormatter,
      },
      {
        key: "is_active",
        header: "Actions",
        sort: true,
        style: {
          minWidth: "3rem",
        },
        formatterData: maxAllowedUsers,
        formatter: actionsFormatter,
      },
    ];

    return (
      <div className="m-2 justify-content-center">
        <div>
          <EditUserProfile
            user={selectedUser}
            loggedUser={props?.user}
            open={open}
            setOpen={setOpen}
            childToParent={childToParent}
            users={data}
            subscriptions={props?.subscriptions}
          />
        </div>
        {data !== null && data !== undefined && (
          <div style={{ paddingTop: "0.25rem" }}>
            <div className="row" style={{ margin: "0.4rem" }}>
              <Col className="col-8">
                <Row>
                  {checkUserCount() ? (
                    <CreateNewUser
                      users={data}
                      formOpen={newUserFormOpen}
                      childToParentlvl2={childToParentlvl2}
                      checkActiveVsSubs={checkUserCount}
                    />
                  ) : (
                    <AddButton
                      onClick={() => {
                        toast.error(
                          "Cannot add more users, no available subscriptions. Get more with the Add subscription button"
                        );
                      }}
                      buttonText="Add user"
                      className="mb-2 ml-3"
                      style={{
                        cursor: "not-allowed",
                        opacity: 0.5,
                      }}
                    />
                  )}
                </Row>
              </Col>
              <Col>
                <div>
                  <input
                    type="checkbox"
                    className="dokuly-checkbox"
                    checked={showInactive}
                    onChange={handleShowInactiveChange}
                  />
                  <label className="ml-1">Show Inactive Users</label>
                </div>
              </Col>
            </div>
            {!newUserFormOpen && (
              <DokulyTable
                columns={columns}
                data={filterData(formattedData)}
                showCsvDownload={false}
                showPagination={false}
                onRowClick={(rowIndex, row) => {}}
              />
            )}
          </div>
        )}
      </div>
    );
  }
  return <div>No proptype sent to specify list type.</div>;
};

export default UsersList;
