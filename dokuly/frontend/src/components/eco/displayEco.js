import React, { useState, useEffect, useContext } from "react";
import { Row, Col } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

import { getEco, editEco } from "./functions/queries";
import { tokenConfig } from "../../configs/auth";
import DokulyCard from "../dokuly_components/dokulyCard";
import DokulyTabs from "../dokuly_components/dokulyTabs/dokulyTabs";
import EditableMarkdown from "../dokuly_components/dokulyMarkdown/editableMarkdown";
import CardTitle from "../dokuly_components/cardTitle";
import Heading from "../dokuly_components/Heading";
import EcoInfoCard from "./components/ecoInfoCard";
import { AuthContext } from "../App";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import useProfile from "../common/hooks/useProfile";
import { checkProfileIsAllowedToEdit } from "../common/functions";
import TextFieldEditor from "../dokuly_components/dokulyTable/components/textFieldEditor";

const DisplayEco = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [profile, refreshProfile] = useProfile();
  
  const [id, setId] = useState(-1);
  const [eco, setEco] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [readOnly, setReadOnly] = useState(false);
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(false);

  // Get ECO ID from URL
  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setId(Number.parseInt(split[4]));
  }, [location]);

  // Check permissions
  useEffect(() => {
    if (!profile) return;
    const isAllowed = checkProfileIsAllowedToEdit(profile?.role);
    setReadOnly(!isAllowed);
  }, [profile]);

  // Fetch ECO data
  useEffect(() => {
    if (id === -1) return;
    
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
    if (!refresh || id === -1) return;
    
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

  const handleDisplayNameChange = (newName) => {
    editEco(id, { display_name: newName })
      .then((res) => {
        if (res.status === 200) {
          setRefresh(true);
        }
      })
      .catch((err) => {
        toast.error("Failed to update name");
      });
  };

  const isReleased = eco?.release_state === "Released";

  const MainContent = () => (
    <Row>
      <Col md={4}>
        <EcoInfoCard
          eco={eco}
          setRefresh={setRefresh}
          readOnly={readOnly}
          profiles={profiles}
        />
      </Col>
      <Col md={8}>
        <DokulyCard
          isCollapsed={descriptionCollapsed && !eco?.description_text}
          expandText={"Add description"}
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
      </Col>
    </Row>
  );

  const tabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: <MainContent />,
    },
  ];

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
      <Row className="align-items-center mb-2">
        <Col>
          <Heading
            item_number={`ECO-${eco?.id || ""}`}
            display_name={
              <TextFieldEditor
                text={eco?.display_name || ""}
                setText={handleDisplayNameChange}
                placeholder="Enter ECO name..."
                readOnly={readOnly || isReleased}
                style={{ fontSize: "1.5rem", fontWeight: "500" }}
              />
            }
          />
        </Col>
      </Row>

      {/* Tabs */}
      <DokulyTabs tabs={tabs} basePath={`/eco/${id}`} />
    </div>
  );
};

export default DisplayEco;
