import React, { Fragment, useState, useEffect, useContext } from "react";
import EditUserProfile from "./forms/userEditForm";
import Profile from "./profileComponent2";
import { enable2FATotp, getUserProfile } from "./functions/queries";
import Profile2FA from "./profileMfa";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import { Container, Row } from "react-bootstrap";
import { fetchOrg } from "../admin/functions/queries";
import { useNavigate } from "react-router";
import { AuthContext } from "../App";
import ProfileNotificationSettings from "./profileNotificationSettings";

export default function ProfileDashboard() {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [active2fa, setActive2fa] = useState(false);
  const [org, setOrg] = useState(null);

  const navigate = useNavigate();

  const enable2fa = () => {
    enable2FATotp()
      .then((res) => {
        setQrUri(res.data);
      })
      .catch((err) => {
        if (err?.response) {
          if (err?.response?.status === 401) {
            setIsAuthenticated(false);
          }
        }
      })
      .finally(() => {
        setRefresh(true);
        props.setRefresh(true);
      });
  };

  useEffect(() => {
    if (profile == null || refresh) {
      getUserProfile()
        .then((res) => {
          if (res.status === 200) {
            setProfile(res.data);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    }
    if (org == null || refresh) {
      fetchOrg()
        .then((res) => {
          setOrg(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoadingOrg(false);
        });
    }
    setRefresh(false);
    document.title = "Profile | Dokuly";
  }, [refresh]);

  if (loadingProfile || loadingOrg) {
    return loadingSpinner();
  }

  if (active2fa) {
    return (
      <Container>
        <Profile2FA profile={profile} setRefresh={setRefresh} />;
      </Container>
    );
  }

  return (
    <Container>
      <div className="text-center m-2" style={{ marginTop: "1rem" }}>
        <h2>My Profile</h2>
      </div>
      <Row>
        <EditUserProfile setRefresh={setRefresh} user={profile} />

        {!profile?.mfa_validated ? (
          <div>
            <button
              className="btn btn-bg-transparent text-center"
              onClick={() => {
                enable2fa();
              }}
            >
              <img
                className="icon-tabler-dark"
                src="../static/icons/circle-plus.svg"
                alt="Plus Icon"
              />
              <span className="btn-text">Enable 2FA</span>
            </button>
          </div>
        ) : (
          <React.Fragment>
            <span className="mt-2_5">
              MFA active
              <img
                className="green-svg-color icon-tabler ml-2"
                width={"40px"}
                height={"40px"}
                src="../static/icons/check.svg"
                alt="Plus Icon"
              />
            </span>
          </React.Fragment>
        )}
      </Row>
      <Profile profile={profile} />
      <ProfileNotificationSettings profile={profile} />
    </Container>
  );
}
