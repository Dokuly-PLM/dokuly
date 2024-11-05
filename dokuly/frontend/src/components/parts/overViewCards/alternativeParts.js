import React, { useEffect, useState } from "react";
import moment from "moment";
import { Col, Row } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

import { imageFormatter } from "../functions/formatters";
import AddAlternativePartForm from "../forms/addAlternativePart";
import { removeAlternativePart } from "../functions/queries";
import DokulyCard from "../../dokuly_components/dokulyCard";

const AlternativeParts = (props) => {
  const [loading, setLoading] = useState(true);
  const [data, setAlternativeParts] = useState([]);
  const [sorting, setSorting] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (props.part.alternative_parts_v2) {
      setAlternativeParts(props.part.alternative_parts_v2);
    } else {
      setAlternativeParts([]);
    }
    setLoading(false);
  }, [props.part]);

  const handleRemove = (id) => {
    // generate an are you sure alert
    if (confirm("Are you sure you want to remove this alternative part?")) {
      removeAlternativePart(props.part.id, id).then((res) => {
        if (res.status === 200) {
          props.setRefresh(true);
        }
      });
    }
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("full_part_number", {
      cell: (info) => info.getValue(),
      header: "Part number",
      maxWidth: 50,
      minWidth: 10,
      width: 70,
    }),
    columnHelper.accessor("image_url", {
      cell: (info) => {
        return imageFormatter(info.cell, info.row.original);
      },
      header: "",
      maxWidth: 50,
      minWidth: 10,
      width: 70,
    }),
    columnHelper.accessor("mpn", {
      cell: (info) => info.getValue(),
      header: "MPN",
      maxWidth: 50,
      minWidth: 10,
      width: 70,
    }),
    columnHelper.accessor("remove", {
      cell: (info) => (
        <img
          onClick={(e) => {
            e.stopPropagation();
            handleRemove(info.row.original.id);
          }}
          src="../../static/icons/circle-minus.svg"
          alt="minus"
        />
      ),
      header: "",
      maxWidth: 50,
      minWidth: 10,
      width: 70,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Col className="p-0" style={{ marginRight: "2rem" }}>
      <DokulyCard
        isCollapsed={data?.length === 0}
        expandText={"Add alternative parts"}
        style={{ maxWidth: "60rem" }}
      >
        {loading && data === undefined ? (
          <div
            style={{ margin: "5rem" }}
            className="d-flex m-5 dokuly-primary justify-content-center"
          >
            <div className="spinner-border" role="status" />
          </div>
        ) : (
          <React.Fragment>
            <div className="row align-items-center">
              <div className="col-auto">
                <h5>
                  <b>Alternative parts</b>{" "}
                </h5>
              </div>
              <div className="col-auto">
                <AddAlternativePartForm
                  part={props.part}
                  setRefresh={props.setRefresh}
                />
              </div>
            </div>
            {!loading && data.length === 0 ? (
              "No alternative parts"
            ) : (
              <Row>
                <Table hover responsive>
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <th
                              key={header.id}
                              style={{
                                maxWidth: header.maxWidth,
                                minWidth: header.minWidth,
                                width: header.width,
                              }}
                            >
                              {header.isPlaceholder ? null : (
                                <div
                                  {...{
                                    className: header.column.getCanSort()
                                      ? "cursor-pointer select-none"
                                      : "",
                                    onClick:
                                      header.column.getToggleSortingHandler(),
                                  }}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                  {{
                                    asc: (
                                      <img
                                        src="../../static/icons/sort-ascending.svg"
                                        alt="sort ascending"
                                      />
                                    ),
                                    desc: (
                                      <img
                                        src="../../static/icons/sort-descending.svg"
                                        alt="sort descending"
                                      />
                                    ),
                                  }[header.column.getIsSorted()] ?? null}
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            window.open(`/#/parts/${row.original.id}`);
                          } else {
                            navigate(`/parts/${row.original.id}`);
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Row>
            )}
          </React.Fragment>
        )}
      </DokulyCard>
    </Col>
  );
};

export default AlternativeParts;
