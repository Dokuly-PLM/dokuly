import React, { useState, useEffect, useContext } from "react";
import { Row, Col } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import { getEco, editEco } from "./functions/queries";
import { tokenConfig } from "../../configs/auth";
import DokulyCard from "../dokuly_components/dokulyCard";
import EditableMarkdown from "../dokuly_components/dokulyMarkdown/editableMarkdown";
import CardTitle from "../dokuly_components/cardTitle";
import Heading from "../dokuly_components/Heading";
import EcoInfoCard from "./components/ecoInfoCard";
import AffectedItemsTable from "./components/affectedItemsTable";
import EditEcoForm from "./forms/editEcoForm";
import { AuthContext } from "../App";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import useProfile from "../common/hooks/useProfile";
import { checkProfileIsAllowedToEdit } from "../common/functions";

const DisplayEco = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: ecoId } = useParams();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [profile, refreshProfile] = useProfile();

  const [eco, setEco] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [readOnly, setReadOnly] = useState(false);

  // Parse the ID from URL params
  const id = ecoId ? Number.parseInt(ecoId) : -1;

  // Check permissions
  useEffect(() => {
    if (!profile) return;
    const isAllowed = checkProfileIsAllowedToEdit(profile?.role);
    setReadOnly(!isAllowed);
  }, [profile]);

  // Fetch ECO data
  useEffect(() => {
    if (id === -1 || Number.isNaN(id)) return;

    setLoading(true);
    getEco(id)
      .then((res) => {
        if (res.status === 200) {
          setEco(res.data);
          document.title = `ECO-${res.data.id} | Dokuly`;
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setIsAuthenticated(false);
        } else if (err?.response?.status === 404) {
          toast.error("ECO not found");
          navigate("/eco");
        } else {
          toast.error("Failed to load ECO");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Refresh data
  useEffect(() => {
    if (!refresh || id === -1 || Number.isNaN(id)) return;

    getEco(id)
      .then((res) => {
        if (res.status === 200) {
          setEco(res.data);
        }
      })
      .catch((err) => {
        toast.error("Failed to refresh ECO");
      })
      .finally(() => {
        setRefresh(false);
      });
  }, [refresh]);

  // Fetch profiles for responsible dropdown
  useEffect(() => {
    axios
      .get("api/profiles", tokenConfig())
      .then((res) => {
        if (res.status === 200) {
          setProfiles(res.data);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setIsAuthenticated(false);
        }
        console.error("Failed to load profiles");
      });
  }, []);

  const handleDescriptionSubmit = (text) => {
    editEco(id, { description: text })
      .then((res) => {
        if (res.status === 200) {
          setRefresh(true);
          toast.success("Description updated");
        }
      })
      .catch((err) => {
        toast.error("Failed to update description");
      });
  };

  const isReleased = eco?.release_state === "Released";

  if (loading) {
    return (
      <div className="container-fluid mt-2 mainContainerWidth">
        {loadingSpinner()}
      </div>
    );
  }

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      {/* Back button */}
      <img
        className="icon-dark p-2 arrow-back"
        onClick={() => navigate("/eco")}
        src="../../static/icons/arrow-left.svg"
        alt="Back"
        style={{ cursor: "pointer" }}
      />

      {/* Header */}
      <Heading
        item_number={`ECO-${eco?.id || ""}`}
        display_name={eco?.display_name || ""}
        app="eco"
      />

      {/* Edit button outside the info card */}
      {!readOnly && !isReleased && (
        <EditEcoForm
          eco={eco}
          setRefresh={setRefresh}
          profiles={profiles}
        />
      )}

      {/* Full width layout like DisplayRequirement */}
      <Row>
        <Col>
          {/* Info Card - Full width */}
          <EcoInfoCard
            eco={eco}
            setRefresh={setRefresh}
            readOnly={readOnly}
            profiles={profiles}
          />

          {/* Description - Full width */}
          <DokulyCard
            isCollapsed={!eco?.description_text}
            expandText={"Add description"}
            isHidden={!eco?.description_text && (readOnly || isReleased)}
            hiddenText={"No description added"}
          >
            <CardTitle
              titleText={"Description"}
              optionalHelpText={
                "Describe the engineering change order. Use markdown for formatting."
              }
            />
            <EditableMarkdown
              initialMarkdown={eco?.description_text || ""}
              onSubmit={handleDescriptionSubmit}
              showEmptyBorder={true}
              readOnly={readOnly || isReleased}
            />
          </DokulyCard>

          {/* Affected Items Table */}
          <AffectedItemsTable
            ecoId={id}
            isReleased={isReleased}
            readOnly={readOnly}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DisplayEco;
