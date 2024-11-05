import React, { useState, useEffect } from "react";
import { Link, Navigate, NavLink, useNavigate } from "react-router-dom";

import { fetchTestUser, editOrg } from "../../functions/queries";

const TestUserSetup = (props) => {
  const [test_user, setTestUser] = useState(false);
  const [org_id, setOrgId] = useState(-1);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTestUser()
      .then((res) => {
        if (res != null) {
          setTestUser(res.data.test_user);
          setOrgId(res.data.id);
        }
      })
      .catch((err) => {
        if (err?.response) {
          if (err?.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("token_created");
          }
        }
      });
  }, []);

  function changeTestUser(value) {
    if (org_id !== -1 && org_id !== undefined) {
      editOrg(org_id, { test_user: value }).then((res) => {
        if (res != null) {
          setTestUser(res.data.test_user);
        }
      });
    }
  }

  return (
    <div
      className="container-fluid dokuly-bg-light"
      style={{ padding: "1rem" }}
    >
      Configure Test User Access. This will show test functionality in Dokuly.
      Use at your own risk.
      <input
        className="dokuly-checkbox"
        type="checkbox"
        checked={test_user}
        name="Part Doc."
        onChange={() => changeTestUser(!test_user)}
        value={test_user}
      />
    </div>
  );
};

export default TestUserSetup;
