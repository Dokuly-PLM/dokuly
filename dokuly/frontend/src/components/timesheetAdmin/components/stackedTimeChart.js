import React, { useEffect, useState } from "react";
import ApexCharts from "react-apexcharts";

const StackedTimeChart = ({ projects, timetracks }) => {
  const [chartData, setChartData] = useState({
    series: [],
    options: {
      chart: {
        type: "area",
        stacked: true,
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
      },
      xaxis: {
        type: "datetime",
        categories: [],
        labels: {
          format: "dd/MM",
        },
      },
      tooltip: {
        x: {
          format: "dd/MM/yy",
        },
      },
    },
  });

  const prepareChartData = () => {
    const sortedTimetracks = [...timetracks].sort(
      (a, b) => new Date(a?.date) - new Date(b?.date)
    );
    const series = [];
    const categoriesSet = new Set();

    // Populate categoriesSet
    sortedTimetracks.forEach((t) => {
      categoriesSet.add(t?.date);
    });

    // Filter projects with time tracking
    const projectsWithTimeTracking = projects.filter((project) =>
      sortedTimetracks.some((t) => t.project === project.id)
    );

    // Initialize series data structure for all dates for filtered projects
    projectsWithTimeTracking.forEach((project) => {
      const projectData = Array.from(categoriesSet)
        .sort()
        .map((date) => ({
          x: date,
          y: 0, // Initialize all dates with 0 hours
        }));

      series.push({ name: project?.title ?? "--", data: projectData });
    });

    // Assign hours to series data points for filtered projects
    projectsWithTimeTracking.forEach((project, projectIndex) => {
      sortedTimetracks.forEach((t) => {
        if (t.project === project.id) {
          const dateIndex = series[projectIndex].data.findIndex(
            (d) => d.x === t.date
          );
          if (dateIndex >= 0) {
            series[projectIndex].data[dateIndex].y = parseFloat(
              (
                series[projectIndex].data[dateIndex].y + parseFloat(t.hour)
              ).toFixed(1)
            );
          }
        }
      });
    });

    setChartData({
      ...chartData,
      series,
      options: {
        ...chartData.options,
        xaxis: {
          ...chartData.options.xaxis,
          categories: Array.from(categoriesSet).sort(),
        },
      },
    });
  };

  useEffect(() => {
    prepareChartData();
  }, [timetracks, projects]);

  return (
    <div className="card rounded p-3 mt-2 mb-2">
      <ApexCharts
        options={chartData.options}
        series={chartData.series}
        type="area"
        height={350}
      />
    </div>
  );
};

export default StackedTimeChart;
