import React from "react";
import { StyleSheet } from "@react-pdf/renderer";
import { mathRound } from "../timesheetReport";

export const pdfStyles = () => {
  const style = StyleSheet.create({
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
      width: 72.7,
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
  return style;
};

export const loadCustomer = (id, customers) => {
  if (id !== null && id !== "") {
    return customers?.find((customer) => customer.id === id);
  }
};

export const loadProject = (id, projects) => {
  if (id !== null && id !== "") {
    return projects?.find((project) => parseInt(project.id) === parseInt(id));
  }
};

export const loadEmployee = (id, users) => {
  if (id !== null && id !== "") {
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === parseInt(id)) {
        return `${users[i].first_name} ${users[i].last_name}`;
      }
    }
  }
};

export const getTotalHours = (timetracks) => {
  let totalHours = 0;
  if (timetracks.length === 0 || !timetracks) {
    return totalHours;
  }
  timetracks.map((timetrack) => {
    const roundedHour = mathRound(timetrack.hour, 1);
    totalHours += parseFloat(roundedHour);
  });
  return mathRound(totalHours, 1);
};
