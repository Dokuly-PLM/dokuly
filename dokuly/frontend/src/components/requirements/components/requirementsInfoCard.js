import React from "react";
import { Col, ProgressBar, Row } from "react-bootstrap";
import DokulyCard from "../../dokuly_components/dokulyCard";
import { useNavigate } from "react-router";
import CardTitle from "../../dokuly_components/cardTitle";
import QuestionToolTip from "../../dokuly_components/questionToolTip";

const RequirementsSetInfoCard = ({ requirementSet }) => {
  const navigate = useNavigate();

  // Calculate the percentage of verified requirements
  const totalRequirements = requirementSet?.requirement_count || 0;
  const verifiedRequirements = requirementSet?.verified_count || 0;
  const verificationProgress =
    totalRequirements > 0
      ? (verifiedRequirements / totalRequirements) * 100
      : 0;
  const verificationProgressFormatted = `${verificationProgress.toFixed(1)}%`; // Format to one decimal place

  // Determine the color based on verification progress
  const getColor = (progress) => {
    if (progress < 33) {
      return "danger"; // Red
    }
    if (progress < 75) {
      return "warning"; // Yellow
    }
    return "success"; // Green
  };

  return (
    <Col className="col-12">
      <DokulyCard>
        <CardTitle titleText={"Information"} />
        <Col className="col-md-8 col-lg-10 col-xl-10">
          <InfoRow
            label="Project:"
            value={requirementSet?.project?.title}
            onClick={() => navigate(`/projects/${requirementSet?.project?.id}`)}
            style={{ cursor: "pointer" }}
          />
          <InfoRow label="Number of requirements:" value={totalRequirements} />
          <InfoRow
            label="Verification:"
            toolTip={
              "- Shows the status of the requirements set's verification."
            }
            toolTipTitle={"Verification Progress"}
            value={
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="mr-2">
                  {verifiedRequirements} / {totalRequirements}
                </span>
                <ProgressBar
                  now={verificationProgress}
                  variant={getColor(verificationProgress)}
                  label=""
                  style={{ width: "25%", marginRight: "10px" }}
                />
                <span>{verificationProgressFormatted}</span>
              </div>
            }
          />
        </Col>
      </DokulyCard>
    </Col>
  );
};

export const InfoRow = ({
  label,
  value,
  onClick,
  style = {},
  toolTip,
  toolTipTitle,
  rowClassname = "",
  firstColClassname = "col-lg-4 col-xl-4",
  secondColClassname = "",
}) => (
  <Row onClick={onClick} style={style} className={rowClassname}>
    <Col className={`${firstColClassname} align-items-center`}>
      <b className="mr-2">{label}</b>
      {toolTip && (
        <QuestionToolTip
          optionalHelpText={toolTip}
          titleText={toolTipTitle}
          placement="right"
        />
      )}
    </Col>
    <Col className={secondColClassname}>{value}</Col>
  </Row>
);

export default RequirementsSetInfoCard;
