import React from "react";
import { Col } from "react-bootstrap";

import CardTitle from "../../dokuly_components/cardTitle";
import DokulyCard from "../../dokuly_components/dokulyCard";
import EditableMarkdown from "../../dokuly_components/dokulyMarkdown/editableMarkdown";
import { updateSupplier } from "../functions/queries";

const SupplierNotesCard = ({ supplier, setRefresh }) => {
  const handleMarkdownSubmit = (markdownText) => {
    if (markdownText === undefined || markdownText == null) {
      return;
    }

    const data = {
      notes: markdownText,
    };
    updateSupplier(supplier.id, data).then((res) => {
      if (res.status === 200) {
        setRefresh(true);
      }
    });
  };

  return (
    <DokulyCard
      isCollapsed={!supplier?.notes || supplier?.notes === ""}
      expandText={"Add Notes"}
    >
      <CardTitle
        titleText={"Notes"}
        optionalHelpText={
          "This field is used to display information related to the supplier."
        }
        style={{}}
      />

      <div className="row" style={{ maxWidth: "inherit" }}>
        <div
          className="col"
          style={{ lineBreak: "strict", maxWidth: "inherit" }}
        >
          <EditableMarkdown
            initialMarkdown={supplier?.notes}
            onSubmit={handleMarkdownSubmit}
            showEmptyBorder={false}
            projectId={""}
          />
        </div>
      </div>
    </DokulyCard>
  );
};

export default SupplierNotesCard;
