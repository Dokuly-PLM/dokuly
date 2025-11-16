import axios from "axios";
import React, { useState, useEffect } from "react";
import { Col, Row, Modal, Button } from "react-bootstrap";
import { useSpring, animated, config } from "react-spring";
import { tokenConfig } from "../../../../configs/auth";
import { newUser } from "../../functions/queries";
import { toast } from "react-toastify";
import AddButton from "../../../dokuly_components/AddButton.js";
import SubmitButton from "../../../dokuly_components/submitButton";

const CreateNewUser = (props) => {
  const [refresh, setRefresh] = useState(false);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [work_email, setWorkEmail] = useState("");
  const [role, setRole] = useState("User");

  const roles = [
    { id: "Viewer", label: "Viewer" },
    { id: "User", label: "User" },
    { id: "Admin", label: "Admin" },
  ];

  const fadeReverse = useSpring({ opacity: open ? 0 : 1, config: config.slow });

  const [showModal, setShowModal] = useState(false);

  // Function to open the modal
  const handleOpenModal = () => {
    setShowModal(true);
    props.childToParentlvl2({ form: true });
    setRefresh(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setShowModal(false);
    clearStates();
    props.childToParentlvl2({ form: false });
    setRefresh(true);
  };

  const clearStates = () => {
    setFirstName("");
    setLastName("");
    setWorkEmail("");
    setUsername("");
    setRole("User");
  };

  const checkInput = () => {
    let ok = true;
    if (username === "" || username.length > 150) {
      toast.error("Enter a valid username, max length 150");
      ok = false;
    }
    if (work_email === "" || work_email.length < 1) {
      toast.error("Enter a valid work email");
      ok = false;
    }
    return !ok;
  };

  const submit = () => {
    const error = checkInput();
    if (error) {
      return;
    }
    const data = {
      username: username,
      first_name: first_name,
      last_name: last_name,
      work_email: work_email,
      role: role,
    };
    axios
      .post("api/profiles/checkEmail/", { email: work_email }, tokenConfig())
      .then((res) => {
        if (res.status === 200) {
          newUser(data)
            .then((res) => {
              if (res.status === 200) {
                props.childToParentlvl2({ form: false, data: res.data });
                setShowModal(false);
                setOpen(false);
                clearStates();
                setRefresh(true);
              }
            })
            .catch((err) => {
              if (res.status === 401) {
                toast.error("Not authorized");
              } else if (res.status === 400) {
                toast.error(res.data);
              } else {
                if ("Unrouteable" in err.response.data) {
                  toast.error("Email not found; Unrouteable address");
                }
                toast.error(
                  "Error saving user, check your connection and inputs",
                );
              }
            });
        }
      })
      .catch((err) => {
        if (err.response.status === 409) {
          toast.error("A user with this email already exists");
        } else {
          toast.error("Error saving user, check your connection and inputs");
        }
      });
  };

  useEffect(() => {
    setRefresh(false);
  }, [props, refresh]);

  const isDisabled = !props.checkActiveVsSubs();

  return (
    <animated.div style={fadeReverse}>
      <div>
        <AddButton
          onClick={handleOpenModal}
          buttonText="Add user"
          className="mb-2 ml-3"
          disabled={!props.checkActiveVsSubs()}
        />
      </div>
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <Row>
              <div className="col">
                <label>Username*</label>
                <input
                  className="form-control"
                  type="text"
                  name="lastname"
                  placeholder="Username..."
                  onChange={(e) => {
                    if (e.target.value.length > 150) {
                      toast.info("Max length 150");
                      return;
                    }
                    setUsername(e.target.value);
                  }}
                  value={username}
                />
              </div>
              <div className="col">
                <label>Email*</label>
                <input
                  className="form-control"
                  type="text"
                  name="workemail"
                  placeholder="Email..."
                  onChange={(e) => {
                    if (e.target.value.length > 50) {
                      toast.info("Max length 50");
                      return;
                    }
                    setWorkEmail(e.target.value);
                  }}
                  value={work_email}
                />
              </div>
            </Row>
          </div>

          <div className="form-group">
            <label>Employee name*</label>
            <div className="row">
              <div className="col">
                <input
                  className="form-control"
                  type="text"
                  name="firstname"
                  placeholder="First name..."
                  onChange={(e) => {
                    if (e.target.value.length > 50) {
                      toast.info("Max length 50");
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
                  name="lastname"
                  placeholder="Last name..."
                  onChange={(e) => {
                    if (e.target.value.length > 50) {
                      toast.info("Max length 50");
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
            <label>Role*</label>
            <div className="row">
              <div className="col">
                <select
                  className="form-control"
                  onChange={(e) => {
                    setRole(e.target.value);
                  }}
                  value={role}
                >
                  <option value="">Select role</option>
                  {roles.map((role) => {
                    return (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <SubmitButton
            onClick={() => {
              submit();
            }}
            disabled={isDisabled}
          >
            Add user
          </SubmitButton>
        </Modal.Footer>
      </Modal>
    </animated.div>
  );
};

export default CreateNewUser;
