import React, { useEffect, useState } from "react";
import { getProducedItemTestData } from "../../functions/queries";
import VerticalTimeline from "../../../dokuly_components/verticalTimeline";
import { Row, Col } from "react-bootstrap";
import DokulyCard from "../../../dokuly_components/dokulyCard";

const TestData = ({ producedItem }) => {
  const [testData, setTestData] = useState([]);

  useEffect(() => {
    if (!producedItem) return;

    const item =
      producedItem.assembly || producedItem.part || producedItem.pcba;

    if (item) {
      getProducedItemTestData(
        item.full_part_number + item.revision,
        producedItem.serial_number,
      )
        .then((res) => {
          const stepData = {};
          res.data.forEach((test) => {
            const stepKey = `Step ${test.step_number}: ${test.step_title}`;
            // Ensure we're only storing the most recent test data for each step
            if (
              !stepData[stepKey] ||
              stepData[stepKey].date < new Date(test.creation_date)
            ) {
              stepData[stepKey] = {
                title: stepKey,
                description: Object.entries(test.test_data)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", "),
                status: test.status || "pending", // Default to "pending" if null
                date: new Date(test.creation_date),
              };
            }
          });

          // Convert the object into an array of latest step data sorted by the step number
          const sortedTestData = Object.values(stepData).sort(
            (a, b) => a.date - b.date,
          );
          setTestData(sortedTestData);
        })
        .catch((error) => {
          console.error("Error fetching test data:", error);
        });
    }
  }, [producedItem?.id]);

  return (
    <DokulyCard
      title="Last test data"
      expandText="Last test data"
      isHidden={!testData.length}
      hiddenText="No test data available"
    >
      <Row>
        <Col sm={4}>
          <h5>
            <b>Last test run</b>
          </h5>
        </Col>
      </Row>
      <Row>
        <Col>
          <VerticalTimeline steps={testData} />
        </Col>
      </Row>
    </DokulyCard>
  );
};

export default TestData;
