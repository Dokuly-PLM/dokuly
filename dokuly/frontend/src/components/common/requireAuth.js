import React, { useContext, useEffect, useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import ErrorBoundary from "./errorBoundaries";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { getUser } from "./queries";
import { AuthContext } from "../App";

const RequireAuth = ({ user }) => {
  const [auth, setAuth] = useState();
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  const location = useLocation();

  let resetPassCheck = false;
  if (window.location.href.includes("passwordRecovery")) {
    resetPassCheck = true;
  }

  useEffect(() => {
    // This useEffect stores the last used path by an authenticated user
    // The path is loaded from localStorage in App.js
    // It also checks after check pathname or isAuthenticated states if the user is still authenticated
    // If toknes are removed or we are not authenticated, check if the user is authenticated
    // if we get a 401 back, log the user out.
    if (
      !isAuthenticated ||
      localStorage.getItem("token") === undefined ||
      localStorage.getItem("token") === null
    ) {
      getUser()
        .then((res) => {
          if (res.status === 200) {
            setAuth(res.data);
          } else {
            if (
              location.pathname !== "/login" &&
              !location.pathname.toString().includes("/passwordRecovery")
            ) {
              setIsAuthenticated(false);
              toast.info("Session expired");
            }
          }
        })
        .catch((err) => {
          if (err) {
            if (
              location.pathname !== "/login" &&
              !location.pathname.toString().includes("/passwordRecovery")
            ) {
              setIsAuthenticated(false);
              toast.info("Session expired");
            }
          }
        });
    }
    if (
      location.pathname !== "/login" &&
      !location.pathname.toString().includes("/passwordRecovery")
    ) {
      localStorage.setItem("prevPath", location.pathname);
    }
  }, [location.pathname, isAuthenticated]);

  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
};
export default RequireAuth;
