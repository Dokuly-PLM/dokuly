import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import axios from "axios";
import { toast } from "react-toastify";
import { tokenConfig } from "../common/queries";
import { Col, Container, Row, Dropdown } from "react-bootstrap";

import Notifications from "./notifications";

const TopHeader = ({ isAuthenticated, user, setIsAuthenticated }) => {
  const currentMonth = moment().format("MM");
  const navigate = useNavigate();
  const [innerWidth, setInnerWidth] = useState(1300);
  const whereProfileIconMovesBelow = 575;

  const logout = () => {
    axios
      .post("/api/auth/logout", null, tokenConfig())
      .then((res) => {
        if (res.status === 204) {
          localStorage.removeItem("token");
          localStorage.removeItem("token_created");
          setIsAuthenticated(false);
          navigate("/login");
          toast.success("Logged out");
        }
      })
      .catch((err) => {
        if (err) {
          toast.error("Error logging out, try again");
        }
      });
  };

  useEffect(() => {
    function handleResize() {
      setInnerWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const authLinks = (
    <Dropdown>
      <Dropdown.Toggle
        className="custom-dropdown-toggle"
        variant="none"
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          height: "40px",
          width: "40px",
          borderRadius: "50%",
          borderColor: "#165216ff",
          backgroundColor: "#165216ff",
          color: "#fff",
          fontWeight: "bold",
          textDecoration: "none",
          border: "none",
        }}
        id="dropdown-basic"
      >
        {user?.first_name?.[0] ?? ""}
        {user?.last_name?.[0] ?? ""}
      </Dropdown.Toggle>
      <Dropdown.Menu align="end">
        <Dropdown.Item as={Link} to="/profile">
          Profile
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => {
            logout();
          }}
        >
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  if (user == null) {
    return (
      <header
        className="navbar navbar-static-top topheader-bg-color flex-md-nowrap p-0"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000, // Ensures the header stays on top of other content
        }}
      >
        <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="/#/">
          <img
            className="icon-tabler-dark my-1"
            src="../../static/logo.svg"
            width="150rem"
            alt="Dokuly"
          />
          {currentMonth === "12" ? (
            <img
              className="icon-tabler-dark"
              src="../../static/icons/christmas_tree.gif"
              width="30px"
              alt="icon"
            />
          ) : (
            ""
          )}
        </a>
      </header>
    );
  }

  return (
    <header
      className="navbar navbar-static-top topheader-bg-color flex-md-nowrap p-1"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000, // Ensures the header stays on top of other content
      }}
    >
      {innerWidth > whereProfileIconMovesBelow ? (
        <React.Fragment>
          <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="/#/">
            <img
              className="icon-tabler-dark my-1"
              src="../../static/logo.svg"
              width="150rem"
              alt="Dokuly"
            />
            {currentMonth === "12" ? (
              <img
                className="icon-tabler-dark"
                src="../../static/icons/christmas_tree.gif"
                width="30px"
                alt="icon"
              />
            ) : (
              ""
            )}
          </a>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
            }}
          >
            {isAuthenticated && <Notifications className="mr-6" />}
            {isAuthenticated && authLinks}
          </div>
        </React.Fragment>
      ) : (
        <Container>
          <Row>
            <Col>
              <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="/#/">
                <img
                  className="icon-tabler-dark my-1"
                  src="../../static/logo.svg"
                  width="150rem"
                  alt="Dokuly"
                />
                {currentMonth === "12" ? (
                  <img
                    className="icon-tabler-dark"
                    src="../../static/icons/christmas_tree.gif"
                    width="30px"
                    alt="icon"
                  />
                ) : (
                  ""
                )}
              </a>
            </Col>
            <div
              style={{
                marginTop: "0.33rem",
                position: "absolute",
                right: "5px",
                display: "flex", // Add flex display
                alignItems: "center", // Align items vertically in the center
              }}
            >
              {isAuthenticated && <Notifications className="mr-6" />}
              {isAuthenticated && authLinks}
            </div>
          </Row>
        </Container>
      )}
    </header>
  );
};

export default TopHeader;
