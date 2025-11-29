import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";

import DokulyTable from "../dokulyTable/dokulyTable";
import DokulyMarkdown from "../dokulyMarkdown/dokulyMarkdown";
import DokulyDateFormat from "../formatters/dateFormatter";
import { getRevisions } from "../../common/bom/functions/queries";
import { releaseStateFormatter } from "../formatters/releaseStateFormatter";
import DokulyCard from "../dokulyCard";
import CardTitle from "../cardTitle";
import { thumbnailFormatter } from "../../assemblies/functions/formatters";
import { ThumbnailFormatterComponent } from "../../pcbas/functions/formatters";
import { getEcosForItem } from "../../eco/functions/queries";
import { EcoPillList } from "../ecoPill/ecoPill";

const RevisionsTable = ({ item, app, setRevisionListParent = () => {} }) => {
  const navigate = useNavigate();
  const [revisionList, setRevisionList] = useState([]);
  const [tableTextSize, setTableTextSize] = useState("16px");
  const [revisionEcos, setRevisionEcos] = useState({}); // Map of item id -> ECOs

  useEffect(() => {
    if (item != null && item !== undefined) {
      getRevisions(app, item.id).then((res) => {
        setRevisionList(res);
        setRevisionListParent(res);
        
        // Fetch ECOs for all revisions
        if (res && res.length > 0) {
          fetchEcosForRevisions(res);
        }
      });
    }
  }, [item, app]);

  const fetchEcosForRevisions = async (revisions) => {
    const ecosMap = {};
    
    // Fetch ECOs for each revision in parallel
    const promises = revisions.map(async (rev) => {
      try {
        const response = await getEcosForItem(app, rev.id);
        if (response.status === 200 && response.data && response.data.length > 0) {
          ecosMap[rev.id] = response.data;
        }
      } catch (err) {
        // Silently ignore errors for individual items
      }
    });

    await Promise.all(promises);
    setRevisionEcos(ecosMap);
  };

  const handleRowClick = (index) => {
    const row = revisionList[index];
    if (row) {
      navigate(`/${app}/${row.id}`);
    }
  };

  // Configuration for the DokulyTable columns
  const columns = [
    {
      key: "formatted_revision",
      header: "Revision",
      includeInCsv: true,
      sort: true,
      maxWidth: "30px",
      // Custom sort function to use the hidden revision counters
      sortFunction: (a, b, order) => {
        const majorA = a.revision_count_major ?? 0;
        const majorB = b.revision_count_major ?? 0;
        const minorA = a.revision_count_minor ?? 0;
        const minorB = b.revision_count_minor ?? 0;
        
        // First compare major revisions
        if (majorA !== majorB) {
          return order === "asc" ? majorA - majorB : majorB - majorA;
        }
        // If major is equal, compare minor revisions
        return order === "asc" ? minorA - minorB : minorB - minorA;
      },
      csvFormatter: (row) => row?.formatted_revision || row?.revision || "",
    },
    {
      key: "thumbnail",
      header: "",
      includeInCsv: false,
      formatter: (row) => {
        return <ThumbnailFormatterComponent row={row} />;
      },
      maxWidth: "40px",
    },
    {
      key: "release_state",
      header: "State",
      includeInCsv: true,
      formatter: (row) => {
        return releaseStateFormatter(row);
      },
      csvFormatter: (row) =>
        row?.release_state ? `${row?.release_state}` : "",
    },
    {
      key: "eco",
      header: "ECO",
      includeInCsv: true,
      formatter: (row) => {
        const ecos = revisionEcos[row.id];
        if (!ecos || ecos.length === 0) return null;
        return <EcoPillList ecos={ecos} size="sm" />;
      },
      csvFormatter: (row) => {
        const ecos = revisionEcos[row.id];
        if (!ecos || ecos.length === 0) return "";
        return ecos.map(eco => `ECO${eco.id}`).join(", ");
      },
      maxWidth: "120px",
    },
    {
      key: "released_date",
      header: "Release date",
      includeInCsv: true,
      formatter: (row) => {
        if (row.released_date !== null && row.released_date !== undefined) {
          return <DokulyDateFormat date={row.released_date} />;
        }

        return "";
      },
      csvFormatter: (row) =>
        row?.released_date ? `${row?.released_date}` : "",
    },
    {
      key: "revision_notes",
      header: "Revision notes",
      includeInCsv: true,
      formatter: (row) => <DokulyMarkdown markdownText={row.revision_notes} />,
      csvFormatter: (row) =>
        row?.revision_notes ? `${row?.revision_notes}` : "",
    },
  ];

  const defaultSort = {
    columnNumber: 0,
    order: "desc",
  };

  return (
    <DokulyCard>
      <CardTitle
        titleText={"Revisions"}
        style={{ paddingLeft: "15px", paddingTop: "15px" }}
      />
      <Card.Body>
        <DokulyTable
          tableName={"RevisionsTable"}
          data={revisionList}
          columns={columns}
          showCsvDownload={true}
          itemsPerPage={255}
          onRowClick={handleRowClick}
          showPagination={true}
          showSearch={false}
          defaultSort={defaultSort}
          textSize={tableTextSize}
          setTextSize={setTableTextSize}
          showTableSettings={true}
        />
      </Card.Body>
    </DokulyCard>
  );
};

export default RevisionsTable;
