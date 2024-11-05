import React from "react";
import { editRevisionNotes } from "./queries";
import DokulyCard from "../dokulyCard";
import CardTitle from "../cardTitle";
import EditableMarkdown from "../dokulyMarkdown/editableMarkdown";
import { Col, Container } from "react-bootstrap";

const RevisionNotes = ({ app, item, setRefresh }) => {
  const handleMarkdownSubmit = (markdownText) => {
    if (markdownText === undefined || markdownText == null) {
      return;
    }

    editRevisionNotes(item?.id, app, markdownText).then((res) => {
      if (res.status === 201) {
        if (setRefresh !== undefined) {
          setRefresh(true);
        }
      }
    });
  };

  return (
    <Col className="p-0" style={{ marginRight: "2rem" }}>
      <DokulyCard
        isCollapsed={!item?.revision_notes || item?.revision_notes === ""}
        expandText={"Add revision notes"}
        isHidden={
          (item?.revision === "A" &&
            (!item?.revision_notes || item?.revision_notes === "")) ||
          ((!item?.revision_notes || item?.revision_notes === "") &&
            item?.release_state === "Released")
        }
        hiddenText={
          item?.revision === "A"
            ? "No notes for first revision"
            : "No revision notes for this item"
        }
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <CardTitle
            titleText={"Revision notes"}
            optionalHelpText={
              "The revision notes field is used to document changes between the revisions of the item."
            }
            style={{}}
          />
        </div>
        <div className="row" style={{ maxWidth: "inherit" }}>
          <Col style={{ lineBreak: "strict", maxWidth: "inherit" }}>
            <EditableMarkdown
              initialMarkdown={item?.revision_notes}
              onSubmit={handleMarkdownSubmit}
              showEmptyBorder={false}
              projectId={item.project}
              readOnly={item?.release_state === "Released"}
            />
          </Col>
        </div>
      </DokulyCard>
    </Col>
  );
};

export default RevisionNotes;
