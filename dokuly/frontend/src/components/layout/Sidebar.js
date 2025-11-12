import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { getUser } from "./queries";
import { fetchOrg, fetchTestUser } from "../admin/functions/queries";
import { set } from "react-ga";

const Sidebar = (props) => {
  const [isAuthenticated, setisAuthenticated] = useState(false);
  const [isAdmin, setisAdmin] = useState(false);
  const [innerWidth, setInnerWidth] = useState(1300);
  const [testUser, setTestUser] = useState(false);
  const [allowedApps, setAllowedApps] = useState([]);

  const widthWhereTextDisappears = 1610;

  const location = useLocation();

  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    // Check if organization data is in local storage
    const storedOrg = localStorage.getItem("organization");
    if (storedOrg) {
      // If found, parse it from string to JSON and set it to state
      try {
        setOrganization(JSON.parse(storedOrg));
      } catch (e) {
        localStorage.removeItem("organization");
      }
    }
    // If not found in local storage, fetch the data
    fetchOrg().then((res) => {
      if (res.status === 204) {
        setOrganization(null);
      }
      if (res.status === 200) {
        // Store fetched organization data in local storage
        localStorage.setItem("organization", JSON.stringify(res.data));
        setOrganization(res.data);
      }
    });
  }, []);

  useEffect(() => {
    getUser().then((res) => {
      res.data.role === "Admin" ||
      res.data.role === "Super Admin" || // Is this a real role?
      (res.data.role === "Owner" && res.data.is_active === true)
        ? setisAdmin(true)
        : setisAdmin(false);
      res.data.is_active === true
        ? setisAuthenticated(true)
        : setisAuthenticated(false);
      setAllowedApps(res.data.allowed_apps);
    });

    fetchTestUser().then((res) => {
      if (res !== undefined) {
        setTestUser(res.data.test_user);
      }
    });

    location.pathname === "/login"
      ? (setisAdmin(false), setisAuthenticated(false))
      : "";
  }, [location.pathname]);

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setInnerWidth(window.innerWidth);
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  const isAppAllowed = (appName) => {
    return allowedApps.includes(appName);
  };

  const loadAdminPages = () => {
    return (
      <li
        className={`nav-item mt-2 ${
          location.pathname.startsWith("/timeReport") ? "nav-item-active" : ""
        }`}
        key={"Time report"}
      >
        <Link to="/timeReport" className="nav-link ">
          <img
            src="../../static/icons/chart-bar.svg"
            alt="chart"
            style={{
              filter:
                "invert(44%) sepia(31%) saturate(936%) hue-rotate(157deg) brightness(93%) contrast(83%)",
            }}
          />
          {innerWidth > widthWhereTextDisappears ? "Time report" : ""}
        </Link>
      </li>
    );
  };

  const navLinks = (
    <ul className="nav flex-column mt-5">
      {isAdmin && (
        <li
          className={`nav-item ${
            location.pathname.startsWith("/adminPage") ? "nav-item-active" : ""
          }`}
          key={"Administration"}
        >
          <Link to="/adminPage/general" className="nav-link ">
            <img
              src="../../static/icons/database.svg"
              width="22px"
              alt="database"
            />
            {innerWidth > widthWhereTextDisappears ? "Administration" : ""}
          </Link>
        </li>
      )}

      {organization?.time_tracking_is_enabled === true &&
        isAppAllowed("timesheet") && (
          <li
            className={`nav-item ${
              location.pathname === "/" || location.pathname === "/timesheet"
                ? "nav-item-active"
                : ""
            }`}
            key={"Timesheet"}
            style={
              !isAdmin
                ? { marginTop: "2rem", borderTop: "1px solid grey" }
                : { marginTop: "0.25rem", borderTop: "1px solid grey" }
            }
          >
            <span data-feather="home" />
            <Link to="/timesheet" className="nav-link ">
              <img
                src="../../static/icons/clock.svg"
                alt="clock"
                style={{
                  filter:
                    "invert(44%) sepia(31%) saturate(936%) hue-rotate(157deg) brightness(93%) contrast(83%)",
                }}
              />
              {innerWidth > widthWhereTextDisappears ? "Timesheet" : ""}
            </Link>
          </li>
        )}
      {organization?.time_tracking_is_enabled === true &&
        isAppAllowed("timesheet") &&
        loadAdminPages()}

      {isAppAllowed("customers") && (
        <li
          className={`nav-item mt-2 ${
            location.pathname.startsWith("/customers") ? "nav-item-active" : ""
          }`}
          key={"Customers"}
          style={{ borderTop: "1px solid grey" }}
        >
          <span data-feather="home" />
          <Link to="/customers" className="nav-link ">
            <img
              src="../../static/icons/friends.svg"
              alt="people"
              style={{
                filter:
                  "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)",
              }}
            />
            {innerWidth > widthWhereTextDisappears ? "Customers" : ""}
          </Link>
        </li>
      )}
      {isAppAllowed("projects") && (
        <li
          className={`nav-item ${
            location.pathname.startsWith("/projects") ? "nav-item-active" : ""
          }`}
          key={"Projects"}
        >
          <Link to="/projects" className="nav-link ">
            <img
              src="../../static/icons/briefcase.svg"
              alt="briefcase"
              style={{
                filter:
                  "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)",
              }}
            />{" "}
            {innerWidth > widthWhereTextDisappears ? "Projects" : ""}
          </Link>
        </li>
      )}
      {organization?.requirement_is_enabled === true &&
        isAppAllowed("requirements") && (
          <li
            className={`nav-item ${
              location.pathname.startsWith("/requirement")
                ? "nav-item-active"
                : ""
            }`}
            key={"Requirements"}
          >
            <Link to="/requirements" className="nav-link ">
              <img
                src="../../static/icons/clipboard-check.svg"
                alt="briefcase"
                width={22}
                style={{
                  marginRight: "5px",
                  filter:
                    "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)",
                }}
              />
              {innerWidth > widthWhereTextDisappears ? "Requirements" : ""}
            </Link>
          </li>
        )}
      {organization?.document_is_enabled === true &&
        isAppAllowed("documents") && (
          <li
            className={`nav-item ${
              location.pathname.startsWith("/documents")
                ? "nav-item-active"
                : ""
            }`}
            key={"Documents"}
            style={{ borderTop: "1px solid grey" }}
          >
            <span data-feather="home" />
            <Link to="/documents" className="nav-link ">
              <img
                src="../../static/icons/file.svg"
                alt="file"
                style={{
                  filter:
                    "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)",
                }}
              />
              {innerWidth > widthWhereTextDisappears ? "Documents" : ""}
            </Link>
          </li>
        )}
      {isAppAllowed("parts") && (
        <li
          className={`nav-item ${
            location.pathname.startsWith("/parts") ? "nav-item-active" : ""
          }`}
          key={"Parts"}
          style={{ borderTop: "1px solid grey" }}
        >
          <Link to="/parts" className="nav-link ">
            <img
              src="../../static/icons/puzzle.svg"
              alt="jigsaw-piece"
              style={{
                filter:
                  "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)",
              }}
            />
            {innerWidth > widthWhereTextDisappears ? "Parts" : ""}
          </Link>
        </li>
      )}
      {organization?.assembly_is_enabled === true &&
        isAppAllowed("assemblies") && (
          <li
            className={`nav-item ${
              location.pathname.startsWith("/assemblies")
                ? "nav-item-active"
                : ""
            }`}
            key={"Asseemblies"}
          >
            <Link to="/assemblies" className="nav-link ">
              <img
                src="../../static/icons/assembly.svg"
                alt="assembly"
                style={{
                  filter:
                    "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)",
                }}
              />
              {innerWidth > widthWhereTextDisappears ? "Assemblies" : ""}
            </Link>
          </li>
        )}

      {organization?.pcba_is_enabled === true && isAppAllowed("pcbas") && (
        <li
          className={`nav-item ${
            location.pathname.startsWith("/pcbas") ? "nav-item-active" : ""
          }`}
          key={"PCBA"}
        >
          <Link to="/pcbas" className="nav-link ">
            <img
              src="../../static/icons/pcb.svg"
              alt="PCB"
              style={{
                filter:
                  "invert(27%) sepia(23%) saturate(4376%) hue-rotate(312deg) brightness(95%) contrast(94%)",
              }}
            />
            {innerWidth > widthWhereTextDisappears ? "PCBA" : ""}
          </Link>
        </li>
      )}

      {organization?.procurement_is_enabled === true &&
        isAppAllowed("procurement") && (
          <li
            className={`nav-item ${
              location.pathname.startsWith("/suppliers")
                ? "nav-item-active"
                : ""
            }`}
            key={"Suppliers"}
          >
            <Link
              to="/suppliers"
              className="nav-link "
              style={{ borderTop: "1px solid grey" }}
            >
              <img
                src="../../static/icons/factory.svg"
                alt="factory"
                style={{
                  filter:
                    "invert(25%) sepia(48%) saturate(4078%) hue-rotate(289deg) brightness(91%) contrast(93%)",
                }}
              />
              {innerWidth > widthWhereTextDisappears ? "Suppliers" : ""}
            </Link>
          </li>
        )}

      {organization?.procurement_is_enabled === true &&
        isAppAllowed("procurement") && (
          <li
            className={`nav-item ${
              location.pathname.startsWith("/procurement")
                ? "nav-item-active"
                : ""
            }`}
            key={"Purchasing"}
          >
            <Link to="/procurement" className="nav-link ">
              <img
                src="../../static/icons/shopping-cart.svg"
                alt="shopping-cart"
                style={{
                  filter:
                    "invert(25%) sepia(48%) saturate(4078%) hue-rotate(289deg) brightness(91%) contrast(93%)",
                }}
              />
              {innerWidth > widthWhereTextDisappears ? "Procurement" : ""}
            </Link>
          </li>
        )}

      {organization?.production_is_enabled === true &&
        isAppAllowed("production") && (
          <li
            className={`nav-item ${
              location.pathname.startsWith("/production") ? "nav-item-active" : ""
            }`}
            key={"Production"}
          >
            <Link to="/production" className="nav-link ">
              <img
                src="../../static/icons/box.svg"
                alt="boxes"
                style={{
                  filter:
                    "invert(25%) sepia(48%) saturate(4078%) hue-rotate(289deg) brightness(91%) contrast(93%)",
                }}
              />
              {innerWidth > widthWhereTextDisappears ? "Production" : ""}
            </Link>
          </li>
        )}
    </ul>
  );

  return (
    <nav
      className="sidebar-bg-color sidebar"
      data-mdb-toggle="animation"
      data-mdb-animation-reset="true"
      data-mdb-animation="fade-in-left"
      style={{ maxWidth: "166px" }}
    >
      {isAuthenticated ? (
        <div className="position-sticky pt-3 sidebar-sticky">{navLinks}</div>
      ) : (
        ""
      )}
    </nav>
  );
};

export default Sidebar;
