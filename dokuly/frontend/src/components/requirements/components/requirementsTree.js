import React, { useEffect } from "react";

import useRequirementTree from "../hooks/useRequirementTree";
import DokulyCard from "../../dokuly_components/dokulyCard";
import TreeView from "./treeView";
import CardTitle from "../../dokuly_components/cardTitle";

const RequirementsTree = ({
  requirementId = -1,
  requirementSetId = -1,
  refresh,
}) => {
  const [requirementTree, refetch] = useRequirementTree(requirementSetId);

  useEffect(() => {
    if (refresh) {
      refetch();
    }
  }, [refresh]);

  return (
    <DokulyCard className="card rounded m-3 sticky-tree">
      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <CardTitle
          titleText="Requirements tree"
          optionalHelpText={
            "This tree lists all the requirements in the set. Click the + to show subrequirements"
          }
          style={{ paddingLeft: "30px" }}
        />
        <TreeView data={requirementTree} currentRequirementId={requirementId} />
      </div>
    </DokulyCard>
  );
};

export default RequirementsTree;
