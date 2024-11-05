import React, { useEffect, useState } from "react";
import { Row } from "react-bootstrap";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import useAllLots from "../../common/hooks/useAllLots";
import { ThumbnailFormatter } from "../../dokuly_components/dokulyTable/functions/formatters";
import DokulyCard from "../../dokuly_components/dokulyCard";
import QuestionToolTip from "../../dokuly_components/questionToolTip";
import CardTitle from "../../dokuly_components/cardTitle";
import { dateFormatter } from "../../documents/functions/formatters";
import { useNavigate } from "react-router";
import DokulyDateFormat from "../../dokuly_components/formatters/dateFormatter";

const LotTable = ({ refresh }) => {
  const [lots, refreshLots, loadingLots] = useAllLots();

  const [filteredLots, setFilteredLots] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    setFilteredLots(lots ?? []);
  }, [lots]);

  useEffect(() => {
    if (refresh) {
      refreshLots();
    }
  }, [refresh]);

  const columns = [
    {
      key: "lot_number",
      header: "Lot Number",
      headerTooltip: "The unique lot number",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "30px",
      formatter: (row) => {
        return row?.lot_number;
      },
    },
    {
      key: "thumbnail",
      header: "",
      maxWidth: "40px",
      formatter: (row) => {
        let thumbnail = "";
        if (row?.assembly) {
          thumbnail = row?.assembly?.thumbnail;
        } else if (row?.pcba) {
          thumbnail = row?.pcba?.thumbnail;
        } else {
          thumbnail = row?.part?.thumbnail;
        }
        return <ThumbnailFormatter thumbnail={thumbnail} />;
      },
    },
    {
      key: "lot_item",
      header: "Item",
      headerTooltip: "The item of the lot",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: (row) => {
        let item = "";
        if (row?.assembly) {
          item =
            row?.assembly?.full_part_number +
            row?.assembly?.revision +
            " - " +
            row?.assembly?.display_name;
        } else if (row?.pcba) {
          item =
            row?.pcba?.full_part_number +
            row?.pcba?.revision +
            " - " +
            row?.pcba?.display_name;
        } else {
          item =
            row?.part?.full_part_number +
            row?.part?.revision +
            " - " +
            row?.part?.display_name;
        }
        return item;
      },
    },
    {
      key: "quantity",
      header: "Quantity",
      headerTooltip: "The quantity of the lot",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "100px",
    },
    {
      key: "planned_production_date",
      header: "Planned production date",
      headerTooltip: "The planned production date of the lot",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: (row) => {
        const dateString = row?.planned_production_date;
        return <DokulyDateFormat date={dateString} />;
      },
    },
    {
      key: "title",
      header: "Title",
      headerTooltip: "The title of the lot",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "100px",
      formatter: (row) => {
        return row?.title ?? "-";
      },
    },
  ];

  const onNavigate = (row) => {
    navigate(`/production/lot/${row?.id}`);
  };

  const onRowClick = (index) => {
    try {
      const row = filteredLots[index];
      navigate(`/production/lot/${row?.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <DokulyCard key={filteredLots?.length ?? 0}>
        <Row className="align-items-center">
          <CardTitle
            style={{ paddingLeft: "15px", marginRight: "0.5rem" }}
            titleText="Production Lots"
          />
          <QuestionToolTip
            optionalHelpText={"Production Lots"}
            placement="right"
          />
        </Row>
        <DokulyTable
          columns={columns}
          key={filteredLots?.length ?? 0}
          data={filteredLots}
          itemsPerPage={5}
          onRowClick={(index) => onRowClick(index)}
          onNavigate={(row) => onNavigate(row)}
          navigateColumn={true}
          showColumnSelector={true}
          defaultSort={{ columnNumber: 0, direction: "asc" }}
          textSize="16px"
        />
      </DokulyCard>
    </div>
  );
};

export default LotTable;
