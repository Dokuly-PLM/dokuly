import React, { useEffect, useState } from "react";
import DokulyTable from "../dokulyTable/dokulyTable";
import CreateNewIssue from "./createNewIssue";
import DokulyCard from "../dokulyCard";
import CardTitle from "../cardTitle";
import { Row } from "react-bootstrap";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import {
  closeIssue,
  createIssue,
  deleteIssue,
  editIssue,
} from "./functions/queries";
import DokulyDateFormat from "../formatters/dateFormatter";
import TextFieldEditor from "../dokulyTable/components/textFieldEditor";
import DeleteRowButton from "../deleteRowButton";
import { toast } from "react-toastify";
import { criticalityValues } from "./functions/criticalityValues";
import GenericDropdownSelector from "../dokulyTable/components/genericDropdownSelector";
import CheckBox from "../checkBox";
import { getIssueColor } from "../../assemblies/displayAsm";
import QuestionToolTip from "../questionToolTip";
import { issueTableTooltipText } from "./issueTableTooltipText";
import AddButton from "../AddButton";
import { useNavigate } from "react-router";
import DokulyTags from "../dokulyTags/dokulyTags";

export const appToModelName = {
  assemblies: "assembly",
  parts: "part",
  pcbas: "pcba",
  documents: "document",
};

// loading logic is disabled by default
const IssuesTable = ({
  dbObject,
  issues,
  app,
  setRefresh,
  loading = false,
  revisionList = [],
  bomIssues = [],
  loadingBomIssues = false,
  useBomIssues = false,
  setRefreshBomIssues = () => {},
}) => {
  const [showClosedIssues, setShowClosedIssues] = useState(false);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [hideBomIssues, setHideBomIssues] = useState(false);
  const closedInFieldName = `closed_in_${appToModelName[app]}`;

  const navigate = useNavigate();

  const changeField = (id, key, value) => {
    if (id == null || value == null || key == null) {
      return;
    }

    const data = { [key]: value, app: app, object_id: dbObject?.id };
    editIssue(id, data).then(
      (result) => {
        if (result.status === 200) {
          toast.success("Issue updated successfully.");
          setRefresh(true);
          if (useBomIssues) {
            setRefreshBomIssues(true);
          }
        }
      },
      (error) => {
        toast.error(error);
      }
    );
  };

  const deleteIssueRow = (id) => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return;
    }
    deleteIssue(id)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Issue deleted successfully.");
          setRefresh(true);
          if (useBomIssues) {
            setRefreshBomIssues(true);
          }
        } else {
          toast.error("Failed to delete issue.");
        }
      })
      .catch((err) => {
        toast.error("Failed to delete issue.");
      });
  };

  const handleSelectDropdown = (row, value) => {
    changeField(row.id, "criticality", value);
  };

  const addNewIssue = () => {
    const formattedRevisionList = revisionList.map((revision) => {
      return {
        id: revision.id,
        revision: revision.revision,
      };
    });
    const data = {
      app: app,
      object_id: dbObject?.id,
      revision_list: formattedRevisionList,
    };
    createIssue(data).then((res) => {
      if (res.status === 201) {
        toast.success("Issue created successfully.");
        setRefresh(true);
        if (useBomIssues) {
          setRefreshBomIssues(true);
        }
      } else {
        toast.error("Failed to create issue.");
      }
    });
  };

  const handleCloseIssue = (id) => {
    if (!confirm("Are you sure you want to close this issue?")) {
      return;
    }
    const data = {
      object_id: dbObject?.id, // This is the "closed_in" id field.
      app: app,
    };
    closeIssue(id, data).then((res) => {
      if (res.status === 200) {
        toast.success("Issue closed successfully.");
        setRefresh(true);
        if (useBomIssues) {
          setRefreshBomIssues(true);
        }
      } else {
        toast.error("Failed to close issue.");
      }
    });
  };

  const criticalityOptions = criticalityValues;

  useEffect(() => {
    if (!issues && !bomIssues) {
      return;
    }
    const safeIssues = Array.isArray(issues) ? issues : [];
    const safeBomIssues = Array.isArray(bomIssues) ? bomIssues : [];
    const combinedIssues = hideBomIssues
      ? safeIssues
      : [...(safeIssues ?? []), ...(safeBomIssues ?? [])];

    const filtered = combinedIssues?.filter((issue) => {
      const isClosed = issue[closedInFieldName];
      const isBomIssue = issue?.related_bom_item;

      // Always include the issue if showClosedIssues is true
      if (showClosedIssues) {
        return true;
      }

      if (isBomIssue) {
        // For BOM issues, only check if it is not closed
        const bomIssueClosedInFieldName = `closed_in_${
          appToModelName[issue?.related_bom_item?.app]
        }`;
        const isBomIssueClosed = issue[bomIssueClosedInFieldName];
        return !isBomIssueClosed;
      }
      // Check the revision comparison for non-BOM issues
      const isLowerRevision =
        issue[closedInFieldName]?.revision > dbObject.revision;
      // Include the issue if it is not closed or if it's a lower revision
      return !isClosed || isLowerRevision;
    });

    setFilteredIssues(filtered);
  }, [showClosedIssues, issues, dbObject, bomIssues, hideBomIssues]);

  const isCompletedStyle = (row) => {
    if (row?.related_bom_item) {
      const bomIssueClosedInFieldName = `closed_in_${
        appToModelName[row?.related_bom_item?.app]
      }`;
      const isBomIssueClosed = row[bomIssueClosedInFieldName];
      if (isBomIssueClosed) {
        return {
          textDecoration: "line-through",
          opacity: 0.75,
        };
      }
    }
    if (row[closedInFieldName]?.id === dbObject?.id) {
      return {
        textDecoration: "line-through",
        opacity: 0.75,
      };
    }
    return {};
  };

  const columns = [
    {
      key: "id",
      header: "Number",
      headerTooltip: "Issue ID Number",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "50px",
      formatter: (row) => {
        return (
          <Row className="mx-2 d-flex justify-content-left align-items-center">
            <b
              className="dokuly-primary"
              style={{ ...isCompletedStyle(row), fontSize: "18px" }}
            >
              #
            </b>
            <span style={isCompletedStyle(row)}>
              <b>{row?.id}</b>
            </span>
          </Row>
        );
      },
    },
    {
      key: "title",
      header: "Title",
      headerTooltip: "Issue Title",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "150px",
      formatter: (row) => (
        <div style={isCompletedStyle(row)}>
          <TextFieldEditor
            text={row?.title}
            setText={(newText) => changeField(row.id, "title", newText)}
            multiline={true}
            readOnly={row[closedInFieldName] !== null}
          />
        </div>
      ),
      csvFormatter: (row) => {
        return row.statement ? row.statement : "";
      },
    },
    {
      key: "description",
      header: "Description",
      headerTooltip: "Issue Description",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: false,
      maxWidth: "200px",
      formatter: (row) => (
        <div style={isCompletedStyle(row)}>
          <TextFieldEditor
            text={row?.description?.text}
            setText={(newText) => changeField(row.id, "description", newText)}
            multiline={true}
            readOnly={row[closedInFieldName] !== null}
          />
        </div>
      ),
      csvFormatter: (row) => {
        return row.description?.text ? row.description?.text : "";
      },
    },
    {
      key: "has_description",
      header: "",
      headerTooltip:
        "The icon represents that the issue has a further description. While the '-' means there is no description.",
      maxWidth: "20px",
      formatter: (row) => {
        return row?.description?.text ? (
          <img
            className="icon-dark"
            height={20}
            alt="Has Description"
            src="../../static/icons/file-text.svg"
          />
        ) : (
          "-"
        );
      },
    },
    {
      key: "criticality",
      header: "Criticality",
      headerTooltip: "Issue criticality",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "40px",
      formatter: (row) => {
        return (
          <div style={isCompletedStyle(row)}>
            <GenericDropdownSelector
              state={row?.criticality}
              setState={(value) => handleSelectDropdown(row, value)}
              dropdownValues={criticalityOptions}
              placeholder={"Select Criticality"}
              borderIfPlaceholder={true}
              borderColor={getIssueColor(row, "assemblies")}
              borderOnNoEdit={row[closedInFieldName] === null} // Only show border if not closed
              textSize={"12px"}
              borderSize="2px"
              readOnly={row[closedInFieldName] !== null}
            />
          </div>
        );
      },
    },
    {
      key: "created_by",
      header: "Created By",
      headerTooltip: "Issue creator",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "70px",
      formatter: (row) => {
        return (
          <div style={isCompletedStyle(row)}>
            {row?.created_by?.first_name} {row?.created_by?.last_name}
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Created At",
      headerTooltip: "Issue creation date",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      maxWidth: "60px",
      formatter: (row) => {
        return (
          <div style={isCompletedStyle(row)}>
            <DokulyDateFormat date={row?.created_at} />
          </div>
        );
      },
    },
    {
      key: "tags",
      header: "Tags",
      maxWidth: "140px",
      searchValue: (row) => {
        const tags = row?.tags ?? [];
        return tags?.length > 0 ? tags.map((tag) => tag.name).join(" ") : "";
      },
      formatter: (row) => {
        return <DokulyTags tags={row?.tags ?? []} readOnly={true} />;
      },
      csvFormatter: (row) => (row?.tags ? row.tags : ""),
      defaultShowColumn: true,
    },
    {
      key: "",
      header: "Action",
      formatter: (row) => {
        if (row?.related_bom_item) {
          return (
            <Row
              className="d-flex align-items-center justify-content-start"
              style={{ paddingLeft: "0.33rem" }}
            >
              <span
                style={{ cursor: "pointer", borderBottom: "1px black solid" }}
                onClick={() => navigateRelatedBomItem(row)}
              >
                <b>
                  {row?.related_bom_item?.full_part_number}
                  {row?.related_bom_item?.revision}
                </b>
              </span>
            </Row>
          );
        }
        return (
          <Row
            className={`align-items-center ${
              row[closedInFieldName] && "justify-content-start d-flex"
            }`}
          >
            {!row[closedInFieldName] && (
              <AddButton
                onClick={() => handleCloseIssue(row?.id)}
                buttonText={"Close Issue"}
                imgSrc={"../../static/icons/circle-check.svg"}
              />
            )}
            {!row[closedInFieldName] ? (
              <DeleteRowButton
                row={row}
                setRefresh={setRefresh}
                handleDelete={() => deleteIssueRow(row?.id)}
              />
            ) : (
              <span className="align-items-center">
                {row[closedInFieldName]?.id === dbObject?.id
                  ? "Closed"
                  : `Closed in: ${row[closedInFieldName]?.revision}`}
                <img
                  className="icon-dark"
                  height={20}
                  alt="Close"
                  src="../../static/icons/check.svg"
                />
              </span>
            )}
          </Row>
        );
      },
      maxWidth: "70px",
      includeInCsv: false,
      defaultShowColumn: true,
    },
  ];

  if (showClosedIssues) {
    // add closed by column before actions column
    const closedByColumn = {
      key: "closed_by",
      header: "Closed By",
      headerTooltip: "Issue closer",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      formatter: (row) => {
        return (
          <div>
            {row?.closed_by?.first_name} {row?.closed_by?.last_name}
          </div>
        );
      },
    };
    columns.splice(columns.length - 1, 0, closedByColumn);
  }

  if (showClosedIssues) {
    // add closed at column before actions column
    const closedAtColumn = {
      key: "closed_at",
      header: "Closed At",
      headerTooltip: "Issue closing date",
      sortable: true,
      includeInCsv: true,
      defaultShowColumn: true,
      formatter: (row) => {
        return (
          <div>
            {row?.closed_at && <DokulyDateFormat date={row?.closed_at} />}
          </div>
        );
      },
    };
    columns.splice(columns.length - 1, 0, closedAtColumn);
  }

  const handleRowClick = (rowId, row, event) => {
    // Navigate to issue on ctrl click (or cmd click on mac) in a new tab
    if (event.ctrlKey || event.metaKey) {
      window.open(`#/issues/${row.id}`, "_blank");
    }
  };

  const onNavigate = (row) => {
    // Build the URL path dynamically based on the BOM item details
    const path = `/issues/${row?.id}`;
    navigate(path);
  };

  const navigateRelatedBomItem = (row) => {
    if (!row?.related_bom_item) {
      return;
    }
    navigate(
      `/${row?.related_bom_item?.app}/${row?.related_bom_item?.id}/overview`
    );
  };

  if (loading) {
    return loadingSpinner();
  }

  return (
    <DokulyCard key={dbObject?.id ?? 0}>
      <Row className="align-items-center">
        <CardTitle
          style={{ paddingLeft: "15px", marginRight: "0.5rem" }}
          titleText="Issues"
        />
        <QuestionToolTip
          optionalHelpText={issueTableTooltipText}
          placement="right"
        />
      </Row>
      <Row className="algin-items-center">
        <CreateNewIssue className="mr-4" addNewIssue={addNewIssue} />
        <CheckBox
          divClassName={"mt-2"}
          className="dokuly-checkbox"
          style={{ marginTop: "0.33rem" }}
          label="Show closed issues"
          checked={showClosedIssues}
          onChange={(e) => setShowClosedIssues(e.target.checked)}
        />
        {useBomIssues && (
          <CheckBox
            divClassName={"mt-2 mx-3"}
            className="dokuly-checkbox"
            style={{ marginTop: "0.33rem" }}
            label={`Only show ${dbObject?.full_part_number}'s issues`}
            checked={hideBomIssues}
            onChange={(e) => setHideBomIssues(e.target.checked)}
          />
        )}
      </Row>
      {!issues ? (
        <div className="m-2">No issues found.</div>
      ) : (
        <>
          <DokulyTable
            tableName="issuesTable"
            key={filteredIssues?.length ?? 0}
            data={filteredIssues}
            columns={columns}
            showColumnSelector={true}
            itemsPerPage={100000} // No pagination
            onRowClick={(rowId, row, event) =>
              handleRowClick(rowId, row, event)
            }
            navigateColumn={true}
            onNavigate={(row) => onNavigate(row)}
            defaultSort={{ columnNumber: 0, order: "desc" }}
            textSize="16px"
          />
          <small className="m-2 text-secondary">
            Click on a field to edit it. To submit your changes press{" "}
            <kbd>Tab</kbd> on your keyboard, or de-focus the field.
          </small>
        </>
      )}
    </DokulyCard>
  );
};

export default IssuesTable;
