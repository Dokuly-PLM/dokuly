import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { updateUserProfile } from "../../admin/functions/queries";

const EditUserProfile = (props) => {
  const [first_name, setFirstName] = useState(props.user?.first_name);
  const [last_name, setLastName] = useState(props.user?.last_name);
  const [address, setAddress] = useState(props.user?.address);
  const [position, setPosition] = useState(props.user?.position);
  const [work_email, setWorkEmail] = useState(props.user?.work_email);
  const [personal_phone_number, setPersonalPhoneNumber] = useState(
    props.user?.personal_phone_number
  );

  const clearStates = () => {
    setFirstName("");
    setLastName("");
    setAddress("");
    setPosition("");
    setWorkEmail("");
    setPersonalPhoneNumber("");
  };

  const loadStates = () => {
    setFirstName(props.user?.first_name);
    setLastName(props.user?.last_name);
    setAddress(props.user?.address);
    setPosition(props.user?.position);
    setWorkEmail(props.user?.work_email);
    setPersonalPhoneNumber(props.user?.personal_phone_number);
  };

  const submit = () => {
    const data = {
      first_name: first_name,
      last_name: last_name,
      address: address,
      position: position,
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
                  <label>Employee name</label>
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
                  <label>Position</label>
                  <input
                    className="form-control"
                    type="text"
                    name="position"
                    onChange={(e) => {
                      if (e.target.value.length > 50) {
                        alert("Max length 50");
                        return;
                      }
                      setPosition(e.target.value);
                    }}
                    value={position}
                  />
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
              </div>
              <div className="modal-footer float-left">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    submit();
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EditUserProfile;
