import React, { useState, useEffect } from "react";
import { updateUserProfile, alterAllowedApps } from "../../functions/queries";
import { toast } from "react-toastify";
import SubmitButton from "../../../dokuly_components/submitButton";

const EditUserProfile = (props) => {
  const [user, setUser] = useState(props?.user ?? "");
  const [first_name, setFirstName] = useState(props?.user?.first_name ?? "");
  const [last_name, setLastName] = useState(props?.user?.last_name ?? "");
  const [address, setAddress] = useState(props?.user?.address ?? "");
  const [position, setPosition] = useState(props?.user?.position ?? "");
  const [work_email, setWorkEmail] = useState(props?.user?.work_email ?? "");
  const [is_active, setIsActive] = useState(props?.user?.is_active ?? "");
  const [personal_email, setPersonalEmail] = useState(
    props?.user?.personal_email ?? ""
  );
  const [allowedApps, setAllowedApps] = useState(
    props?.user?.allowed_apps ?? []
  );
  const [subscriptionCounts, setSubscriptionCounts] = useState({});
  const [userCounts, setUserCounts] = useState({});
  const [refresh, setRefresh] = useState(false);

  const clearStates = () => {
    setFirstName("");
    setLastName("");
    setAddress("");
    setPosition("");
    setWorkEmail("");
    setIsActive("");
    setPersonalEmail("");
  };

  const loadStates = (user) => {
    setUser(user);
    setFirstName(
      user.first_name !== (null || undefined) ? user.first_name : ""
    );
    setLastName(user.last_name !== (null || undefined) ? user.last_name : "");
    setAddress(user.address !== (null || undefined) ? user.address : "");
    setPosition(user.position !== (null || undefined) ? user.position : "");
    setWorkEmail(
      user.work_email !== (null || undefined) ? user.work_email : ""
    );

    setPersonalEmail(
      user.personal_email !== (null || undefined) ? user.personal_email : ""
    );
    setIsActive(user.is_active !== (null || undefined) ? user.is_active : "");
    setAllowedApps(user.allowed_apps || []);
  };

  const submit = () => {
    const data = {
      first_name: first_name,
      last_name: last_name,
      address: address,
      position: position,
      work_email: work_email,
      is_active: is_active,
    };
    updateUserProfile(user.user, data)
      .then((res) => {})
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
        const app_data = {
          user_id: user.user,
          allowed_apps: allowedApps,
        };
        alterAllowedApps(app_data)
          .then((res) => {})
          .finally(() => {
            props.childToParent({ newData: true });
          });
        clearStates();
        $("#editUserProfileModal").modal("hide");
        props?.setOpen(false);
      });
  };

  const editUserProfile = (user) => {
    const modal = $("#editUserProfileModal");
    modal.modal("show");
    modal.on("hidden.bs.modal", () => {
      props?.setOpen(false);

      // Remove the event listener to avoid multiple bindings
      modal.off("hidden.bs.modal");
    });
  };

  if (props.open) {
    editUserProfile(props.user);
  }

  const checkUser = () => {
    if (props?.user?.id === props?.loggedUser?.id) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Calculate subscription and user counts
    const newSubscriptionCounts = {};
    const newUserCounts = {};

    if (!props?.subscriptions || !props?.users) {
      return;
    }

    props?.subscriptions.forEach((sub) => {
      const planName = sub.subscription_data?.plan_name;
      newSubscriptionCounts[planName] =
        (newSubscriptionCounts[planName] || 0) + sub?.count;
    });

    props?.users.forEach((user) => {
      user?.allowed_apps.forEach((app) => {
        newUserCounts[app] = (newUserCounts[app] || 0) + 1;
      });
    });

    setSubscriptionCounts(newSubscriptionCounts);
    setUserCounts(newUserCounts);
  }, [props?.subscriptions, props?.users]);

  useEffect(() => {
    loadStates(props?.user);
    if (refresh) {
      setRefresh(false);
    }
  }, [props?.user]);

  const getCurrentPlan = () => {
    if (allowedApps.includes("requirements")) {
      return "Dokuly Pro + Requirements";
    }
    return "Dokuly Pro"; // Default to Dokuly Pro if no specific features are identified
  };

  const isAppDisabled = (app) => {
    const planMapping = {
      requirements: "Dokuly Pro + Requirements",
      timesheet: "Dokuly Pro",
      customers: "Dokuly Pro",
      projects: "Dokuly Pro",
      documents: "Dokuly Pro",
      parts: "Dokuly Pro",
      assemblies: "Dokuly Pro",
      pcbas: "Dokuly Pro",
      production: "Dokuly Pro",
      procurement: "Dokuly Pro",
    };

    const relevantPlan = planMapping[app];
    const currentPlan = getCurrentPlan();
    const isPartOfCurrentPlan = relevantPlan === currentPlan;
    const totalAllowed =
      relevantPlan === "Dokuly Pro + Requirements"
        ? subscriptionCounts[relevantPlan]
        : subscriptionCounts["Dokuly Pro"] +
          (subscriptionCounts["Dokuly Pro + Requirements"] || 0);
    const isOverSubscriptionLimit = userCounts[app] >= totalAllowed;

    // Allow activation if the app is part of the current plan and not over the subscription limit
    return isOverSubscriptionLimit && !isPartOfCurrentPlan;
  };

  const handleAppChange = (app) => {
    if (allowedApps.includes(app)) {
      setAllowedApps(allowedApps.filter((a) => a !== app));
    } else if (!isAppDisabled(app)) {
      setAllowedApps([...allowedApps, app]);
    } else {
      toast.error(`Not enough subscriptions to activate ${app}.`);
    }
  };

  return (
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
                Edit user profile
              </h5>
              <button
                type="button"
                className="close"
                onClick={() => {
                  clearStates();
                  props.childToParent("Closed");
                  $("#editUserProfileModal").modal("hide");
                  props?.setOpen(false);
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
                          toast("Max length 50");
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
                          toast("Max length 50");
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
                <label>Work email</label>
                <input
                  className="form-control"
                  type="text"
                  name="workemail"
                  onChange={(e) => {
                    if (e.target.value.length > 50) {
                      toast("Max length 50");
                      return;
                    }
                    setWorkEmail(e.target.value);
                  }}
                  value={work_email}
                />
              </div>

              <div
                className="form-check"
                style={{ marginLeft: "0.5rem", marginTop: "0.5rem" }}
              >
                <input
                  className="dokuly-checkbox"
                  name="showInactive"
                  type="checkbox"
                  onChange={(e) => {
                    setIsActive(e.target.checked);
                  }}
                  checked={is_active}
                  disabled={!!checkUser()}
                />
                <label
                  className="form-check-label ml-1"
                  htmlFor="flexCheckDefault"
                >
                  User active?
                </label>
              </div>
              <div className="form-group mt-2">
                <label>Allowed Apps</label>
                <div style={{ marginLeft: "0.5rem" }}>
                  {[
                    "timesheet",
                    "customers",
                    "projects",
                    "requirements",
                    "documents",
                    "parts",
                    "assemblies",
                    "pcbas",
                    "production",
                    "procurement",
                  ].map((app) => (
                    <div key={app} className="form-check">
                      <input
                        className="dokuly-checkbox"
                        type="checkbox"
                        id={app}
                        checked={allowedApps.includes(app)}
                        onChange={() => handleAppChange(app)}
                      />
                      <label className="form-check-label ml-1" htmlFor={app}>
                        {app}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer float-left">
              <SubmitButton
                onClick={() => {
                  submit();
                }}
                type="button"
                className="btn dokuly-btn-primary"
              >
                Submit
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserProfile;
