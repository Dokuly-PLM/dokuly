import React from "react";
import { editErrata } from "./queries";
import CardTitle from "../../dokuly_components/cardTitle";
import DokulyCard from "../../dokuly_components/dokulyCard";
import EditableMarkdown from "../../dokuly_components/dokulyMarkdown/editableMarkdown";
import { Col } from "react-bootstrap";

const Errata = ({ app, item, setRefresh }) => {
  const handleMarkdownSubmit = (markdownText) => {
    if (markdownText === undefined || markdownText == null) {
      return;
    }

    editErrata(item?.id, app, markdownText).then((res) => {
      if (res.status === 201) {
        if (setRefresh !== undefined) {
          setRefresh(true);
        }
      }
    });
  };

  // Conditional styling for the card-body based on errata content
  const cardBodyStyle = item?.errata
    ? { maxWidth: "60rem", border: "1px solid red" }
    : { maxWidth: "60rem" };

  return (
    <Col className="p-0" style={{ marginRight: "2rem" }}>
      <DokulyCard
        style={cardBodyStyle}
        isCollapsed={!item?.errata || item?.errata === ""}
        expandText={"Add errata"}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <CardTitle
            titleText={"Errata"}
            optionalHelpText={
              "The errata field is used to document faults with the item. The field can always be updated with new information."
            }
            style={{}}
          />
        </div>
        <div className="row" style={{ maxWidth: "inherit" }}>
          <div
            className="col"
            style={{ lineBreak: "strict", maxWidth: "inherit" }}
          >
            <EditableMarkdown
              initialMarkdown={item?.errata}
              onSubmit={handleMarkdownSubmit}
              showEmptyBorder={false}
              projectId={item.project}
            />
          </div>
        </div>
      </DokulyCard>
    </Col>
  );
};

export default Errata;
