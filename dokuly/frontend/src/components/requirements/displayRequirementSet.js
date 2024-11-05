import React, { useState, useEffect, useContext } from "react";
import { Row, Col } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

import {
  editRequirementSet,
  getRequirementSet,
  getRequirementsBySet,
} from "./functions/queries";
import Heading from "../dokuly_components/Heading";
import DokulyCard from "../dokuly_components/dokulyCard";
import EditableMarkdown from "../dokuly_components/dokulyMarkdown/editableMarkdown";
import RequirementsTable from "./requirementsTable";
import CardTitle from "../dokuly_components/cardTitle";
import useProfile from "../common/hooks/useProfile";
import { checkProfileIsAllowedToEdit } from "../common/functions";
import { AuthContext } from "../App";
import EditRequirementsSetForm from "./forms/editRequirementsSetForm";
import RequirementsSetInfoCard from "./components/requirementsInfoCard";

const DisplayRequirementSet = (props) => {
  const location = useLocation();

  const [id, setId] = useState(-1);
  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setId(parseInt(split[6]));
  }, [location]);

  const [profile, refreshProfile] = useProfile();

  const [readOnly, setReadOnly] = useState(false);
  useEffect(() => {
    if (profile === null || profile === undefined) {
      return;
    }
    const isAllowed = checkProfileIsAllowedToEdit(profile?.role);
    setReadOnly(!isAllowed);
  }, [profile]);

  const [refresh, setRefresh] = useState(true);
  const [requirementSet, setRequirementSet] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [filterType, setFilterType] = useState("lowest"); // 'lowest', 'top', 'all'
  const [filteredRequirements, setFilteredRequirements] = useState([]);

  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    let filtered = [];
    switch (filterType) {
      case "lowest":
        filtered = requirements.filter(
          (req) => !requirements.some((r) => r.parent_requirement === req.id)
        );
        break;
      case "top":
        filtered = requirements.filter(
          (req) => req.parent_requirement === null
        );
        break;
      case "all":
        filtered = requirements;
        break;
      default:
        filtered = requirements;
    }
    setFilteredRequirements(filtered);
  }, [requirements, filterType]);

  useEffect(() => {
    if (refresh === false && requirementSet !== null) {
      return;
    }
    if (id === null || id === -1) {
      return;
    }

    document.title = "Requirements | Dokuly";

    getRequirementSet(id)
      .then((res) => {
        if (res.status === 200 && res.data !== null) {
          setRequirementSet(res.data);
        }
      })
      .catch((error) => {
        if (error.response.status === 401) {
          setIsAuthenticated(false);
          toast.error("Unauthorized");
        }
      });
    setRefresh(false);
  }, [id, refresh]);

  useEffect(() => {
    if (refresh === false && requirements.length > 0) {
      return;
    }
    if (id === null || id === -1) {
      return;
    }
    getRequirementsBySet(id)
      .then((res) => {
        if (res.status === 200 && res.data !== null) {
          setRequirements(res.data);
        }
      })
      .catch((error) => {
        if (error.response.status === 401) {
          setIsAuthenticated(false);
          toast.error("Unauthorized");
        }
      });
  }, [id, refresh]);

  const handleMarkdownSubmit = (markdown) => {
    const data = {
      description: markdown,
    };
    editRequirementSet(id, data).then(
      (result) => {
        if (result.status === 200) {
          setRefresh(true);
        }
      },
      (error) => {
        console.log(error);
        if (error.response.status === 401) {
          setIsAuthenticated(false);
          toast.error("Unauthorized");
        }
      }
    );
  };

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NavLink to={"/requirements"}>
        <img
          // width="15px"
          className="icon-dark p-2 arrow-back"
          src="../../static/icons/arrow-left.svg"
          alt="icon"
        />
      </NavLink>

      <Heading
        item_number={`Set: ${id}`}
        display_name={requirementSet?.display_name}
        app="requirements"
      />
      <EditRequirementsSetForm
        requirementSet={requirementSet}
        setRefresh={setRefresh}
        readOnly={readOnly}
      />

      <Row>
        <RequirementsSetInfoCard requirementSet={requirementSet} />
      </Row>

      <Row>
        <Col className="col-12">
          <DokulyCard>
            <CardTitle titleText={"Description"} />
            <Row>
              <EditableMarkdown
                initialMarkdown={requirementSet?.description}
                onSubmit={handleMarkdownSubmit}
                showEmptyBorder={true}
                readOnly={readOnly}
              />
            </Row>
          </DokulyCard>
        </Col>
      </Row>

      <DokulyCard>
        <CardTitle titleText={"Requirements"} />
        {/* Add dropdown for filter options */}
        <div
          style={{
            paddingLeft: "10px",
            paddingRight: "10px",
            marginTop: "5px",
            marginBottom: "5px",
          }}
        >
          <label
            style={{
              paddingLeft: "5px",
              paddingRight: "10px",
              marginBottom: "10px",
            }}
          >
            <select
              className="form-control"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="lowest">Lowest Level Requirements</option>
              <option value="top">Top Level Requirements</option>
              <option value="all">All Requirements</option>
            </select>
          </label>

          <RequirementsTable
            requirements={filteredRequirements}
            set_id={id}
            setRefresh={setRefresh}
            refresh={refresh}
            readOnly={readOnly}
          />
        </div>
      </DokulyCard>
    </div>
  );
};

export default DisplayRequirementSet;
