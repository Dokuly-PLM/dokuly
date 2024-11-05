import React, { useState, useEffect } from "react";
import {
  loadCustomer,
  loadEmployee,
  loadProject,
  pdfStyles,
} from "../functions/helperFunctions";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";
import moment from "moment";
import { mathRound } from "../timesheetReport";
import { fetchSelectedLogoImage } from "../functions/queries";
import { loadingSpinner } from "../../admin/functions/helperFunctions";
import { toast } from "react-toastify";

const RenderTimePDF = ({
  date_from,
  date_to,
  total_hours,
  include_comments,
  projects,
  timetracks,
  customers,
  profiles,
  filterCustomer,
  filterProject,
  filterEmployee,
  title,
  imageUri,
  projectTasks,
}) => {
  const styles = pdfStyles();
  const timetracks_copy = [...timetracks];

  const checkTimerRunning = (timetrack) => {
    if (timetrack.start_time === timetrack.stop_time) {
      return true;
    }
    if (
      (timetrack.stop_time === "" || timetrack.stop_time === null) &&
      timetrack.start_time
    ) {
      return true;
    }
    return false;
  };

  const loadTask = (timetrack) => {
    // Check for the updated task title before we check the timetrack task string
    if (projectTasks) {
      if (projectTasks?.length !== 0) {
        for (let i = 0; i < projectTasks?.length; i++) {
          if (parseInt(projectTasks[i].id) === parseInt(timetrack.task_id)) {
            return projectTasks[i]?.title ?? "--";
          }
        }
      }
    }
    if (timetrack?.task !== "" && timetrack?.task) {
      return timetrack.task;
    }
    return "";
  };

  const formattedDate = () => {
    let from = moment(date_from);
    const to = moment(date_to);
    if (from.isSame(to, "month")) {
      if (from.isSame(to, "year")) {
        from = moment(date_from).format("DD");
      } else {
        from = moment(date_from).format("DD YYYY");
      }
    } else {
      if (from.isSame(to, "year")) {
        from = moment(date_from).format("DD MMM");
      } else {
        from = moment(date_from).format("DD MMM YYYY");
      }
    }
    return from;
  };

  return (
    <Document title={title} fileName={title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.HeaderContainer}>
          <View>
            <Text style={styles.Title}>
              Timesheet {formattedDate()} -&nbsp;
              {moment(date_to).format("DD MMM YYYY")}
            </Text>

            <Text style={{ marginTop: 3, marginLeft: 10, fontSize: 15 }}>
              Customer: {loadCustomer(filterCustomer, customers)?.name ?? "--"}
            </Text>
            {filterProject !== "" && (
              <Text style={{ marginTop: 3, marginLeft: 10, fontSize: 15 }}>
                Project: {loadProject(filterProject, projects)?.title ?? "--"}
              </Text>
            )}
            {filterEmployee !== "" && (
              <Text style={{ marginTop: 3, marginLeft: 10, fontSize: 15 }}>
                Employee: {loadEmployee(filterEmployee, profiles)}
              </Text>
            )}
            <Text style={{ marginTop: 3, marginLeft: 10, fontSize: 15 }}>
              Total Hours: {total_hours}
            </Text>
          </View>
          {imageUri !== -1 && <Image style={styles.image} source={imageUri} />}
        </View>
        <View style={styles.Thead}>
          <Text style={styles.TheadContent}>Date</Text>
          <Text style={styles.TheadContent}>Project</Text>
          <Text style={styles.TheadContent}>Task</Text>
          <Text style={styles.TheadContent}>Hours</Text>
          <Text style={styles.TheadContent}>Comment</Text>
        </View>
        {timetracks_copy
          ? timetracks_copy.map((timetrack) => {
              {
                if (
                  moment(timetrack.date).isSameOrAfter(date_from) &&
                  moment(timetrack.date).isSameOrBefore(date_to)
                )
                  return (
                    <View key={timetrack.id}>
                      <View style={styles.item}>
                        <Text style={styles.itemContent}>{timetrack.date}</Text>
                        <Text style={styles.itemContent}>
                          {projects.map((project) =>
                            project.id === timetrack.project
                              ? project.title
                              : ""
                          )}
                        </Text>
                        <Text style={styles.itemContent}>
                          {loadTask(timetrack)}
                        </Text>
                        <Text
                          style={
                            checkTimerRunning(timetrack)
                              ? {
                                  flex: 1,
                                  fontSize: 10,
                                  borderBottom: 1,
                                  paddingRight: "2px",
                                  paddingLeft: "2px",
                                  backgroundColor: "#f6c208ff",
                                }
                              : styles.itemContent
                          }
                        >
                          {checkTimerRunning(timetrack)
                            ? "Timer Running"
                            : mathRound(timetrack.hour, 1)}
                        </Text>
                        <Text style={styles.itemContent}>
                          {include_comments ? timetrack.comment : ""}
                        </Text>
                      </View>
                    </View>
                  );
              }
            })
          : ""}
      </Page>
    </Document>
  );
};

export default RenderTimePDF;
