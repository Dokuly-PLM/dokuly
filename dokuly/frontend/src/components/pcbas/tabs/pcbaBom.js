import React, { useEffect, useState } from "react";
import BomTable from "../../common/bom/bomTable";
import BomComparisonTable from "../../common/bom/bomComparison/compareBomRevisions";

import { getRevisions } from "../../common/bom/functions/queries";

const PcbaBom = ({ pcba, organization, refreshBomIssues = () => {} }) => {
  const [pcbaRevisions, setPcbaRevsions] = useState([pcba]);
  const [showBomDifferenceTable, setShowBomDifferenceTable] = useState(false);
  const [isLockedBom, setIsLockedBom] = useState(false);

  useEffect(() => {
    if (!pcba) {
      return;
    }
    getRevisions("pcbas", pcba.id).then((res) => {
      setPcbaRevsions(res);
    });
    setIsLockedBom(
      pcba?.release_state === "Released" ||
        pcba?.release_state === undefined ||
        pcba?.release_state === null
    );
  }, [pcba]);

  return (
    <React.Fragment>
      {1 < pcbaRevisions.length && (
        <BomComparisonTable
          items={pcbaRevisions}
          app={"pcbas"}
          current_revision_major={pcba?.revision_count_major}
          current_revision_minor={pcba?.revision_count_minor}
          setShowBomDifferenceTable={setShowBomDifferenceTable}
        />
      )}

      <BomTable
        app={"pcbas"}
        id={pcba?.id}
        is_locked_bom={isLockedBom}
        showTable={!showBomDifferenceTable}
        organization={organization}
        refreshBomIssues={refreshBomIssues}
        refreshKey={isLockedBom}
      />
    </React.Fragment>
  );
};

export default PcbaBom;
