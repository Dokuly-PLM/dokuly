import React, { useEffect, useState } from "react";
import moment from "moment";
import { Row, Col } from "react-bootstrap";
import { releaseStateFormatter } from "./formatters/releaseStateFormatter";
import { useNavigate } from "react-router";
import { attribute_icons } from "./attributeIcons";
import { getProfile } from "../profiles/functions/queries";
import { getProjectWithCustomer } from "../projects/functions/queries";
import { fetchProtectionLevels } from "../admin/functions/queries";
import ThumbnailDisplay from "./thumbnailDisplay";
import DokulyImage from "./dokulyImage";
import DokulyCard from "./dokulyCard";
import CardTitle from "./cardTitle";
import { getName } from "country-list";
import ReactCountryFlag from "react-country-flag";
import { updatePartField } from "../parts/functions/utilities";
import DokulyTags from "./dokulyTags/dokulyTags";

const renderAdditionalFields = (additionalFields) => {
  return Object.entries(additionalFields)
    .filter(
      ([key, value]) => value !== "" && value !== null && value !== undefined
    )
    .map(([key, value], index) => (
      <Row key={index}>
        <Col className="col-lg-6 col-xl-6">
          <b>{key}:</b>
        </Col>
        <Col>{value.toString()}</Col>
      </Row>
    ));
};

/**
 * Component for displaying common part information (pcba/asm/document).
 *
 * @param {Object} props - The properties object.
 * @param {Object} props.item - The item object containing information about the part.
 * @param {string} [props.app=""] - The name of the app related to the part.
 * @param {string} [props.thumbnail_url=""] - URL for the thumbnail image of the part.
 * @param {string} [props.git_link=""] - URL to the Git repository associated with the part.
 * @param {string} [props.datasheet_url=""] - URL to the datasheet of the part.
 * @param {string} [props.description=""] - Description of the part.
 * @param {string} [props.last_updated=""] - The last updated date of the part information.
 * @param {Object} [props.additional_fields={}] - Additional fields related to the part.
 * @param {Object} [props.attributes={}] - Attributes of the part.
 * @param {Function} [props.setRefresh] - Function to trigger a refresh of the part information.
 * @param {Function} [props.updateItemField=() => {}] - Function to update a specific field of the item.
 *
 * @returns {JSX.Element} The JSX element for the part information card.
 */
const PartInformationCard = ({
  item,
  app = "",
  thumbnail_url = "",
  git_link = "",
  datasheet_url = "",
  description = "",
  last_updated = "",
  additional_fields = {},
  attributes = {},
  setRefresh,
  updateItemField = () => {},
}) => {
  const navigate = useNavigate();

  const [created_by, setCreatedBy] = useState(null);
  const [quality_assurance, setQualityAssurance] = useState(null);
  const [project, setProject] = useState(null);
  const [protectionLevel, setProtectionLevel] = useState(null);

  useEffect(() => {
    if (item?.created_by !== null && item?.created_by !== undefined) {
      getProfile(item.created_by).then((res) => {
        if (res.data !== null && res.data !== undefined) {
          setCreatedBy(res.data);
        }
      });
    }
  }, [item?.created_by]);

  useEffect(() => {
    if (
      item?.quality_assurance !== null &&
      item?.quality_assurance !== undefined
    ) {
      getProfile(item.quality_assurance).then((res) => {
        if (res.data !== null && res.data !== undefined) {
          setQualityAssurance(res.data);
        }
      });
    }
  }, [item?.quality_assurance]);

  useEffect(() => {
    if (item?.project != null && item?.project !== undefined) {
      getProjectWithCustomer(item.project).then((res) => {
        if (res.status === 200) {
          setProject(res.data);
        }
      });
    } else {
      setProject({ id: 0 });
    }
  }, [item?.project]);

  useEffect(() => {
    // Fetch protection level for documents
    if (app === "documents" && item?.protection_level !== null && item?.protection_level !== undefined) {
      fetchProtectionLevels().then((res) => {
        if (res.status === 200) {
          const level = res.data.find(pl => pl.id === item.protection_level);
          if (level) {
            setProtectionLevel(level);
          }
        }
      });
    }
  }, [app, item?.protection_level]);

  const changeField = (key, value) => {
    if (item?.id == null) {
      return;
    }
    if (key == null) {
      return;
    }

    updateItemField(item.id, key, value);
    // Wait for the update to be done before refreshing
    setTimeout(() => {
      setRefresh(true);
    }, 300);
  };

  const handleTagsChange = (newTags) => {
    // New array with tag ids
    changeField("tags", newTags);
  };

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />
      <Row style={{ paddingLeft: "15px" }}>
        {thumbnail_url !== "" ? (
          <div className="col-auto">
            <DokulyImage
              className="rounded"
              style={{ maxWidth: "100px", width: "100%" }}
              alt="Item"
              src={thumbnail_url}
            />
          </div>
        ) : (
          <ThumbnailDisplay
            item_id={item.id}
            app={app}
            releaseState={item.release_state}
            setRefresh={setRefresh}
            thumbnailId={item?.thumbnail}
          />
        )}
        <Col className="col-md-6 col-lg-10 col-xl-10">
          {project !== null && project !== undefined && (
            <Row
              onClick={() => navigate(`/projects/${project?.id}`)}
              style={{ cursor: "pointer" }}
            >
              <Col className="col-lg-6 col-xl-6">
                <b>Project:</b>
              </Col>
              <Col>{project?.title}</Col>
            </Row>
          )}

          <Row>
            <Col className="col-lg-6 col-xl-6">
              <b>State:</b>
            </Col>
            <Col>{releaseStateFormatter(item)}</Col>
          </Row>

          {created_by !== null && created_by !== undefined && (
            <Row>
              <Col className="col-lg-6 col-xl-6">
                <b>Created by:</b>
              </Col>
              <Col>{`${created_by?.first_name} ${created_by?.last_name}`}</Col>
            </Row>
          )}

          {quality_assurance !== null && quality_assurance !== undefined && (
            <Row>
              <Col className="col-lg-6 col-xl-6">
                <b>Quality assurance:</b>
              </Col>
              <Col>{`${quality_assurance?.first_name} ${quality_assurance?.last_name}`}</Col>
            </Row>
          )}

          {description !== "" && description != null && (
            <Row>
              <Col className="col-lg-6 col-xl-6">
                <b>Description:</b>
              </Col>
              <Col>{description}</Col>
            </Row>
          )}

          {app === "documents" && protectionLevel !== null && (
            <Row>
              <Col className="col-lg-6 col-xl-6">
                <b>Protection Level:</b>
              </Col>
              <Col>
                <span title={protectionLevel.description || ""}>
                  {protectionLevel.name}
                </span>
              </Col>
            </Row>
          )}

          {last_updated !== "" && (
            <Row>
              <Col className="col-lg-6 col-xl-6">
                <b>Last modified:</b>
              </Col>
              <Col>{moment(last_updated).format("HH:mm D.M.Y")}</Col>
            </Row>
          )}

          {git_link !== "" && (
            <Row>
              <Col className="col-lg-6 col-xl-6" />
              <Col>
                <a href={git_link} target="_blank" rel="noreferrer">
                  <img
                    className="icon-dark"
                    src="../../static/icons/git-merge.svg"
                    alt="icon"
                    width={"40px"}
                    title="Click to open the git repository"
                  />
                </a>
              </Col>
            </Row>
          )}

          {Object.keys(additional_fields).length > 0 &&
            renderAdditionalFields(additional_fields)}

          {datasheet_url !== "" && datasheet_url !== null && (
            <Row>
              <Col className="col-lg-6 col-xl-6">
                <b>Datasheet:</b>
              </Col>
              <Col>
                <a
                  className="border-bottom"
                  href={datasheet_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    className="icon-dark"
                    src="../../static/icons/pdf.svg"
                    alt="icon"
                    width={"40px"}
                    title="Click to open the datasheet"
                  />
                </a>
              </Col>
            </Row>
          )}

          {item?.country_of_origin && (
            <Row>
              <Col className="col-lg-6 col-xl-6">
                <b>Country of Origin:</b>
              </Col>
              <Col>
                <span className="align-items-center">
                  <ReactCountryFlag
                    style={{ marginRight: "0.5rem" }}
                    countryCode={item.country_of_origin}
                    svg
                  />
                  {getName(item.country_of_origin) ?? item.country_of_origin}
                </span>
              </Col>
            </Row>
          )}

          {attributes && Object.keys(attributes).length > 0 && (
            <Row>
              <div className="col-3">
                <b>Attributes:</b>
              </div>
              <Col>{attribute_icons(attributes)}</Col>
            </Row>
          )}
          <Row className="mt-2 align-items-top">
            <Col className="col-lg-6 col-xl-6">
              <b>Tags</b>
            </Col>
          </Row>
          <Row className="mt-2 align-items-top">
            <Col className="col-auto">
              <DokulyTags
                tags={item?.tags ?? []}
                onChange={handleTagsChange}
                readOnly={false}
                project={project}
                setRefresh={setRefresh}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </DokulyCard>
  );
};

export default PartInformationCard;
