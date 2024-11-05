import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router";
import { basicSkeletonLoaderInfoCard } from "../../functions/helperFunctions";
import { fetchStorageSize } from "../../functions/queries";
import StatDonought from "../../genericComponents/statDonought";
import { useSpring, animated, config } from "react-spring";
import { AuthContext } from "../../../App";

const Stats = (props) => {
  const [refresh, setRefresh] = useState(false);
  const [currentStorage, setCurrentStorage] = useState(null);
  const [storageLimit, setStorageLimit] = useState(null);
  const [currentStorageBytes, setCurrentStorageBytes] = useState(null);
  const [storageLimitBytes, setStorageLimitBytes] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if ((refresh || currentStorage === null) && loadingStorage === false) {
      setLoadingStorage(true);
      fetchStorageSize()
        .then((res) => {
          setCurrentStorage(res?.data?.size);
          setStorageLimit(res?.data?.limit);
          setStorageLimitBytes(res?.data?.limit_bytes);
          setCurrentStorageBytes(res?.data?.bytes);
        })
        .catch((err) => {
          if (err != null && err !== undefined) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoadingStorage(false);
        });
    }
    setRefresh(false);
  }, [props, refresh]);

  if (loadingStorage) {
    return (
      <div>
        <Row>
          <Col>
            <StatDonought
              mainLabel=""
              title={"Storage"}
              subTitle={"loading..."}
              datasets={[
                {
                  label: "Used Storage (%)",
                  color: "22, 82, 22, 1, 1",
                  value: 0,
                },
                {
                  label: "Available Storage (%)",
                  color: "156,156,156, 0.5, 0.7",
                  value: 100,
                },
              ]}
            />
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <Row>
        <Col>
          <StatDonought
            mainLabel=""
            title={"Storage"}
            subTitle={`${currentStorage} / ${storageLimit}`}
            datasets={[
              {
                label: "Used Storage (%)",
                color: "22, 82, 22, 1, 1",
                value: (currentStorageBytes / storageLimitBytes) * 100,
              },
              {
                label: "Available Storage (%)",
                color: "156,156,156, 0.5, 0.7",
                value:
                  ((storageLimitBytes - currentStorageBytes) /
                    storageLimitBytes) *
                  100,
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Stats;
