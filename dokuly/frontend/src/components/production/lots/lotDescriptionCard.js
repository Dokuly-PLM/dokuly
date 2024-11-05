import React from "react";
import DokulyCard from "../../dokuly_components/dokulyCard";
import EditableMarkdown from "../../dokuly_components/dokulyMarkdown/editableMarkdown";
import CardTitle from "../../dokuly_components/cardTitle";

const LotDescriptionCard = ({
  readOnly,
  handleMarkdownSubmit,
  markdown,
  project,
}) => {
  return (
    <DokulyCard>
      <CardTitle titleText={"Notes"} />
      <hr />
      <EditableMarkdown
        initialMarkdown={markdown || ""}
        onSubmit={handleMarkdownSubmit}
        showEmptyBorder={true}
        readOnly={readOnly}
        projectId={project?.id}
      />
    </DokulyCard>
  );
};

export default LotDescriptionCard;
