import React, { useState, useEffect, Fragment, useContext } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import AdminDocuments from "./adminPages/adminDocuments";
import AdminGeneral from "./adminPages/adminGeneral";
import AdminLocations from "./adminPages/adminLocations";
import AdminProjects from "./adminPages/adminProjects";
import AdminParts from "./adminPages/adminParts";
import AdminUsers from "./adminPages/adminUsers";
import { loadingSpinner } from "./functions/helperFunctions";
import { useLocation } from "react-router-dom";
import {
  fetchCustomers,
  fetchProjectsWithNumbers,
  fetchTestUser,
  fetchUserProfile,
  fetchUsers,
} from "./functions/queries";
import { verifyCheckoutSession } from "./functions/queries";
import AdminAPIKeys from "./adminPages/adminAPIKeys";
import { AuthContext } from "../App";
import AdminReleaseManagement from "./adminPages/adminReleaseManagement";
import AdminRules from "./adminPages/adminRules";

const AdminDash = () => {
  const [refresh, setRefresh] = useState(false);
  const [customers, setCustomers] = useState(null);
  const [projects, setProjects] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [locations, setLocations] = useState(null);
  const [locationTypes, setLocationsTypes] = useState(null);

  const [users, setUsers] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [success, setSuccess] = useState(false);
  const [testUser, setTestUser] = useState(null);
  const location = useLocation();

  const isRouteActive = (route) => location.pathname.includes(route);

  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    // Determine the active tab based on the current location
    const path = location.pathname;
    // Set the default active tab
    let newActiveTab = "";
    if (path.includes("/adminPage/users")) {
      newActiveTab = "users";
    } else if (path.includes("/adminPage/general")) {
      newActiveTab = "general";
    } else if (path.includes("/adminPage/projects")) {
      newActiveTab = "projects";
    } else if (path.includes("/adminPage/documents")) {
      newActiveTab = "documents";
    } else if (path.includes("/adminPage/parts")) {
      newActiveTab = "parts";
    } else if (path.includes("/adminPage/releaseManagement")) {
      newActiveTab = "releaseManagement";
    } else if (path.includes("/adminPage/locations")) {
      newActiveTab = "locations";
    } else if (path.includes("/adminPage/api")) {
      newActiveTab = "api";
    } else if (path.includes("/adminPage/rules")) {
      newActiveTab = "rules";
    } else if (path.includes("/adminPage/inventory")) {
      newActiveTab = "inventory";
    } else if (path.includes("/adminPage/archive")) {
      newActiveTab = "archive";
    } else {
      newActiveTab = "/adminPage/general";
    }

    setActiveTab(newActiveTab);
  }, [location]);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    navigate(`/adminPage/${tab}`);
  };

  const liftStateUp = (childData) => {
    if (childData?.newProjects) {
      if (childData?.newData !== null && childData?.newData !== undefined) {
        setProjects(childData?.data);
      } else {
        fetchProjectsWithNumbers()
          .then((res) => {
            setProjects(res.data);
          })
          .catch((err) => {
            if (err.response.status === 401) {
              setProjects(-1);

              setIsAuthenticated(false);
              toast.error("Unauthorized");
            }
          })
          .finally(() => {
            setRefresh(true);
          });
      }
    }
    if (childData?.newDocuments) {
      if (childData?.newData !== null && childData?.newData !== undefined) {
        setDocuments(childData.newData);
      }
    }
    if (childData?.newLocations) {
      if (childData?.newData !== null && childData?.newData !== undefined) {
        setLocations(childData.newData);
      }
    }
    if (childData?.newLocationsTypes) {
      if (childData?.newData !== null && childData?.newData !== undefined) {
        setLocationsTypes(childData.newData);
      }
    }
    setRefresh(true);
  };

  useEffect(() => {
    if (testUser == null || refresh) {
      fetchTestUser()
        .then((res) => {
          setTestUser(res.data.test_user);
        })
        .catch((err) => {
          toast.error("Error fetching testuser status");
        });
    }
    if (user == null || refresh) {
      fetchUserProfile()
        .then((res) => {
          if (res.status === 200) {
            setUser(res.data);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err.response.status === 401) {
              setIsAuthenticated(false);
            }
            if (err.response.status === 404) {
            }
          }
        })
        .finally(() => {});
    } else {
    }
    if (customers == null || refresh) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            setCustomers(-1);

            setIsAuthenticated(false);
            toast.error("Unauthorized");
          }
        })
        .finally(() => {});
    } else {
    }
    if (projects == null || refresh) {
      fetchProjectsWithNumbers()
        .then((res) => {
          setProjects(res.data);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            setProjects(-1);

            setIsAuthenticated(false);
            toast.error("Unauthorized");
          }
          if (err.response.status === 400) {
            setProjects([]);
          }
        })
        .finally(() => {});
    } else {
    }
    if (users == null || refresh) {
      fetchUsers()
        .then((res) => {
          setUsers(res.data);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            setUsers(-1);

            setIsAuthenticated(false);
            toast.error("Unauthorized");
          }
        })
        .finally(() => {});
    } else {
    }

    setRefresh(false);
  }, [refresh]);

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    const sessionID = query.get("session_id");
    const success = query.get("success");
    if (sessionID && success) {
      verifyCheckoutSession({ session_id: sessionID })
        .then((res) => {
          if (res.status === 200) {
            setSuccess(true);
            setSessionId(sessionID);
            // TODO: Update org and clean up url
          } else {
            setSuccess(false);
            setSessionId("");
          }
        })
        .catch((err) => {
          setSuccess(false);
          setSessionId("");
        });
    } else {
      setSuccess(false);
      setSessionId("");
    }
  }, [sessionId]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentSuccess = query.get("checkoutStatus");
    if (paymentSuccess) {
      if (paymentSuccess === "completed") {
        toast.success("Checkout already completed");
      } else if (paymentSuccess === "success") {
        toast.success("Checkout success, subscriptions updated");
      }
      query.delete("checkoutStatus");
      // Update the URL without causing a page reload
      const newUrl = `${window.location.protocol}//${window.location.host}${
        window.location.pathname
      }${query.toString()}${window.location.hash}`;
      window.history.replaceState({}, "", newUrl);
      setActiveTab("users");
    }
  }, []);

  useEffect(() => {
    document.title = `Admin Page | ${
      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
    }`;
  }, [activeTab]);

  return (
    <React.Fragment>
      {!refresh && (user?.role === "Admin" || user?.role === "Owner") ? (
        <div
          className="container-fluid mt-2 mainContainerWidth"
          style={{ paddingBottom: "1rem" }}
        >
          {}
          <div className="row justify-content-center">
            {/* <h1 style={{ marginTop: "1rem" }}>Administration</h1> */}
          </div>
          <div className="row justify-content-center">
            <nav>
              <div className="nav nav-tabs" id="nav-tab" role="tablist">
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "general" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("general")}
                >
                  General
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "users" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("users")}
                >
                  Users
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "projects" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("projects")}
                >
                  Projects
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "documents" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("documents")}
                >
                  Documents
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "parts" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("parts")}
                >
                  Parts
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "releaseManagement" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("releaseManagement")}
                >
                  Release Management
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "locations" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("locations")}
                >
                  Locations
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "api" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("api")}
                >
                  API keys
                </a>
                <a
                  style={{ cursor: "pointer" }}
                  className={`nav-item nav-link ${
                    activeTab === "rules" ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("rules")}
                >
                  Rules
                </a>
              </div>
            </nav>
          </div>
          <div className="tab-content" id="nav-tabContent">
            {activeTab === "general" && (
              <AdminGeneral
                user={user}
                users={users}
                customers={customers}
                projects={projects}
                liftStateUp={liftStateUp}
              />
            )}
            {activeTab === "users" && (
              <AdminUsers
                user={user}
                users={users}
                customers={customers}
                projects={projects}
                liftStateUp={liftStateUp}
              />
            )}

            {activeTab === "projects" && (
              <AdminProjects
                customers={customers}
                users={users}
                projects={projects}
                liftStateUp={liftStateUp}
                setRefresh={setRefresh}
              />
            )}
            {activeTab === "documents" && (
              <AdminDocuments
                liftStateUp={liftStateUp}
                documents={documents}
                users={users}
                customers={customers}
                projects={projects}
              />
            )}
            {activeTab === "parts" && <AdminParts setRefresh={setRefresh} />}
            {activeTab === "releaseManagement" && (
              <AdminReleaseManagement setRefresh={setRefresh} />
            )}
            {activeTab === "locations" && <AdminLocations />}
            {activeTab === "api" && <AdminAPIKeys />}
            {activeTab === "rules" && <AdminRules setRefresh={setRefresh} />}
          </div>
        </div>
      ) : { refresh } ? (
        loadingSpinner()
      ) : (
        <div>Not authorized, 401</div>
      )}
    </React.Fragment>
  );
};

export default AdminDash;
