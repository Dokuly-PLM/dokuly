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

const RevisionsTable = ({ item, app, setRevisionListParent = () => {} }) => {
  const navigate = useNavigate();
  const [revisionList, setRevisionList] = useState([]);
  const [tableTextSize, setTableTextSize] = useState("16px");

  useEffect(() => {
    if (item != null && item !== undefined) {
      getRevisions(app, item.id).then((res) => {
        setRevisionList(res);
        setRevisionListParent(res);
      });
    }
  }, [item, app]);

  const handleRowClick = (index) => {
    const row = revisionList[index];
    if (row) {
      navigate(`/${app}/${row.id}`);
    }
  };

  // Configuration for the DokulyTable columns
  const columns = [
    {
      key: "revision",
      header: "Revision",
      includeInCsv: true,
      sort: true,
      maxWidth: "30px",
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
