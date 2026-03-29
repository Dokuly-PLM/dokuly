import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateUserProfile, adminResetUserPassword } from "../../admin/functions/queries";
import SubmitButton from "../../dokuly_components/submitButton";

const EditUserProfile = (props) => {
  const [first_name, setFirstName] = useState(props.user?.first_name);
  const [last_name, setLastName] = useState(props.user?.last_name);
  const [address, setAddress] = useState(props.user?.address);
  const [work_email, setWorkEmail] = useState(props.user?.work_email);
  const [personal_phone_number, setPersonalPhoneNumber] = useState(
    props.user?.personal_phone_number
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const clearStates = () => {
    setFirstName("");
    setLastName("");
    setAddress("");
    setWorkEmail("");
    setPersonalPhoneNumber("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordReset(false);
  };

  const loadStates = () => {
    setFirstName(props.user?.first_name);
    setLastName(props.user?.last_name);
    setAddress(props.user?.address);
    setWorkEmail(props.user?.work_email);
    setPersonalPhoneNumber(props.user?.personal_phone_number);
  };

  const submit = () => {
    const data = {
      first_name: first_name,
      last_name: last_name,
      address: address,
      work_email: work_email,
      personal_phone_number: personal_phone_number,
    };

    updateUserProfile(props.user.user, data)
      .then((res) => {
        if (res.status === 200) {
          clearStates();
          props.setRefresh(true);
        }
      })
      .catch((err) => {
        if (err.response.status === 404) {
          toast.error("Not found, check connection");
          return;
        } else if (err.response.status === 401) {
          toast.error("Unauthorized");
          return;
        }
      });

    $("#editUserProfileModal").modal("hide");
  };

  const handlePasswordReset = () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    adminResetUserPassword(props.user.user, newPassword)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Password reset successfully");
          setNewPassword("");
          setConfirmPassword("");
          setShowPasswordReset(false);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 403) {
          toast.error("Unable to reset password");
        } else if (err?.response?.status === 404) {
          toast.error("User not found");
        } else {
          toast.error("Failed to reset password");
        }
      });
  };

  const editUserProfile = () => {
    loadStates();
    $("#editUserProfileModal").modal("show");
  };

  return (
    <React.Fragment>
      <div>
        <button
          type="button"
          className="btn btn-bg-transparent"
          onClick={() => editUserProfile(props.user)}
        >
          <img
            className="icon-tabler-dark"
            src="../../static/icons/edit.svg"
            alt="Edit Icon"
          />
          <span className="btn-text">Edit</span>
        </button>
      </div>

      <div>
        <div
          className="modal fade"
          id="editUserProfileModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="editUserProfileModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="editUserProfileModalLabel">
                  Edit profile
                </h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => {
                    clearStates();

                    $("#editUserProfileModal").modal("hide");
                  }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <div className="row">
                    <div className="col">
                      <input
                        className="form-control"
                        type="text"
                        name="lastname"
                        onChange={(e) => {
                          if (e.target.value.length > 50) {
                            alert("Max length 50");
                            return;
                          }
                          setFirstName(e.target.value);
                        }}
                        value={first_name}
                      />
                    </div>
                    <div className="col">
                      <input
                        className="form-control"
                        type="text"
                        name="firstname"
                        onChange={(e) => {
                          if (e.target.value.length > 50) {
                            alert("Max length 50");
                            return;
                          }
                          setLastName(e.target.value);
                        }}
                        value={last_name}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="form-control"
                    type="text"
                    name="workemail"
                    onChange={(e) => {
                      if (e.target.value.length > 50) {
                        alert("Max length 50");
                        return;
                      }
                      setWorkEmail(e.target.value);
                    }}
                    value={work_email}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    className="form-control"
                    type="text"
                    name="address"
                    onChange={(e) => {
                      if (e.target.value.length > 50) {
                        alert("Max length 50");
                        return;
                      }
                      setAddress(e.target.value);
                    }}
                    value={address}
                  />
                </div>

                <div className="form-group">
                  <label>Phone number</label>
                  <input
                    className="form-control"
                    type="text"
                    name="personalphone"
                    onChange={(e) => {
                      if (e.target.value.length > 50) {
                        alert("Max length 50");
                        return;
                      }
                      setPersonalPhoneNumber(e.target.value);
                    }}
                    value={personal_phone_number}
                  />
                </div>

                <div className="form-group mt-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <label className="mb-0">Change Password</label>
                    <button
                      type="button"
                      className="btn btn-sm dokuly-btn-primary"
                      onClick={() => setShowPasswordReset(!showPasswordReset)}
                    >
                      {showPasswordReset ? "Cancel" : "Change Password"}
                    </button>
                  </div>
                  {showPasswordReset && (
                    <div className="mt-2" style={{ marginLeft: "0.5rem" }}>
                      <div className="form-group">
                        <label className="small">New Password</label>
                        <input
                          className="form-control"
                          type="password"
                          placeholder="Enter new password (min 8 characters)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="small">Confirm Password</label>
                        <input
                          className={`form-control ${
                            confirmPassword && newPassword !== confirmPassword
                              ? "is-invalid"
                              : ""
                          }`}
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                          <div className="invalid-feedback">
                            Passwords do not match
                          </div>
                        )}
                      </div>
                      <SubmitButton
                        onClick={handlePasswordReset}
                        type="button"
                        className="btn dokuly-btn-primary btn-sm"
                        disabled={!newPassword || !confirmPassword}
                      >
                        Set New Password
                      </SubmitButton>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer float-left">
                <SubmitButton
                  onClick={() => {
                    submit();
                  }}
                  type="button"
                >
                  Submit
                </SubmitButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EditUserProfile;
