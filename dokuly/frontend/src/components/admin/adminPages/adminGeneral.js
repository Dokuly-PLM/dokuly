import React, { useState, useEffect } from "react";
import InformationList from "../adminComponents/general/informationList";
import {
  basicSkeletonLoaderInfoCard,
  basicSkeletonLoaderTableCard,
} from "../functions/helperFunctions";
import { useSpring, animated } from "react-spring";
import { fetchOrg, fetchUserProfile } from "../functions/queries";
import ImageTable from "../genericComponents/imageTable";
import { Col, Container, Row } from "react-bootstrap";
import DokulyInformation from "../adminComponents/general/dokulyInformation";
import Profile2FA from "../../profiles/profileMfa";
import Stats from "../adminComponents/general/stats";
import ActiveModules from "../adminComponents/general/activeModules";

const AdminGeneral = (props) => {
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [users, setUsers] = useState(
    props.users !== null && props.users !== undefined ? props.users : []
  );
  const [user, setUser] = useState(
    props?.user !== null && props?.user !== undefined ? props.user : null
  );
  const [orgData, setOrgData] = useState(null);

  useEffect(() => {
    if (orgData == null || refresh) {
      fetchOrg()
        .then((res) => {
          if (res.status === 204) {
            setOrgData({ id: -1, status: "No Org Found" });
          }
          if (res.status === 200) {
            setOrgData(res.data);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
    if (user == null || refresh) {
      fetchUserProfile().then((res) => {
        setUser(res.data);
      });
    }
    setRefresh(false);
  }, [refresh]);

  if (orgData?.enforce_2fa && !user?.mfa_validated) {
    return (
      <div>
        <Profile2FA
          profile={props?.user}
          generateQr={true}
          setRefresh={setRefresh}
        />
      </div>
    );
  }

  return (
    <Row className="mt-2 mr-5">
      <Col lg={6} xl={6}>
        <Row>
          <div className="card px-3">
            <div className="card-body rounded bg-white">
              <h3 className="card-title">
                <b>Organization Information</b>
              </h3>
              <Row>
                <Col sm={12} md={6} lg={12} xl={6}>
                  <InformationList
                    setRefresh={setRefresh}
                    setOrgData={setOrgData}
                    org={orgData}
                    users={users}
                    user={user}
                  />
                </Col>
                <Col sm={12} md={6} lg={12} xl={6} className="vertical-line">
                  <Stats />
                </Col>
              </Row>
            </div>
          </div>
        </Row>
        <Row>
          <ActiveModules org={orgData} setRefresh={setRefresh} />
        </Row>
      </Col>
      <Col lg={6} xl={6}>
        <div className="card px-3">
          <div className="card-body rounded bg-white">
            <h3 className="card-title">
              <b>Organization logo</b>
            </h3>
            <Row className="px-3">
              <Col sm={12} md={12} lg={12} xl={12}>
                <ImageTable
                  imageIds={orgData?.image_ids}
                  domainName={"organizations"}
                  dbObj={orgData}
                  setDbObj={setOrgData}
                  setRefresh={setRefresh}
                />
                <small className="text-muted">
                  This image will be used as the logo on the generated PDFs
                </small>
              </Col>
            </Row>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default AdminGeneral;
