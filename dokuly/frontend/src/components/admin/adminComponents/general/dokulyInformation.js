import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";

import { Col, Container, Row } from "react-bootstrap";
import { redirect, useNavigate } from "react-router";
import { useSpring } from "react-spring";
import {
  basicSkeletonLoaderInfoCard,
  loadingSpinner,
} from "../../functions/helperFunctions";
import { deleteTenant } from "../../functions/queries";

const DokulyInformation = (props) => {
  const navigete = useNavigate();
  const [checked, setChecked] = useState(false);

  const deleteAccountDialog = () => {
    if (
      !confirm(
        "Continue the deletion dialog? You can still go back from this point."
      )
    ) {
      return;
    }
    if (
      !confirm(
        "Last chance to go back! Are you sure you want to continue the deletion dialog? Deleting the workspace is an IRREVERSIBLE action!"
      )
    ) {
      return;
    }
    $("#workspaceDeletion").modal("show");
  };

  const deleteAccount = () => {
    deleteTenant().then((res) => {
      if (res.status === 200) {
        $("workspaceDeletion").modal("hide");
        window.location.href = res.data;
      }
    });
  };

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  });

  if (props?.user === undefined || props?.user === null) {
    return basicSkeletonLoaderInfoCard(5, spring);
  }

  return (
    <Container>
      <div
        className="card-body card rounded shadow bg-white m-3 shadow-sm rounded"
        style={{ maxHeight: "30rem", height: "30rem" }}
      >
        <h5>
          <b>Dokuly v1.0</b>
        </h5>
        <div className="mt-2 mb-2" style={{ marginBottom: "1.5rem" }}>
          <a
            href="https://www.freeprivacypolicy.com/live/5abe812f-a944-4693-9109-1fd42e9fed66"
            target="_blank"
            className="card-link ml-2"
            style={{ borderBottom: "black 1px solid" }}
            rel="noreferrer"
          >
            Privacy Policy
          </a>{" "}
        </div>
        {props?.user?.role === "Owner" && (
          <div>
            <h6 className="mt-4">
              <b>Danger zone</b>
            </h6>
            <div className="border border-danger rounded p-4">
              <button
                className="btn btn-outline-danger ml-2"
                onClick={(e) => {
                  deleteAccountDialog();
                }}
              >
                Delete Workspace
              </button>
            </div>
          </div>
        )}
      </div>
      <div
        className="modal fade"
        id="workspaceDeletion"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="workspaceDeletion"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="workspaceDeletionLabel">
                Workspace deletion
              </h5>
            </div>
            <div className="m-2 p-2">
              <h6>
                You are about to delete the workspace. This includes removing
                all subscriptions to Dokuly, all user data and organization
                data. {"\n"}
                Your files will be kept in the storage system for 14 days,
                however if you want them deleted contact support for instant
                removal. The workspace will NOT remain active until the end of
                the current subscription. Do you understand the terms and want
                to finalize the deletion process?{" "}
                <b>There is no more dialog after pressing the delete button!</b>
              </h6>
              <div
                className="form-check"
                style={{
                  marginLeft: "0.5rem",
                  marginTop: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <input
                  className="form-check-input"
                  name="enableDeletionButton"
                  type="checkbox"
                  onChange={(e) => {
                    setChecked(e.target.checked);
                  }}
                  checked={checked}
                />
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Enable Deletion Button
                </label>
              </div>
              <Row>
                <Col>
                  {checked ? (
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        deleteAccount();
                      }}
                    >
                      Delete Workspace
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      disabled
                      style={{ cursor: "not-allowed" }}
                    >
                      Delete Workspace
                    </button>
                  )}
                </Col>
                <Col>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      $("#workspaceDeletion").modal("hide");
                    }}
                  >
                    Cancel
                  </button>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default DokulyInformation;
