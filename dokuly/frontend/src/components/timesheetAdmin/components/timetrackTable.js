import React, { useEffect, useState } from "react";
import Table from "react-bootstrap/Table";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Row } from "react-bootstrap";
import { getTotalHours } from "../functions/helperFunctions";

const TimetrackAdminTable = ({
  projects,
  customers,
  profiles,
  timetracks,
  loadingCustomers,
  loadingProfiles,
  loadingProjects,
  loadingTimetrack,
  allTasks,
}) => {
  const [data, setData] = useState(
    timetracks !== null && timetracks !== undefined ? timetracks : []
  );
  const [canGetNextPage, setCanGetNextPage] = useState(true);
  const [canGetPreviousPage, setCanGetPreviousPage] = useState(false);
  const [sorting, setSorting] = useState([]);

  const getCustomerValue = (cellValue, rowValue) => {
    const project = projects?.find(
      (project) => project.id === rowValue.original.project
    );
    const customer = customers?.find(
      (customer) => customer.id === project?.customer
    );
    return customer?.name ?? "Unknown Customer";
  };

  const getEmployeeValue = (cellValue, rowValue) => {
    if (
      rowValue.original?.multiple_users &&
      rowValue?.original?.multiple_users.length > 1
    ) {
      let names = "";
      rowValue.original.multiple_users.forEach((id, index) => {
        const profile = profiles?.find(
          (profile) => parseInt(profile.user) === parseInt(id)
        );
        if (index === rowValue.original.multiple_users.length - 1) {
          names += `${profile.first_name}`;
        } else if (index === 0) {
          names += `${profile.first_name} & `;
        } else {
          names += ` ${profile.first_name} & `;
        }
      });
      return (
        <span data-toggle="tooltip" data-placement="top" title={names}>
          Multiple
        </span>
      );
    }
    const profile = profiles?.find(
      (profile) => profile.user === rowValue.original.user
    );
    return `${profile.first_name} ${profile.last_name}`;
  };

  const getProjectValue = (cellValue, rowValue) => {
    const project = projects?.find(
      (project) => project.id === rowValue.original.project
    );
    return project?.title ?? "--";
  };

  const getHourValue = (cellValue, rowValue) => {
    if (rowValue.original.start_time === rowValue.original.stop_time) {
      return <div className="badge dokuly-bg-warning">Timer Running</div>;
    }
    if (
      (rowValue.original.stop_time === "" ||
        rowValue.original.stop_time === null) &&
      rowValue.original.start_time !== null &&
      rowValue.original.start_time !== undefined
    ) {
      return <div className="badge dokuly-bg-warning">Timer Running</div>;
    }
    const roundedValue = Math.round(rowValue.original.hour * 10) / 10;
    return roundedValue.toFixed(1);
  };

  const getTaskValue = (cellValue, rowValue) => {
    const task = allTasks?.find(
      (task) =>
        task?.id === rowValue?.original?.task_id &&
        task?.project_id === rowValue?.original?.project
    );
    return task?.title ?? "--";
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor("date", {
      cell: (info) => info.getValue(),
      header: "Date",
    }),
    columnHelper.accessor("user", {
      cell: (info) => {
        return getEmployeeValue(info.cell, info.row);
      },
      header: "Employee",
    }),
    columnHelper.accessor("project", {
      cell: (info) => {
        return getProjectValue(info.cell, info.row);
      },
      header: "Project",
    }),
    columnHelper.accessor("customer", {
      cell: (info) => {
        return getCustomerValue(info.cell, info.row);
      },
      header: "Customer",
    }),
    columnHelper.accessor("task", {
      cell: (info) => {
        return getTaskValue(info.cell, info.row);
      },
      header: "Task",
    }),
    columnHelper.accessor("hour", {
      cell: (info) => {
        return getHourValue(info.cell, info.row);
      },
      header: "Hours",
    }),
    columnHelper.accessor("comment", {
      cell: (info) => info.getValue(),
      header: "Comments",
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

  useEffect(() => {
    if (timetracks) {
      setData(timetracks);
      if (timetracks.length < 30) {
        setCanGetNextPage(false);
      }
      if (timetracks.length < 26) {
        table.setPageSize(Number(timetracks.length));
      } else {
        table.setPageSize(Number(25));
      }
    }
  }, [
    projects,
    customers,
    timetracks,
    profiles,
    loadingCustomers,
    loadingProfiles,
    loadingProjects,
    loadingTimetrack,
  ]);

  return (
    <div className="card rounded p-3 mt-2 mb-2">
      {loadingTimetrack ||
      loadingCustomers ||
      loadingProjects ||
      loadingProfiles ? (
        loadingSpinner()
      ) : (
        <React.Fragment>
          {timetracks.length === 0 ? (
            <Row className="justify-content-center mt-2 mb-2 mr-4 ml-4 pt-2 pb-2">
              <span>
                <img
                  className="icon-tabler"
                  src="../../static/icons/alert-circle.svg"
                  alt="Warning!"
                  width={"30px"}
                  style={{
                    filter:
                      " invert(65%) sepia(80%) saturate(1471%) hue-rotate(175deg) brightness(90%) contrast(88%)",
                  }}
                />
                No Timetrackings found, try with a different filter
              </span>
            </Row>
          ) : (
            <React.Fragment>
              <span className="gap-1 my-1 mx-3">
                Total hours: {getTotalHours(timetracks)}
              </span>
              <Table hover responsive>
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <th key={header.id} colSpan={header.colSpan}>
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
                                  header.getContext()
                                )}
                                {{
                                  asc: (
                                    <img
                                      src="../../../static/icons/sort-ascending.svg"
                                      alt="sort ascending"
                                    />
                                  ),
                                  desc: (
                                    <img
                                      src="../../../static/icons/sort-descending.svg"
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
                    <tr key={row.original.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </React.Fragment>
          )}
          {timetracks.length !== 0 && (
            <Row className="justify-content-center mt-2 mb-2 mr-4 ml-4 pt-2 pb-2">
              <span className="flex items-center mb-2">
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </strong>
              </span>
              <nav aria-label="...">
                <ul className="pagination">
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: No need to wrap this with button tag */}
                  <li
                    className={`page-item ${
                      canGetPreviousPage ? "" : "disabled"
                    }`}
                    onClick={() => {
                      setCanGetPreviousPage(table.getCanPreviousPage());
                      canGetPreviousPage && table.previousPage();
                    }}
                    tabIndex="-1"
                  >
                    <span className="page-link">&laquo;</span>
                  </li>

                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: No need to wrap this with button tag */}
                  <li
                    className={`page-item ${canGetNextPage ? "" : "disabled"}`}
                    onClick={() => {
                      setCanGetNextPage(table.getCanNextPage());
                      canGetNextPage && table.nextPage();
                    }}
                  >
                    <span className="page-link">&raquo;</span>
                  </li>
                </ul>
              </nav>
              <span className="gap-1 my-1 mx-3">
                Total hours: {getTotalHours(timetracks)}
              </span>
            </Row>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default TimetrackAdminTable;
