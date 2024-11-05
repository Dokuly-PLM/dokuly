import React, { useEffect, useState, useCallback } from "react";
import { Dropdown, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router";
import {
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../profiles/functions/queries";
import DokulyMarkdown from "../dokuly_components/dokulyMarkdown/dokulyMarkdown";
import { toast } from "react-toastify";

const Notifications = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(() => {
    getUnreadNotifications()
      .then((res) => {
        if (res && Array.isArray(res)) {
          setNotifications((prevNotifications) => {
            if (JSON.stringify(prevNotifications) !== JSON.stringify(res)) {
              return res;
            }
            return prevNotifications;
          });
        } else {
          setNotifications([]);
        }
      })
      .catch(() => {
        setNotifications([]);
      });
  }, []);

  useEffect(() => {
    fetchNotifications(); // Fetch immediately on mount

    const interval = setInterval(() => {
      fetchNotifications();
    }, 600000); // Set interval for fetching notifications every 10 min

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [fetchNotifications]);

  const handleNotificationClick = (notificationId, uri) => {
    markNotificationAsRead(notificationId)
      .then(() => {
        fetchNotifications();
        navigate(uri);
      })
      .catch((error) => {
        toast.error("Error marking notification as read:", error);
      });
  };

  const handleClearAll = () => {
    markAllNotificationsAsRead()
      .then(() => {
        fetchNotifications();
      })
      .catch((error) => {
        toast.error("Error clearing notifications:", error);
      });
  };

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const unreadCount = notifications.length;

  return (
    <React.Fragment>
      <Dropdown onToggle={toggleDropdown}>
        <Dropdown.Toggle
          variant="bg-transparent"
          id="dropdown-basic"
          style={{ position: "relative" }}
        >
          <img
            className="icon-dark"
            src="../../../static/icons/bell.svg"
            alt="Notifications"
          />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                backgroundColor: "red",
                borderRadius: "50%",
                color: "white",
                width: "1.5em",
                height: "1.5em",
                fontSize: "0.8em",
                zIndex: 1000,
                marginLeft: "0.25rem",
              }}
            >
              {unreadCount}
            </span>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu show={showDropdown}>
          <Dropdown.Header>Notifications</Dropdown.Header>
          {notifications.length > 0 ? (
            <>
              {notifications.slice(0, 10).map((notification) => (
                <Dropdown.Item
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(notification.id, notification.uri)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <div className="center-content-start-left">
                    {notification?.is_project_notification ? (
                      <img
                        src="../../static/icons/briefcase.svg"
                        alt="briefcase"
                        style={{
                          marginRight: "0.15rem",
                          marginTop: "0.5rem",
                          filter:
                            "invert(50%) sepia(78%) saturate(341%) hue-rotate(135deg) brightness(93%) contrast(88%)",
                        }}
                      />
                    ) : (
                      <img
                        src="../../static/icons/user.svg"
                        alt="briefcase"
                        style={{
                          marginRight: "0.15rem",
                          marginTop: "0.5rem",
                          filter:
                            "brightness(0) saturate(100%) invert(41%) sepia(54%) saturate(483%) hue-rotate(157deg) brightness(96%) contrast(92%)",
                        }}
                      />
                    )}
                    <Row className="mt-2 mx-2">
                      <DokulyMarkdown markdownText={notification.message} />
                    </Row>
                  </div>
                </Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item className="text-center">
                <Button variant="link" onClick={handleClearAll}>
                  Clear All
                </Button>
              </Dropdown.Item>
            </>
          ) : (
            <Dropdown.Item>No new notifications</Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </React.Fragment>
  );
};

export default Notifications;
