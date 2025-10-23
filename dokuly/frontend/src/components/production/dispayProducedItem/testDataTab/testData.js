import React, { useState, useEffect } from "react";
import { Row, Col, Card, Badge } from "react-bootstrap";
import { getProducedItemMeasurements } from "../../functions/queries";
import DokulyCard from "../../../dokuly_components/dokulyCard";
import VectorChart from "../../../dokuly_components/vectorChart";

const TestData = ({ producedItem }) => {
  const [measurementGroups, setMeasurementGroups] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (!producedItem) return;

    const item = producedItem.assembly || producedItem.part || producedItem.pcba;

    if (item) {
      getProducedItemMeasurements(
        (() => {
          const useNumberRevisions = item?.organization?.use_number_revisions || false;
          if (useNumberRevisions) {
            // For number revisions, full_part_number already includes the revision with underscore
            return item.full_part_number;
          }
          // For letter revisions, append the revision to the base part number
          return `${item.full_part_number}${item.revision}`;
        })(),
        producedItem.serial_number
      )
        .then((res) => {
          const { scalar_measurements = [], vector_measurements = [] } = res.data || {};
          const groupedMeasurements = {};

          [...scalar_measurements, ...vector_measurements].forEach((measurement) => {
            if (!measurement?.step_title || !measurement?.step_group) return;

            const groupKey = measurement.step_group || "Ungrouped";
            const stepKey = measurement.step_title;

            if (!groupedMeasurements[groupKey]) {
              groupedMeasurements[groupKey] = {};
            }
            if (!groupedMeasurements[groupKey][stepKey]) {
              groupedMeasurements[groupKey][stepKey] = [];
            }

            groupedMeasurements[groupKey][stepKey].push({
              ...measurement,
              isPass: isWithinLimits(measurement),
            });
          });

          Object.values(groupedMeasurements).forEach((group) =>
            Object.values(group).forEach((steps) =>
              steps.sort((a, b) => new Date(b.creation_date || 0) - new Date(a.creation_date || 0))
            )
          );

          setMeasurementGroups(groupedMeasurements);

          // Initialize all groups as collapsed
          const initialExpandedGroups = Object.keys(groupedMeasurements).reduce(
            (acc, key) => ({ ...acc, [key]: false }),
            {}
          );
          setExpandedGroups(initialExpandedGroups);
        })
        .catch((error) => console.error("Error fetching measurements:", error));
    }
  }, [producedItem?.id]);

  const isWithinLimits = (measurement) => {
    const { measurement: value, upper_limit, lower_limit, measurements_y } = measurement || {};

    if (measurements_y) {
      // For vector measurements, check if all Y values are within limits
      return measurements_y.every(
        (y) => y >= (lower_limit || -Infinity) && y <= (upper_limit || Infinity)
      );
    }

    // For scalar measurements, check the single value
    return (
      value !== undefined &&
      value !== null &&
      value >= (lower_limit || -Infinity) &&
      value <= (upper_limit || Infinity)
    );
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  return (
    <DokulyCard
      title="Measurements"
      expandText="View Measurements"
      isHidden={!Object.keys(measurementGroups).length}
      hiddenText="No measurements available. Upload production measurement data through the Dokuly API, and they will appear here."
    >
      {Object.entries(measurementGroups).map(([group, steps]) => (
        <div key={group} className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <button
              type="button"
              className="btn btn-bg-transparent"
              onClick={() => toggleGroup(group)}
            >
              <img
                src={
                  expandedGroups[group]
                    ? "/static/icons/circle-minus.svg"
                    : "/static/icons/circle-plus.svg"
                }
                alt={expandedGroups[group] ? "collapse" : "expand"}
                style={{ marginRight: "5px" }}
              />
              <span className="fw-bold">{group}</span>
            </button>
            <div className="flex-grow-1 border-bottom ms-2"></div>
          </div>
          {expandedGroups[group] && (
            <div>
              {Object.entries(steps).map(([stepTitle, measurements], stepIndex) => (
                <Card key={stepIndex} className="mb-3">
                  <Card.Header>
                    <Row className="align-items-center">
                      <Col>
                        <h6 className="mb-0">{stepTitle || "Unknown Step"}</h6>
                      </Col>
                      <Col xs="auto">
                        <Badge text="light" bg={measurements[0]?.isPass ? "success" : "danger"}>
                          {measurements[0]?.isPass ? "Pass" : "Fail"}
                        </Badge>
                      </Col>
                    </Row>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col>
                      <h5>Latest Measurement</h5>
                    {measurements[0]?.measurements_x && measurements[0]?.measurements_y ? (
                      <VectorChart measurement={measurements[0]} />
                    ) : (
                      <p>
                        {measurements[0]?.measurement.toLocaleString() ?? "N/A"} {measurements[0]?.unit ?? ""}
                      </p>
                    )}
                    <p>
                      <small>
                        Limits:{" "}
                        {measurements[0]?.lower_limit !== undefined
                          ? measurements[0].lower_limit.toLocaleString()
                          : "N/A"}{" "}
                        -{" "}
                        {measurements[0]?.upper_limit !== undefined
                          ? measurements[0].upper_limit.toLocaleString()
                          : "N/A"}
                      </small>
                    </p>
                      </Col>
                      <Col>
                      <h5>All Instances</h5>
                    {measurements.map((measurement, index) => (
                      <div key={index} className="mb-2">
                        <strong>
                          {measurement?.creation_date
                            ? new Date(measurement.creation_date).toLocaleString()
                            : "Unknown Date"}
                        </strong>
                        {measurement?.measurements_x && measurement?.measurements_y ? (
                          <VectorChart measurement={measurement} />
                        ) : (
                          <p>
                            {measurement.measurement.toLocaleString() ?? "N/A"} {measurement.unit ?? ""}
                          </p>
                        )}
                      </div>
                    ))}
                      </Col>
                    </Row>
                    
                   
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </DokulyCard>
  );
};

export default TestData;
