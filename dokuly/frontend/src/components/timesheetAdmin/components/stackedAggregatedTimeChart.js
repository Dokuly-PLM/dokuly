import React, { useEffect, useState } from "react";
import ApexCharts from "react-apexcharts";

const StackedAggregatedTimeChart = ({ projects, timetracks }) => {
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

    // Initialize series data structure for all dates for each project
    projects.forEach((project) => {
      const projectData = Array.from(categoriesSet)
        .sort()
        .map((date) => ({
          x: date,
          y: 0, // Initialize all dates with 0 hours
        }));

      series.push({ name: project?.title ?? "--", data: projectData });
    });

    // Aggregate hours to series data points for each project
    series.forEach((object, serieIndex) => {
      let cumulativeHours = 0; // Initialize cumulative hours

      Array.from(categoriesSet)
        .sort()
        .forEach((date) => {
          const timetracksForDay = sortedTimetracks.filter(
            (t) => t.project === projects[serieIndex].id && t.date === date
          );
          let dayHours = timetracksForDay.reduce(
            (sum, current) => sum + parseFloat(current.hour),
            0
          );
          cumulativeHours += dayHours;

          const dateIndex = object.data.findIndex((d) => d.x === date);
          object.data[dateIndex].y = parseFloat(cumulativeHours.toFixed(1)); // Set or maintain cumulative hours rounded to 1 decimal place
        });
    });

    // Filter out series with all zero values
    const filteredSeries = series.filter((s) => s.data.some((d) => d.y > 0));

    setChartData({
      ...chartData,
      series: filteredSeries,
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

export default StackedAggregatedTimeChart;
