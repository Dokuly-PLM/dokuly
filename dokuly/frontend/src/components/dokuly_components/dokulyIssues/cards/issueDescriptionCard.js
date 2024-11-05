import React from "react";
import EditableMarkdown from "../../dokulyMarkdown/editableMarkdown";
import DokulyCard from "../../dokulyCard";
import CardTitle from "../../cardTitle";

const IssueDescriptionCard = ({
  readOnly,
  handleMarkdownSubmit,
  markdown,
  app,
  project,
}) => {
  return (
    <DokulyCard>
      <CardTitle titleText={"Description"} />
      <hr />
      <EditableMarkdown
        initialMarkdown={markdown || ""}
        onSubmit={handleMarkdownSubmit}
        showEmptyBorder={true}
        readOnly={readOnly}
        wrapperStyle={{ marginTop: "-0.5rem" }}
        projectId={project?.id}
      />
    </DokulyCard>
  );
};

export default IssueDescriptionCard;
