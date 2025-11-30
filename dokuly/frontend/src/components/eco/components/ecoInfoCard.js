import React, { useMemo, useState, useEffect } from "react";
import { Row, Col, Container, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import DokulyTags from "../../dokuly_components/dokulyTags/dokulyTags";
import { editEco, getEcoMissingBomItems } from "../functions/queries";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import MissingBomItemsList from "./missingBomItemsList";

const EcoInfoCard = ({
  eco,
  setRefresh,
  readOnly = false,
  profiles = [],
  affectedItems = [],
}) => {
  const navigate = useNavigate();
  const [missingBomItems, setMissingBomItems] = useState([]);
  const [showMissingBomTooltip, setShowMissingBomTooltip] = useState(false);

  // Fetch missing BOM items when eco or affected items change
  useEffect(() => {
    if (eco?.id && eco?.release_state !== "Released") {
      getEcoMissingBomItems(eco.id)
        .then((res) => {
          if (res.status === 200) {
            setMissingBomItems(res.data.missing_items || []);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch missing BOM items:", err);
        });
    } else {
      setMissingBomItems([]);
    }
  }, [eco?.id, eco?.release_state, affectedItems]);

  const getResponsibleOptions = () => {
    return profiles
      .filter((profile) => profile.is_active)
      .map((profile) => ({
        value: profile.id,
        label: `${profile.first_name} ${profile.last_name}`,
      }));
  };

  const changeField = (key, value) => {
    if (eco?.id == null || key == null) {
      return;
    }

    const data = { [key]: value };
    editEco(eco.id, data).then(
      (result) => {
        if (result.status === 200) {
          setRefresh(true);
        }
      },
      (error) => {
        toast.error("Failed to update ECO");
      }
    );
  };

  const handleTagsChange = (newTags) => {
    // Send full tag objects so new tags (id=-1) can be created
    const tagsData = newTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }));
    changeField("tags", tagsData);
  };

  const isReleased = eco?.release_state === "Released";
  const keyColumnMaxWidth = "140px";

  // Calculate review statistics from affected items
  const reviewStats = useMemo(() => {
    // Only count items that have an actual linked item (not empty rows)
    const itemsWithLinks = affectedItems.filter(
      (item) => item.part || item.pcba || item.assembly || item.document
    );
    const totalItems = itemsWithLinks.length;
    const reviewedItems = itemsWithLinks.filter(
      (item) => item.quality_assurance_id != null
    ).length;
    const progress = totalItems > 0 ? (reviewedItems / totalItems) * 100 : 0;

    return {
      total: totalItems,
      reviewed: reviewedItems,
      progress,
    };
  }, [affectedItems]);

  // Determine the color based on review progress
  const getProgressColor = (progress) => {
    if (progress < 33) {
      return "danger"; // Red
    }
    if (progress < 75) {
      return "warning"; // Yellow
    }
    return "success"; // Green
  };

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />

      <Container fluid>
        {/* Project - Display only, edit via Edit form */}
        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
            <b>Project:</b>
          </Col>
          <Col>
            {eco?.project?.title || <span className="text-muted">No project</span>}
          </Col>
        </Row>

        {/* State - Display only, like partInfoCard */}
        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
            <b>State:</b>
          </Col>
          <Col>
            {releaseStateFormatter(eco)}
          </Col>
        </Row>

        {/* Responsible - Inline editing allowed */}
        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
            <b>Responsible:</b>
          </Col>
          <Col>
            <GenericDropdownSelector
              state={eco?.responsible?.id || ""}
              setState={(value) => changeField("responsible", value)}
              dropdownValues={getResponsibleOptions()}
              placeholder="Select responsible"
              borderIfPlaceholder={true}
              readOnly={readOnly || isReleased}
              textSize="14px"
            />
          </Col>
        </Row>

        {/* Created date */}
        <Row className="align-items-center mb-2">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
            <b>Created:</b>
          </Col>
          <Col>
            <DokulyDateFormat date={eco?.created_at} />
          </Col>
        </Row>

        {/* Created by */}
        {eco?.created_by_name && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Created by:</b>
            </Col>
            <Col>{eco.created_by_name}</Col>
          </Row>
        )}

        {/* Quality assurance */}
        {eco?.quality_assurance && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Quality assurance:</b>
            </Col>
            <Col>{`${eco.quality_assurance?.first_name} ${eco.quality_assurance?.last_name}`}</Col>
          </Row>
        )}

        {/* Released date */}
        {eco?.released_date && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Released:</b>
            </Col>
            <Col>
              <DokulyDateFormat date={eco?.released_date} />
            </Col>
          </Row>
        )}

        {/* Released by */}
        {eco?.released_by_name && (
          <Row className="align-items-center mb-2">
            <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
              <b>Released by:</b>
            </Col>
            <Col>{eco.released_by_name}</Col>
          </Row>
        )}

        {/* Review Progress Bar */}
        {reviewStats.total > 0 && (
          <>
            <hr />
            <Row className="align-items-center mb-2">
              <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
                <b>Review Progress:</b>
              </Col>
              <Col>
                <div className="d-flex align-items-center">
                  <span className="mr-2" style={{ fontSize: "0.875rem" }}>
                    {reviewStats.reviewed} / {reviewStats.total}
                  </span>
                  <ProgressBar
                    now={reviewStats.progress}
                    variant={getProgressColor(reviewStats.progress)}
                    style={{ width: "100px", height: "12px", marginRight: "10px" }}
                  />
                  <span style={{ fontSize: "0.875rem" }}>
                    {reviewStats.progress.toFixed(0)}%
                  </span>
                </div>
              </Col>
            </Row>
          </>
        )}

        {/* Missing BOM Items Warning */}
        {missingBomItems.length > 0 && !isReleased && (
          <Row className="align-items-center mb-2">
            <Col>
              <div style={{ position: "relative", display: "inline-block" }}>
                <div
                  onMouseEnter={() => setShowMissingBomTooltip(true)}
                  onMouseLeave={() => setShowMissingBomTooltip(false)}
                >
                  <span 
                    className="badge badge-pill badge-warning"
                    style={{ cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    {missingBomItems.length} BOM item{missingBomItems.length !== 1 ? 's' : ''} not in ECO
                  </span>
                  <MissingBomItemsList 
                    items={missingBomItems} 
                    show={showMissingBomTooltip}
                    textSize="12px"
                    style={{
                      top: "100%",
                      left: "0",
                      marginTop: "5px",
                    }}
                  />
                </div>
              </div>
            </Col>
          </Row>
        )}

        {/* Tags */}
        <hr />
        <Row className="mt-2 align-items-top">
          <Col className="col-lg-6 col-xl-6" style={{ maxWidth: keyColumnMaxWidth }}>
            <b>Tags</b>
          </Col>
        </Row>
        <Row className="mt-2 align-items-top">
          <Col className="col-auto">
            <DokulyTags
              tags={eco?.tags ?? []}
              onChange={handleTagsChange}
              readOnly={readOnly || isReleased}
              project={eco?.project ?? { id: 0 }}
              setRefresh={setRefresh}
            />
            {!eco?.project && (
              <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                Using organization tags. Attach to a project for project-specific tags.
              </span>
            )}
          </Col>
        </Row>
      </Container>
    </DokulyCard>
  );
};

export default EcoInfoCard;
