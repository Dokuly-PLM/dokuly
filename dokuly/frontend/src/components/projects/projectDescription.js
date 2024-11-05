import React from "react";

import CardTitle from "../dokuly_components/cardTitle";
import DokulyCard from "../dokuly_components/dokulyCard";
import EditableMarkdown from "../dokuly_components/dokulyMarkdown/editableMarkdown";
import { editProject } from "../admin/functions/queries";

const ProjectDescription = ({ item = {}, setRefresh, readOnly = false }) => {
  const handleMarkdownSubmit = (markdownText) => {
    if (markdownText === undefined || markdownText == null) {
      return;
    }

    const data = {
      description: markdownText,
    };
    editProject(item.id, data).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
      }
    });
  };

  return (
    <DokulyCard
      isCollapsed={!item?.description || item?.description === ""}
      expandText={"Add Description"}
      isHidden={(!item?.description || item?.description === "") && readOnly}
      hiddenText={"No project desctiption added"}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <CardTitle
          titleText={"Description"}
          optionalHelpText={
            "This field is used to display information related to the project."
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
            initialMarkdown={item?.description}
            onSubmit={handleMarkdownSubmit}
            showEmptyBorder={false}
            projectId={item.id}
            readOnly={readOnly}
          />
        </div>
      </div>
    </DokulyCard>
  );
};

export default ProjectDescription;
