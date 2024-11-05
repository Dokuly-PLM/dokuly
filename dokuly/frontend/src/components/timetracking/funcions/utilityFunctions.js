/**
 * Check if a task id points to a task, that is part of the project with id `project_id`.
 *
 * @param {*} task_id
 * @param {*} tasks
 * @param {*} project_id
 * @returns
 */
export function taskIsTiedToProject(task_id, tasks, project_id) {
  let task = tasks.filter((item) => {
    if (item.id === task_id) {
      return item;
    }
  });
  return task[0]?.project_id === project_id;
}

export function calculateHours(start_time, stop_time) {
  if (stop_time === "" || start_time === stop_time) {
    return 0.0;
  } else {
    let startTime = start_time.split(":"); // split it at the colons
    let stopTime = stop_time.split(":"); // split it at the colons

    let startTimeDecimal =
      parseFloat(startTime[0]) + parseFloat(startTime[1] / 60);

    let stopTimeDecimal =
      parseFloat(stopTime[0]) + parseFloat(stopTime[1] / 60);

    let calculatedHours = stopTimeDecimal - startTimeDecimal;
    calculatedHours = (Math.ceil(calculatedHours * 100) / 100).toFixed(2);

    return calculatedHours;
  }
}

export function billableRate() {
  let updateBillableRate = this.state.updateBillableRate;
  if (updateBillableRate) {
    let hoursCurrentWeek = this.weekHours();
    let billableHoursBasis;

    moment().isoWeekday() < 6 && moment().isoWeek() === this.state.selected_week
      ? (billableHoursBasis = moment().isoWeekday() * 7.5)
      : (billableHoursBasis = 37.5);

    let billableHours = 0;
    let nonBillable = 0;
    let billableRate = 0;

    this.props.timetrackings.map((timetrack) => {
      if (
        timetrack.user === this.props.auth.user.id &&
        moment(timetrack.date).isoWeek() === this.state.selected_week &&
        timetrack.task != "Onsdagskveld" &&
        moment(timetrack.date).isSame(moment(), "year")
      ) {
        this.props.projects.map((project) =>
          parseInt(project.customer) != 1 && project.id === timetrack.project
            ? (billableHours += parseFloat(timetrack.hour))
            : "",
        );
      }
    });

    billableRate = (billableHours / billableHoursBasis) * 100;
    nonBillable = billableHoursBasis - billableHours;

    billableRate > 100 ? (billableRate = 100) : "";
    nonBillable < 0 ? (nonBillable = 0) : "";

    isNaN(billableHours) ? (billableHours = 0) : "";
    isNaN(nonBillable) ? (nonBillable = 0) : "";
    isNaN(billableRate) ? (billableRate = 0) : "";

    if (this.state.mounted) {
      const myChartRef = this.chartRef.current.getContext("2d");
      typeof billableChart !== "undefined" ? billableChart.destroy() : "";

      billableChart = new Chart(myChartRef, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [
                (billableHours / billableHoursBasis).toFixed(2) * 100,
                (nonBillable / billableHoursBasis).toFixed(2) * 100,
              ],
              backgroundColor: ["rgb(102, 211, 238)", "rgb(179, 233, 246)"],
            },
          ],

          // These labels appear in the legend and in the tooltips when hovering different arcs
          labels: ["Billable", "Non-billable"],
        },
        options: [],
      });
    }

    return billableRate.toFixed(2);
  }
}
