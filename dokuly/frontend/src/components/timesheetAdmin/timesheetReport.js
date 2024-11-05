import React from "react";
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

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 30,
  },
  Title: {
    fontSize: 20,
    marginTop: 10,
    marginBottom: 10,
    width: 400,
    layout: "left",
    fontFamily: "Helvetica",
    // width=300,
  },
  image: {
    height: 72.7,
    width: 134.4,
    layout: "right",
  },
  HeaderContainer: {
    width: "100%",
    flexDirection: "row",
    padding: 5,
  },
  item: {
    flexDirection: "row",
    marginBottom: 5,
  },

  itemContent: {
    flex: 1,
    fontSize: 10,
    paddingLeft: 3,
    // borderTop: 1,
    borderBottom: 1,
  },
  TheadContent: {
    flex: 1,
    fontWeight: "black",
    fontSize: 12,
    paddingLeft: 3,
    // textAlign: "center",
    // fontStyle:
  },
  Thead: {
    flexDirection: "row",
    width: "100%",
    border: 1,
    marginBottom: 5,
    marginTop: 5,
    backgroundColor: "lightgray",
  },
  section: { color: "black", textAlign: "center", margin: 30 },
  text: {},
});
function filterCustomer(projectID, props) {
  return props.data.projects.map((project) => {
    if (project.id == projectID) {
      return project.customer == props.states.filterCustomer;
    }
  });
}

function loadCustomerName(id, props) {
  return props.data.customers.map((customer) => {
    if (customer.id == id) {
      return customer?.name ?? "--";
    }
  });
}

function loadProjectName(id, props) {
  return props.data.projects.map((project) => {
    if (project.id == id) {
      return project?.title ?? "--";
    }
  });
}

export function mathRound(number, precision) {
  const mult = Math.pow(10, precision || 0);
  const result = Math.ceil(number * mult) / mult;
  return parseFloat(result.toFixed(precision));
}

export function PdfDocument(props) {
  let filteredTimetrackings = props.states.pdfTimetracks.filter((timetrack) => {
    return props.states.filterCustomer === ""
      ? timetrack.id
      : filterCustomer(timetrack.project, props).includes(true);
  });

  // Project Filter
  filteredTimetrackings = filteredTimetrackings.filter((timetrack) => {
    if (props.states.filterProject === "") {
      return true;
    } else if (timetrack.project == props.states.filterProject) {
      return true;
    }
  });

  // Sorting time entries by date and start time
  filteredTimetrackings
    .sort(function (a, b) {
      return (
        new Date("1970/01/01 " + a.start_time) -
        new Date("1970/01/01 " + b.start_time)
      );
    })
    .sort((a, b) => moment(a.date) > moment(b.date));

  return (
    <Document
      title={props?.title ?? "Time Report"}
      fileName={props?.title ?? "Time Report"}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.HeaderContainer}>
          <View>
            <Text style={styles.Title}>
              Timesheet {moment(props.states.date_from).format("DD")} -&nbsp;
              {moment(props.states.date_to).format("DD MMM YYYY")}
            </Text>

            <Text style={{ marginTop: 3, marginLeft: 10, fontSize: 15 }}>
              Customer: {loadCustomerName(props.states.filterCustomer, props)}
            </Text>
            <Text style={{ marginTop: 3, marginLeft: 10, fontSize: 15 }}>
              Project: {loadProjectName(props.states.filterProject, props)}
            </Text>
            <Text style={{ marginTop: 3, marginLeft: 10, fontSize: 15 }}>
              Total Hours: {props.states.total_hours}
            </Text>
          </View>
          <Image
            style={styles.image}
            source="../../static/logo_ND_gray_w_text_in_use.png"
          />
        </View>
        <View style={styles.Thead}>
          <Text style={styles.TheadContent}>Date</Text>
          <Text style={styles.TheadContent}>Project</Text>
          <Text style={styles.TheadContent}>Task</Text>
          <Text style={styles.TheadContent}>Hours</Text>
          <Text style={styles.TheadContent}>Comment</Text>
        </View>
        {props.data.timetrackings
          ? filteredTimetrackings.map((timetrack) => {
              {
                if (
                  moment(timetrack.date).isSameOrAfter(
                    props.states.date_from
                  ) &&
                  moment(timetrack.date).isSameOrBefore(props.states.date_to)
                )
                  return (
                    <View key={timetrack.id}>
                      <View style={styles.item}>
                        <Text style={styles.itemContent}>{timetrack.date}</Text>

                        <Text style={styles.itemContent}>
                          {props.data.projects.map((project) =>
                            project.id == timetrack.project
                              ? project?.title
                              : "Not found"
                          )}
                        </Text>
                        <Text style={styles.itemContent}>{timetrack.task}</Text>
                        <Text style={styles.itemContent}>
                          {mathRound(timetrack.hour, 1)}
                        </Text>
                        <Text style={styles.itemContent}>
                          {props.states.include_comments
                            ? timetrack.comment
                            : ""}
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
}
