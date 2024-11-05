import React, { useEffect, useState } from "react";
import {
  getColorAdmin,
  getColorDeveloper,
  getColorSuperAdmin,
  getColorUser,
} from "../../functions/helperFunctions";
import { alterPermission } from "../../functions/queries";
import { useSpring, animated, config, useTransition } from "react-spring";
import { toast } from "react-toastify";

const PermissionDropdown = (props) => {
  const [user, setUser] = useState(
    props.user !== null && props.user !== undefined ? props.user : null,
  );
  const [refresh, setRefresh] = useState(false);
  const [role, setRole] = useState(user?.role);
  const [toggle, setToggle] = useState(false);

  const setPermission = (item) => {
    const data = {
      user_id: user.user,
      role: item.name,
    };
    alterPermission(data)
      .then((res) => {
        if (item.value === 1) {
          setRole("Admin");
        } else if (item.value === 2) {
          setRole("User");
        } else if (item.value === 3) {
          setRole("User");
        } else if (item.value === 4) {
          setRole("Viewer");
        } else {
          toast.error("Not a valid permissions value");
        }
        toast.success("Permissions changed");
        props?.setRefresh(true);
      })
      .catch((err) => {
        if (err) {
          toast.error("Permissions not changed.");
        }
        if (err?.response?.status === 401) {
          toast.error("Only Owner can demote and create Admins");
        }
      });
  };

  useEffect(() => {
    if (refresh) {
    }
    setRefresh(false);
  }, [refresh]);

  const items = [
    { name: "Admin", value: 1 },
    { name: "User", value: 3 },
    { name: "Viewer", value: 4 },
  ];

  const transition = useTransition(items, {
    reset: true,
    from: { opacity: 0, transform: "translateY(10px)" },
    enter: { opacity: 1, transform: "translateY(0px)" },
    leave: { opacity: 0, transform: "translateY(-50px)" },
    config: config.molasses,
    delay: 100,
  });

  if (role === "Owner") {
    return (
      <div className="ml-2 p-2">
        <h6>
          <b>{role}</b>
        </h6>
      </div>
    );
  }

  return (
    <div className="dropdown">
      <button
        className="btn btn-sm btn-bg-transparent dropdown-toggle"
        type="button"
        id="userListDropdown"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
        onClick={() => {
          setToggle(!toggle);
        }}
      >
        {role}
      </button>
      <div className="dropdown-menu" aria-labelledby="userListDropdown">
        {transition((styles, item) => {
          return (
            <animated.a
              className="dropdown-item"
              // biome-ignore lint/a11y/useValidAnchor: No need for btn here
              onClick={() => setPermission(item)}
              style={styles}
            >
              {item.name}
            </animated.a>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionDropdown;
