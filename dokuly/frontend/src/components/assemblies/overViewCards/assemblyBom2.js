import React, { useEffect, useState } from "react";
import BomTable from "../../common/bom/bomTable";
import BomComparisonTable from "../../common/bom/bomComparison/compareBomRevisions";

import { getRevisions } from "../../common/bom/functions/queries";

const AssemblyBom = ({ assembly, organization, refreshBomIssues }) => {
  const [assemblyRevisions, setAssemblyRevsions] = useState([assembly]);
  const [showBomDifferenceTable, setShowBomDifferenceTable] = useState(false);
  const [isLockedBom, setIsLockedBom] = useState(false);

  useEffect(() => {
    if (!assembly) {
      return;
    }
    getRevisions("assemblies", assembly.id).then((res) => {
      setAssemblyRevsions(res);
    });
    setIsLockedBom(
      assembly?.release_state === "Released" ||
        assembly?.release_state === undefined ||
        assembly?.release_state === null
    );
  }, [assembly]);

  return (
    <React.Fragment>
      {1 < assemblyRevisions.length && (
        <BomComparisonTable
          items={assemblyRevisions}
          app={"assemblies"}
          current_revision_major={assembly?.revision_count_major}
          current_revision_minor={assembly?.revision_count_minor}
          setShowBomDifferenceTable={setShowBomDifferenceTable}
        />
      )}

      <BomTable
        app={"assemblies"}
        id={assembly?.id}
        is_locked_bom={isLockedBom}
        showTable={!showBomDifferenceTable}
        organization={organization}
        refreshBomIssues={refreshBomIssues}
        refreshKey={isLockedBom}
      />
    </React.Fragment>
  );
};

export default AssemblyBom;
