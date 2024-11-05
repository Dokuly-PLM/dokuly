import React, { useEffect, useState, useContext } from "react";
import { Col, Container, Row } from "react-bootstrap";
import {
  fetchAPIKeyFromOrg,
  fetchAPIKeysFromOrg,
  fetchDokulyAPIKeys,
} from "../functions/queries";
import { toast } from "react-toastify";
import {
  basicFadeInSpring,
  loadingSpinner,
} from "../functions/helperFunctions";
import APIKeysPricingCard from "../adminComponents/general/componentVault/apiKeysPricingCard";
import ComponentVaultPricing from "../adminComponents/general/componentVault/componentVaultPricing";
import ComponentVaultSignup from "../adminComponents/general/componentVault/componentVaultSignup";
import AddExistingKey from "../adminComponents/general/componentVault/addExistingKey";
import { useSpring, animated } from "react-spring";
import CopyToClipButton from "../../dokuly_components/copyToClipButton";
import { AuthContext } from "../../App";
import { set } from "react-ga";
import useDokulyAPIKeys from "../adminComponents/apiKeys/useDokulyAPIKeys";
import ComponentVaultKey from "../adminComponents/apiKeys/componentVault";
import DokulyAPIKeys from "../adminComponents/apiKeys/dokulyAPIKeys";

const AdminAPIKeys = (props) => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [refresh, setRefresh] = useState(false);
  const [loadingCompVaultKey, setLoadingCompVaultKey] = useState(true);
  const [componentVaultAPIKey, setComponentVaultAPIKey] = useState(null);
  const [loadingDokulyAPIKeys, setLoadingDokulyAPIKeys] = useState(true);
  const [signupCompVault, setSignupCompVault] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({});
  const [orgId, setOrgId] = useState(null);
  const [addExistingKey, setAddExistingKey] = useState(false);

  const spring = useSpring(basicFadeInSpring());

  useEffect(() => {
    if (orgId === null || refresh) {
      if (!loadingCompVaultKey) {
        setLoadingCompVaultKey(true);
      }
      fetchAPIKeyFromOrg()
        .then((res) => {
          if (res.status === 200) {
            setComponentVaultAPIKey("Not available");
            setOrgId(res.data.id);
          }
        })
        .catch((err) => {
          if (err) {
            if (err?.response) {
              if (err?.response.status === 401) {
                setIsAuthenticated(false);
              }
            }
          }
        })
        .finally(() => {
          setLoadingCompVaultKey(false);
        });
    }
    setRefresh(false);
  }, [refresh]);

  const { dokulyAPIKeys } = useDokulyAPIKeys(
    orgId,
    setLoadingDokulyAPIKeys,
    setIsAuthenticated,
    refresh
  );

  return (
    <Container className="w-90">
      <DokulyAPIKeys APIKeys={dokulyAPIKeys} setRefresh={setRefresh} />
    </Container>
  );
};

export default AdminAPIKeys;
