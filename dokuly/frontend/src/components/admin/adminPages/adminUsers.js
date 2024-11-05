import React, { useState, useEffect } from "react";
import UsersList from "../adminComponents/users/usersList";
import {
  basicSkeletonLoaderInfoCard,
  basicSkeletonLoaderTableCard,
  loadingSpinner,
} from "../functions/helperFunctions";
import { fetchUsers, getMaxAllowedActiveUsers } from "../functions/queries";
import { useSpring, animated } from "react-spring";
import { Col, Container, Row } from "react-bootstrap";
import ManageSubscriptions from "../adminComponents/users/manageSubscriptions";
import { toast } from "react-toastify";

const AdminUsers = (props) => {
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [subscriptions, setSubscriptions] = useState(null);
  const [data, setData] = useState(
    props.users !== null && props.users !== undefined ? props.users : null
  );
  const [allowedUsers, setAllowedUsers] = useState(null);

  useEffect(() => {
    if (allowedUsers === null || refresh) {
      getMaxAllowedActiveUsers()
        .then((res) => {
          setAllowedUsers(res.data);
        })
        .finally(() => {
          setLoading2(false);
        });
    }
    if (data == null || refresh) {
      fetchUsers()
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          if (err.response.status === 401) {
            setData(-1);
            toast.error("Unauthorized");
          }
          if (err.response.status === 400) {
            setData(-1);
            toast.error("No user data found");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh]);

  if (loading || loading2) {
    return loadingSpinner();
  }

  if (data === -1) {
    return (
      <div className="card-body card rounded shadow bg-white shadow-sm rounded">
        Not Authorized, 401
      </div>
    );
  }

  return (
    <div>
      <Row className="mt-2 justify-content-center">
        <Col className="col-10 offset-1 justify-content-center">
          <ManageSubscriptions
            user={props?.user}
            users={data}
            allowedUsers={allowedUsers}
            setRefresh={setRefresh}
            setSubscriptions={setSubscriptions}
          />
        </Col>
      </Row>
      <Row className="mt-2 justify-content-center">
        <Col className="col-10 offset-1 justify-content-center">
          {data !== null && data !== undefined && data !== -1 && (
            <div className="card-body card rounded bg-white p-5">
              <UsersList
                data={data}
                basicList={false}
                tableView={true}
                allowedUsers={allowedUsers}
                setRefresh={setRefresh}
                user={props?.user}
                subscriptions={subscriptions}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default AdminUsers;
