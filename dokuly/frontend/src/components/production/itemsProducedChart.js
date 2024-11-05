import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";
import { ButtonGroup, Button } from "react-bootstrap";

const ItemsProducedChart = ({ data }) => {
  const [options, setOptions] = useState({
    chart: {
      type: "bar",
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: "datetime",
      title: {
        text: "Assembly date",
      },
    },
    yaxis: {
      title: {
        text: "Number of units assembled",
      },
    },
    title: {
      text: "Units assembled per day",
      align: "center",
    },
    tooltip: {
      x: {
        format: "dd MMM yyyy",
      },
    },
  });

  const [series, setSeries] = useState([]);
  const [timeRange, setTimeRange] = useState("day");

  const aggregateData = (data, range) => {
    const counts = data.reduce((acc, item) => {
      const date = new Date(item.assembly_date);
      let key;

      if (range === "week") {
        const { year, week } = getWeekNumber(date);
        key = `Week ${week} '${year.toString().slice(-2)}`;
      } else if (range === "month") {
        key = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(
          -2,
        )}-01`;
      } else {
        key = item.assembly_date;
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const seriesData = Object.entries(counts).map(([date, count]) => {
      return {
        x: date,
        y: count,
      };
    });

    return seriesData;
  };

  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  };

  useEffect(() => {
    const aggregatedData = aggregateData(data, timeRange);
    setSeries([
      { name: "Assembled Units", data: aggregatedData, color: "#23655d" },
    ]);

    const newOptions = { ...options };

    if (timeRange === "week") {
      newOptions.xaxis = {
        ...newOptions.xaxis,
        type: "category",
        title: {
          text: "Week number",
        },
      };
      newOptions.tooltip = {
        ...newOptions.tooltip,
        x: {
          formatter: function (val) {
            return val;
          },
        },
      };
    } else {
      newOptions.xaxis = {
        ...newOptions.xaxis,
        type: "datetime",
        title: {
          text: "Assembly date",
        },
      };
      newOptions.tooltip = {
        ...newOptions.tooltip,
        x: {
          format: "dd MMM yyyy",
        },
      };
    }

    setOptions(newOptions);
  }, [data, timeRange]);

  return (
    <div>
      <ButtonGroup aria-label="Time range">
        <button
          className="btn btn-background-transparent"
          disabled={timeRange === "day"}
          onClick={() => setTimeRange("day")}
        >
          Day
        </button>
        <button
          className="btn btn-background-transparent"
          disabled={timeRange === "week"}
          onClick={() => setTimeRange("week")}
        >
          Week
        </button>
        <button
          className="btn btn-background-transparent"
          disabled={timeRange === "month"}
          onClick={() => setTimeRange("month")}
        >
          Month
        </button>
      </ButtonGroup>
      <div id="chart">
        <ApexCharts options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
};

export default ItemsProducedChart;
