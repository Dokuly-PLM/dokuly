import React, { useState, useEffect, useCallback } from "react";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import EditableMarkdown from "../../dokuly_components/dokulyMarkdown/editableMarkdown";
import { Col, Row } from "react-bootstrap";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";
import NotesTabs from "../../dokuly_components/dokulyMarkdown/notesTabs";
import useMarkdownTabs from "../hooks/useMarkdownTabs";
import { updateMarkdownTab } from "../../dokuly_components/dokulyMarkdown/functions/utils";

export function markdownComponent(markdownObject, projectId, onNotesUpdate) {
  return (
    <Col>
      <Row className="mt-2">
        <EditableMarkdown
          initialMarkdown={markdownObject?.text}
          projectId={projectId}
          onSubmit={(newMarkdown) => onNotesUpdate(newMarkdown, markdownObject)}
        />
      </Row>
      <Row className="mt-3 ml-1">
        <small className="text-muted">
          Last updated:{" "}
          <DokulyDateFormat
            date={markdownObject?.last_updated}
            showTime={true}
          />
        </small>
      </Row>
    </Col>
  );
}

const MarkDownNotes = ({
  markdownTextObj = null,
  onNotesUpdate,
  projectId = -1,
  app = "parts",
  appObject = {},
  useTabs = false,
}) => {
  const [tabs, setTabs] = useState([
    {
      eventKey: "main",
      title: "Main notes",
      content: markdownComponent(markdownTextObj, projectId, onNotesUpdate),
    },
  ]);

  const [notesTabs, refreshNotesTabs, loadingNotesTabs] = useMarkdownTabs({
    app,
    dbObjectId: appObject.id,
  });

  const [activeTab, setActiveTab] = useState("main");

  const newTabObject = {
    eventKey: "new",
    title: (
      <>
        <img
          src="../../../static/icons/plus.svg"
          className="icon-dark"
          width={17}
          style={{ marginTop: "-4px" }}
        />
      </>
    ),
    markdownObject: {
      text: "",
      last_updated: new Date(),
    },
  };

  const updateTabNotes = useCallback(
    (newMarkdown, markdownObject) => {
      const key = "text";
      const value = newMarkdown;
      updateMarkdownTab(key, value, markdownObject, refreshNotesTabs);
    },
    [refreshNotesTabs]
  );

  useEffect(() => {
    const updatedTabs = [
      {
        eventKey: "main",
        title: "Main notes",
        content: markdownComponent(markdownTextObj, projectId, onNotesUpdate),
      },
    ];

    if (!notesTabs) {
      updatedTabs.push(newTabObject);
      setTabs(updatedTabs);
      return;
    }

    const extraTabs = notesTabs.map((markdownObject) => {
      if (!markdownObject || !markdownObject?.title) {
        return null;
      }
      const eventKey = markdownObject?.title?.toLowerCase()?.replace(" ", "-");
      return {
        eventKey: eventKey,
        title: markdownObject?.title,
        content: markdownComponent(markdownObject, projectId, updateTabNotes),
        markdownObject,
      };
    });

    const filtered = extraTabs.filter((tab) => tab !== null);

    // Sort extra tabs
    const sorted = filtered.sort((a, b) => {
      if (a.title.toLowerCase() < b.title.toLowerCase()) {
        return -1;
      }
      if (a.title.toLowerCase() > b.title.toLowerCase()) {
        return 1;
      }
      return 0;
    });

    // Add sorted tabs and new tab button
    updatedTabs.push(...sorted);
    updatedTabs.push(newTabObject);

    setTabs(updatedTabs);
  }, [notesTabs, markdownTextObj, updateTabNotes, projectId]);

  return (
    <DokulyCard style={{ maxWidth: "85.7vw" }}>
      <CardTitle
        titleText="Notes"
        optionalHelpText={
          "Write down notes here. These are not locked upon release, to provide a flexible way of documenting related information."
        }
      />
      {useTabs ? (
        <NotesTabs
          appName={app}
          tabs={tabs}
          appObject={appObject}
          refreshNotesTabs={refreshNotesTabs}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
        />
      ) : (
        <Col>
          <Row className="mt-2">
            <EditableMarkdown
              initialMarkdown={markdownTextObj?.text}
              projectId={projectId}
              onSubmit={onNotesUpdate}
            />
          </Row>
          <Row className="mt-3 ml-1">
            <small className="text-muted">
              Last updated:{" "}
              <DokulyDateFormat
                date={markdownTextObj?.last_updated}
                showTime={true}
              />
            </small>
          </Row>
        </Col>
      )}
    </DokulyCard>
  );
};

export default MarkDownNotes;
