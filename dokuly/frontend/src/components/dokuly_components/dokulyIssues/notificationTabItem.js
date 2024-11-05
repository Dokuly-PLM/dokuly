import React from "react";
import { appToModelName } from "./issuesTable";

const NotificationTabItem = ({
  app,
  dbObject,
  title,
  issues = [],
  bomIssues = [],
}) => {
  const checkIssuesCriticality = (issues, app, dbObject, bomIssues = []) => {
    const closedInField = `closed_in_${appToModelName[app]}`;
    let criticality = "Low";
    if (!issues) {
      return criticality;
    }

    // Add bom issues to issues
    if (bomIssues && issues) {
      issues = Array.isArray(issues) ? issues : [];
      bomIssues = Array.isArray(bomIssues) ? bomIssues : [];
      issues = [...issues, ...bomIssues];
    }
    for (const issue of issues) {
      if (issue?.related_bom_item) {
        const bomIssueClosedInField = `closed_in_${
          appToModelName[issue?.related_bom_item?.app]
        }`;
        if (issue[bomIssueClosedInField] === null) {
          if (issue.criticality === "Critical") {
            criticality = "Critical";
            break;
          }
          if (issue.criticality === "High") {
            criticality = "High";
          }
        }
      } else {
        // Only check open issues
        if (issue[closedInField] === null) {
          if (issue.criticality === "Critical") {
            criticality = "Critical";
            break;
          }
          if (issue.criticality === "High") {
            criticality = "High";
          }
        }
        if (app === "documents") {
          if (
            issue[closedInField]?.full_doc_number.slice(
              0,
              issue[closedInField]?.full_doc_number.length - 2
            ) ===
              dbObject?.full_doc_number.slice(
                0,
                dbObject.full_doc_number.length - 2
              ) &&
            issue[closedInField]?.revision > dbObject?.revision
          ) {
            if (issue.criticality === "Critical") {
              criticality = "Critical";
              break;
            }
            if (issue.criticality === "High") {
              criticality = "High";
            }
          }
        } else {
          if (
            issue[closedInField]?.full_part_number ===
              dbObject?.full_part_number &&
            issue[closedInField]?.revision > dbObject?.revision
          ) {
            if (issue.criticality === "Critical") {
              criticality = "Critical";
              break;
            }
            if (issue.criticality === "High") {
              criticality = "High";
            }
          }
        }
      }
    }
    return criticality;
  };

  const getOpenIssuesCount = (issues, app, dbObject, bomIssues = []) => {
    const closedInField = `closed_in_${appToModelName[app]}`;
    if (!issues) {
      return 0;
    }
    let count = 0;
    // Add bom issues to issues
    if (bomIssues && issues) {
      issues = Array.isArray(issues) ? issues : [];
      bomIssues = Array.isArray(bomIssues) ? bomIssues : [];
      issues = [...issues, ...bomIssues];
    }
    for (const issue of issues) {
      if (issue?.related_bom_item) {
        const bomIssueClosedInField = `closed_in_${
          appToModelName[issue?.related_bom_item?.app]
        }`;
        if (issue[bomIssueClosedInField] === null) {
          count++;
        }
      } else {
        if (issue[closedInField] === null) {
          count++;
        }
        if (app === "documents") {
          if (
            issue[closedInField]?.full_doc_number.slice(
              0,
              issue[closedInField]?.full_doc_number.length - 2
            ) ===
              dbObject?.full_doc_number.slice(
                0,
                dbObject.full_doc_number.length - 2
              ) &&
            issue[closedInField]?.revision > dbObject?.revision
          ) {
            count++;
          }
        } else {
          if (
            issue[closedInField]?.full_part_number ===
              dbObject?.full_part_number &&
            issue[closedInField]?.revision > dbObject?.revision
          ) {
            count++;
          }
        }
      }
    }
    return count;
  };

  const criticality = checkIssuesCriticality(issues, app, dbObject, bomIssues);
  const numberOfIssues = getOpenIssuesCount(issues, app, dbObject, bomIssues);

  const backgroundColor =
    criticality === "Critical"
      ? "red"
      : criticality === "High"
      ? "#f6c208ff"
      : "#54a4daff";

  return (
    <div
      className="text-center align-items-center"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingRight: "0.25rem",
        paddingLeft: "0.25rem",
      }}
    >
      <span>{title}</span>
      {numberOfIssues > 0 && (
        <span
          style={{
            marginTop: "0.125rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: backgroundColor,
            borderRadius: "50%",
            color: "white",
            width: "1.5em",
            height: "1.5em",
            fontSize: "0.8em",
            zIndex: 5,
            marginLeft: "0.25rem",
          }}
        >
          <b>{numberOfIssues}</b>
        </span>
      )}
    </div>
  );
};

export default NotificationTabItem;
